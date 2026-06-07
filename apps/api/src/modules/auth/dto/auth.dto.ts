import { IsEmail, IsString, MinLength } from "class-validator";
import { z } from "zod";

export class SignInDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(12)
  password!: string;
}

export class RefreshTokenDto {
  @IsString()
  refreshToken!: string;
}

export const signInSchema = z.object({
  email: z.string().email().toLowerCase(),
  password: z.string().min(12),
});
