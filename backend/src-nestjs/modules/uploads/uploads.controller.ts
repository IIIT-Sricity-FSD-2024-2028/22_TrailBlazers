import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  UseInterceptors,
  UploadedFile,
  UseGuards,
  Req,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiConsumes,
  ApiBody,
  ApiResponse,
  ApiHeader,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { UploadsService } from './uploads.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('Uploads')
@Controller('uploads')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class UploadsController {
  constructor(private readonly uploadsService: UploadsService) {}

  @Post()
  @Roles('EVENT_MANAGER', 'SUPER_ADMIN', 'ADMIN', 'CLIENT', 'ONSITE_COORDINATOR', 'ATTENDEE')
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({
    summary: 'Upload event image or document asset',
    description: 'Accepts multipart/form-data upload file (JPEG, PNG, WebP, GIF, PDF max 5MB). Stores file in backend/uploads/ and metadata in InMemoryStore.',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'Image or document file to upload (JPEG, PNG, WebP, GIF, PDF)',
        },
      },
      required: ['file'],
    },
  })
  @ApiHeader({
    name: 'x-role',
    required: false,
    description: 'Role used for evaluation-time authorization (e.g. EVENT_MANAGER, CLIENT, ATTENDEE)',
  })
  @ApiResponse({ status: 201, description: 'File uploaded successfully' })
  @ApiResponse({ status: 400, description: 'Missing file, invalid MIME type, or file size exceeds 5MB' })
  @ApiResponse({ status: 401, description: 'Unauthorized request' })
  @ApiResponse({ status: 403, description: 'Forbidden role' })
  uploadFile(@UploadedFile() file: Express.Multer.File, @Req() req: any) {
    if (!file) {
      throw new BadRequestException('File is required for upload. Form field name must be "file".');
    }
    const record = this.uploadsService.processAndSaveFile(file, req.user);
    return {
      success: true,
      file: record,
      requestId: req.id || 'req_unknown',
    };
  }

  @Get()
  @Roles('EVENT_MANAGER', 'SUPER_ADMIN', 'ADMIN', 'CLIENT', 'ONSITE_COORDINATOR', 'ATTENDEE')
  @ApiOperation({ summary: 'List all uploaded file metadata' })
  @ApiHeader({
    name: 'x-role',
    required: false,
    description: 'Role used for evaluation-time authorization',
  })
  @ApiResponse({ status: 200, description: 'Returns array of file metadata records' })
  getAllUploads() {
    return this.uploadsService.getAllUploads();
  }

  @Get(':id')
  @Roles('EVENT_MANAGER', 'SUPER_ADMIN', 'ADMIN', 'CLIENT', 'ONSITE_COORDINATOR', 'ATTENDEE')
  @ApiOperation({ summary: 'Get metadata for specific uploaded file by ID' })
  @ApiHeader({
    name: 'x-role',
    required: false,
    description: 'Role used for evaluation-time authorization',
  })
  @ApiResponse({ status: 200, description: 'Returns file metadata record' })
  @ApiResponse({ status: 404, description: 'File metadata not found' })
  getUploadById(@Param('id') id: string) {
    return this.uploadsService.getUploadById(id);
  }

  @Delete(':id')
  @Roles('EVENT_MANAGER', 'SUPER_ADMIN', 'ADMIN')
  @ApiOperation({ summary: 'Delete uploaded file and metadata' })
  @ApiHeader({
    name: 'x-role',
    required: false,
    description: 'Role used for evaluation-time authorization',
  })
  @ApiResponse({ status: 200, description: 'File deleted successfully' })
  @ApiResponse({ status: 404, description: 'File not found' })
  deleteUpload(@Param('id') id: string, @Req() req: any) {
    return this.uploadsService.deleteUpload(id, req.user);
  }
}
