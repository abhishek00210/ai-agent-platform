import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { TenantModule } from "../tenant/tenant.module";
import { DocumentController } from "./document.controller";
import { DocumentService } from "./document.service";
import { KnowledgeBaseController } from "./knowledge-base.controller";
import { KnowledgeBaseService } from "./knowledge-base.service";
import { DocumentRepository } from "./repositories/document.repository";
import { KnowledgeBaseRepository } from "./repositories/knowledge-base.repository";

@Module({
  imports: [AuthModule, TenantModule],
  controllers: [KnowledgeBaseController, DocumentController],
  providers: [KnowledgeBaseService, DocumentService, KnowledgeBaseRepository, DocumentRepository],
})
export class KnowledgeBaseModule {}
