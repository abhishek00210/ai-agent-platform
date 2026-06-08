import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { memoryStorage } from "multer";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import type { JwtPayload } from "../auth/auth.types";
import { TenantService } from "../tenant/tenant.service";
import { DocumentService } from "./document.service";
import { UploadPdfDto } from "./dto/document.dto";
import { FileUploadService } from "./file-upload.service";

const MAX_PDF_SIZE_BYTES = 25 * 1024 * 1024;

@UseGuards(JwtAuthGuard)
@Controller("documents")
export class PdfUploadController {
  constructor(
    private readonly fileUploadService: FileUploadService,
    private readonly documentService: DocumentService,
    private readonly tenant: TenantService,
  ) {}

  @Post("upload")
  @UseInterceptors(
    FileInterceptor("file", {
      storage: memoryStorage(),
      limits: {
        fileSize: MAX_PDF_SIZE_BYTES,
        files: 1,
      },
    }),
  )
  uploadPdf(
    @CurrentUser() user: JwtPayload,
    @Body() body: UploadPdfDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return this.fileUploadService.uploadPdf(this.tenant.fromUser(user), body, file);
  }

  @Get(":id/download")
  download(@CurrentUser() user: JwtPayload, @Param("id", ParseUUIDPipe) documentId: string) {
    return this.documentService.createDownloadAccess(this.tenant.fromUser(user), documentId);
  }
}
