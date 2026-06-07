import { Injectable } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
  ) {}

  issuePlaceholderTokens(subject: string): Promise<TokenPair> {
    const accessExpiresIn = this.config.getOrThrow<string>("jwt.accessExpiresIn") as never;
    const refreshExpiresIn = this.config.getOrThrow<string>("jwt.refreshExpiresIn") as never;

    return Promise.all([
      this.jwtService.signAsync(
        { sub: subject, typ: "access" },
        {
          secret: this.config.getOrThrow<string>("jwt.accessSecret"),
          expiresIn: accessExpiresIn,
        },
      ),
      this.jwtService.signAsync(
        { sub: subject, typ: "refresh" },
        {
          secret: this.config.getOrThrow<string>("jwt.refreshSecret"),
          expiresIn: refreshExpiresIn,
        },
      ),
    ]).then(([accessToken, refreshToken]) => ({ accessToken, refreshToken }));
  }

  getAuthCapabilities() {
    return {
      mode: "structural",
      strategies: ["jwt-access", "jwt-refresh"],
      passwordHashing: "bcrypt",
    };
  }
}
