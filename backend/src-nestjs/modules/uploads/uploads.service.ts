import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InMemoryStore } from '../../repositories/in-memory.store';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

export const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'application/pdf',
]);

export const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

@Injectable()
export class UploadsService {
  private readonly uploadsDir: string;

  constructor(private readonly store: InMemoryStore) {
    this.uploadsDir = path.join(process.cwd(), 'uploads');
    if (!fs.existsSync(this.uploadsDir)) {
      fs.mkdirSync(this.uploadsDir, { recursive: true });
    }
  }

  private sanitizeFilename(filename: string): string {
    if (!filename) return 'unnamed_file';
    // Neutralize path traversal characters and null bytes
    return filename.replace(/[\/\x00\\]/g, '_').replace(/\.\./g, '_');
  }

  processAndSaveFile(file: Express.Multer.File, user: any) {
    if (!file) {
      throw new BadRequestException('File is required for upload. Field name must be "file".');
    }

    if (file.size > MAX_FILE_SIZE) {
      throw new BadRequestException(
        `File size exceeds maximum allowed limit of ${MAX_FILE_SIZE / (1024 * 1024)}MB.`,
      );
    }

    const mimeType = file.mimetype ? file.mimetype.toLowerCase() : '';
    if (!ALLOWED_MIME_TYPES.has(mimeType)) {
      throw new BadRequestException(
        `Invalid MIME type '${file.mimetype}'. Allowed file types are: ${Array.from(ALLOWED_MIME_TYPES).join(', ')}`,
      );
    }

    // Extract file extension cleanly
    const sanitizedOriginal = this.sanitizeFilename(file.originalname);
    const ext = path.extname(sanitizedOriginal).toLowerCase() || '.bin';

    // Generate safe server-side filename
    const randomHash = crypto.randomBytes(6).toString('hex');
    const safeFilename = `file_${Date.now()}_${randomHash}${ext}`;
    const destinationPath = path.join(this.uploadsDir, safeFilename);

    try {
      fs.writeFileSync(destinationPath, file.buffer);
    } catch (err: any) {
      throw new BadRequestException(`Failed to save uploaded file: ${err.message}`);
    }

    const fileId = `file_${Date.now()}_${randomHash}`;
    const record = {
      id: fileId,
      originalName: sanitizedOriginal,
      filename: safeFilename,
      mimeType: mimeType,
      size: file.size,
      url: `/uploads/${safeFilename}`,
      uploadedBy: user ? user.id || user.role : 'ANONYMOUS',
      uploadedAt: new Date().toISOString(),
    };

    // Store upload metadata in InMemoryStore
    this.store.create('file_uploads', record);

    return record;
  }

  getUploadById(id: string) {
    const record = this.store.findOne('file_uploads', (u: any) => u.id === id);
    if (!record) {
      throw new NotFoundException(`Upload record with ID '${id}' was not found.`);
    }
    return record;
  }

  getAllUploads() {
    return this.store.find('file_uploads', () => true);
  }

  deleteUpload(id: string, user?: any) {
    const record = this.getUploadById(id);

    // Remove physical file from uploads directory
    const physicalPath = path.join(this.uploadsDir, record.filename);
    if (fs.existsSync(physicalPath)) {
      try {
        fs.unlinkSync(physicalPath);
      } catch (err) {
        console.error(`Error removing file ${physicalPath}:`, err);
      }
    }

    // Remove metadata record from InMemoryStore by ID
    this.store.delete('file_uploads', id);

    return {
      success: true,
      message: `File '${record.originalName}' deleted successfully.`,
      id,
    };
  }
}
