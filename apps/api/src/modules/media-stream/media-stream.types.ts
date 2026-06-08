export type TwilioMediaStreamEvent =
  | TwilioConnectedEvent
  | TwilioStartEvent
  | TwilioMediaEvent
  | TwilioStopEvent;

export interface TwilioConnectedEvent {
  event: "connected";
  protocol?: string;
  version?: string;
}

export interface TwilioStartEvent {
  event: "start";
  sequenceNumber?: string;
  streamSid?: string;
  start: {
    streamSid: string;
    callSid: string;
    accountSid?: string;
    tracks?: string[];
    mediaFormat?: {
      encoding?: string;
      sampleRate?: number;
      channels?: number;
    };
  };
}

export interface TwilioMediaEvent {
  event: "media";
  sequenceNumber?: string;
  streamSid: string;
  media: {
    track?: string;
    chunk?: string;
    timestamp?: string;
    payload?: string;
  };
}

export interface TwilioStopEvent {
  event: "stop";
  sequenceNumber?: string;
  streamSid: string;
  stop?: {
    accountSid?: string;
    callSid?: string;
  };
}

export interface MediaStreamConnectionState {
  connectionId: string;
  streamSid?: string;
  twilioCallSid?: string;
  connectedAt: Date;
}
