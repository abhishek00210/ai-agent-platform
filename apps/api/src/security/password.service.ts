import { Injectable } from "@nestjs/common";
import bcrypt from "bcryptjs";

@Injectable()
export class PasswordService {
  private readonly rounds = 12;

  hash(password: string): Promise<string> {
    return bcrypt.hash(password, this.rounds);
  }

  verify(password: string, passwordHash: string): Promise<boolean> {
    return bcrypt.compare(password, passwordHash);
  }
}
