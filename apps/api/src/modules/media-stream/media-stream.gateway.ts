import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { HttpAdapterHost } from "@nestjs/core";
import { ConfigService } from "@nestjs/config";
import { createHash, randomUUID } from "node:crypto";
import type { IncomingMessage } from "node:http";
import type { Socket } from "node:net";
import { MediaStreamService } from "./media-stream.service";

const TWILIO_MEDIA_PATH = "/ws/twilio-media";
const WEBSOCKET_GUID = "258EAFA5-E914-47DA-95CA-C5AB0DC85B11";

@Injectable()
export class MediaStreamGateway implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(MediaStreamGateway.name);
  private readonly sockets = new Map<string, Socket>();
  private readonly pendingAudioPackets = new Map<string, number>();
  private httpServer?: NodeHttpServer;
  private readonly upgradeListener: UpgradeListener = (request, socket, head) => {
    void this.handleUpgrade(request, socket, head);
  };

  constructor(
    private readonly httpAdapterHost: HttpAdapterHost,
    private readonly mediaStreams: MediaStreamService,
    private readonly config: ConfigService,
  ) {}

  onModuleInit() {
    const httpServer = this.httpAdapterHost.httpAdapter.getHttpServer() as NodeHttpServer;
    this.httpServer = httpServer;
    httpServer.on("upgrade", this.upgradeListener);
    this.logger.log(`Twilio media stream WebSocket ready at ${TWILIO_MEDIA_PATH}`);
  }

  onModuleDestroy() {
    this.httpServer?.off?.("upgrade", this.upgradeListener);
    for (const socket of this.sockets.values()) {
      socket.destroy();
    }
    this.sockets.clear();
    this.pendingAudioPackets.clear();
  }

  private async handleUpgrade(request: IncomingMessage, socket: Socket, head: Buffer) {
    if (!isTwilioMediaPath(request.url)) {
      return;
    }

    if (!isAllowedOrigin(request.headers.origin)) {
      socket.write("HTTP/1.1 403 Forbidden\r\n\r\n");
      socket.destroy();
      return;
    }

    const websocketKey = request.headers["sec-websocket-key"];
    if (typeof websocketKey !== "string" || !websocketKey.trim()) {
      socket.write("HTTP/1.1 400 Bad Request\r\n\r\n");
      socket.destroy();
      return;
    }

    const connectionId = randomUUID();
    this.sockets.set(connectionId, socket);
    this.mediaStreams.registerConnection(connectionId);
    socket.write(createHandshakeResponse(websocketKey));

    let buffer: Buffer<ArrayBufferLike> = head.length > 0 ? Buffer.from(head) : Buffer.alloc(0);

    socket.on("data", (chunk) => {
      try {
        buffer = Buffer.concat([buffer, chunk]);
        const result = extractFrames(buffer);
        buffer = result.remaining;
        for (const frame of result.frames) {
          void this.handleFrame(connectionId, socket, frame);
        }
      } catch (error) {
        this.logger.warn(`Closing malformed Twilio media socket: ${readError(error)}`);
        socket.destroy();
      }
    });

    socket.on("close", () => {
      this.sockets.delete(connectionId);
      this.pendingAudioPackets.delete(connectionId);
      void this.mediaStreams.handleDisconnect(connectionId);
    });

    socket.on("error", (error) => {
      this.logger.warn(`Twilio media socket error: ${error.message}`);
      this.sockets.delete(connectionId);
      this.pendingAudioPackets.delete(connectionId);
      void this.mediaStreams.handleDisconnect(connectionId);
    });
  }

  private async handleFrame(connectionId: string, socket: Socket, frame: WebSocketFrame) {
    if (frame.opcode === 0x8) {
      socket.end(encodeFrame(Buffer.alloc(0), 0x8));
      return;
    }

    if (frame.opcode === 0x9) {
      socket.write(encodeFrame(frame.payload, 0xa));
      return;
    }

    if (frame.opcode !== 0x1) {
      return;
    }

    try {
      const event = JSON.parse(frame.payload.toString("utf8")) as unknown;
      await this.mediaStreams.handleEvent(
        connectionId,
        event,
        (outboundEvent) => this.writeOutboundEvent(connectionId, socket, outboundEvent),
        () => socket.end(encodeFrame(Buffer.alloc(0), 0x8)),
      );
    } catch (error) {
      this.logger.warn(`Invalid Twilio media frame: ${readError(error)}`);
      socket.write(encodeFrame(Buffer.from(JSON.stringify({ error: "Invalid media frame" })), 0x1));
      socket.end(encodeFrame(Buffer.alloc(0), 0x8));
    }
  }

  private writeOutboundEvent(
    connectionId: string,
    socket: Socket,
    event: Record<string, unknown>,
  ): boolean {
    if (!socket.writable) {
      return false;
    }

    const isAudio = event.event === "media";
    const pending = this.pendingAudioPackets.get(connectionId) ?? 0;
    const maxPackets =
      this.config.get<number>("openai.realtimeMaxBufferedAudioPackets") ?? 100;
    const maxBytes = this.config.get<number>("openai.realtimeMaxBufferedAudioBytes") ?? 65_536;
    if (isAudio && (pending >= maxPackets || socket.writableLength >= maxBytes)) {
      this.logger.warn(`Dropping stale OpenAI audio for ${connectionId}: Twilio backpressure.`);
      return false;
    }

    if (isAudio) {
      this.pendingAudioPackets.set(connectionId, pending + 1);
    }
    socket.write(encodeFrame(Buffer.from(JSON.stringify(event)), 0x1), () => {
      if (isAudio) {
        this.pendingAudioPackets.set(
          connectionId,
          Math.max(0, (this.pendingAudioPackets.get(connectionId) ?? 1) - 1),
        );
      }
    });
    return true;
  }
}

