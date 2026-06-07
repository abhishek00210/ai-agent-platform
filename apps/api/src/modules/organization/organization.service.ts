import { Injectable } from "@nestjs/common";
import { OrganizationRepository } from "./repositories/organization.repository";

@Injectable()
export class OrganizationService {
  constructor(private readonly organizations: OrganizationRepository) {}

  capabilities() {
    return { resource: "organizations", mode: "repository-ready" };
  }
}
