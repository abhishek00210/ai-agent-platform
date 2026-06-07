import { IsEmail, IsEnum, IsNotEmpty, IsString } from "class-validator";

export enum OrganizationMemberRoleDto {
  OWNER = "OWNER",
  ADMIN = "ADMIN",
  MEMBER = "MEMBER",
}

export class UpdateOrganizationDto {
  @IsString()
  @IsNotEmpty()
  name!: string;
}

export class InviteMemberDto {
  @IsEmail()
  email!: string;

  @IsEnum(OrganizationMemberRoleDto)
  role!: OrganizationMemberRoleDto;
}

export class UpdateMemberRoleDto {
  @IsEnum(OrganizationMemberRoleDto)
  role!: OrganizationMemberRoleDto;
}