type UpgradeListener = (request: IncomingMessage, socket: Socket, head: Buffer) => void;
type NodeHttpServer = {
  on: (event: string, listener: UpgradeListener) => void;
  off?: (event: string, listener: UpgradeListener) => void;
};

interface WebSocketFrame {
  opcode: number;
  payload: Buffer<ArrayBufferLike>;
}

function isTwilioMediaPath(url?: string): boolean {
  if (!url) {
    return false;
  }

  return url.split("?")[0] === TWILIO_MEDIA_PATH;
}

function isAllowedOrigin(origin?: string): boolean {
  if (!origin) {
    return true;
  }

  try {
    const hostname = new URL(origin).hostname;
    return hostname === "localhost" || hostname === "127.0.0.1" || hostname.endsWith(".twilio.com");
  } catch {
    return false;
  }
}

function createHandshakeResponse(websocketKey: string): string {
  const accept = createHash("sha1").update(`${websocketKey}${WEBSOCKET_GUID}`).digest("base64");

  return [
    "HTTP/1.1 101 Switching Protocols",
    "Upgrade: websocket",
    "Connection: Upgrade",
    `Sec-WebSocket-Accept: ${accept}`,
    "\r\n",
  ].join("\r\n");
}

function extractFrames(buffer: Buffer<ArrayBufferLike>): {
  frames: WebSocketFrame[];
  remaining: Buffer<ArrayBufferLike>;
} {
  const frames: WebSocketFrame[] = [];
  let offset = 0;

  while (buffer.length - offset >= 2) {
    const firstByte = buffer[offset];
    const secondByte = buffer[offset + 1];
    const opcode = firstByte & 0x0f;
    const masked = (secondByte & 0x80) === 0x80;
    let payloadLength = secondByte & 0x7f;
    let headerLength = 2;

    if (payloadLength === 126) {
      if (buffer.length - offset < 4) {
        break;
      }
      payloadLength = buffer.readUInt16BE(offset + 2);
      headerLength = 4;
    } else if (payloadLength === 127) {
      if (buffer.length - offset < 10) {
        break;
      }
      const longLength = buffer.readBigUInt64BE(offset + 2);
      if (longLength > BigInt(Number.MAX_SAFE_INTEGER)) {
        throw new Error("WebSocket payload too large.");
      }
      payloadLength = Number(longLength);
      headerLength = 10;
    }

    const maskLength = masked ? 4 : 0;
    const frameLength = headerLength + maskLength + payloadLength;
    if (buffer.length - offset < frameLength) {
      break;
    }

    const mask = masked ? buffer.subarray(offset + headerLength, offset + headerLength + 4) : null;
    const payloadStart = offset + headerLength + maskLength;
    const payload = Buffer.from(buffer.subarray(payloadStart, payloadStart + payloadLength));

    if (mask) {
      for (let index = 0; index < payload.length; index += 1) {
        payload[index] ^= mask[index % 4];
      }
    }

    frames.push({ opcode, payload });
    offset += frameLength;
  }

  return {
    frames,
    remaining: buffer.subarray(offset),
  };
}

function encodeFrame(payload: Buffer<ArrayBufferLike>, opcode: number): Buffer<ArrayBufferLike> {
  if (payload.length < 126) {
    return Buffer.concat([Buffer.from([0x80 | opcode, payload.length]), payload]);
  }

  const header = Buffer.alloc(4);
  header[0] = 0x80 | opcode;
  header[1] = 126;
  header.writeUInt16BE(payload.length, 2);
  return Buffer.concat([header, payload]);
}

function readError(error: unknown): string {
  return error instanceof Error ? error.message : "Unknown error";
}
