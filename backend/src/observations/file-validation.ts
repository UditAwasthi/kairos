import { BadRequestException } from '@nestjs/common';
import { ObservationType } from '@prisma/client';
import FileType from 'file-type';
import * as path from 'path';

export const MAX_UPLOAD_BYTES = 20 * 1024 * 1024; // 20 MB

const ALLOWED_BY_MIME: Record<
  string,
  { extensions: string[]; type: ObservationType }
> = {
  'application/pdf': { extensions: ['.pdf'], type: ObservationType.PDF },
  'text/plain': {
    extensions: ['.txt', '.text', '.md'],
    type: ObservationType.TEXT,
  },
  'image/jpeg': { extensions: ['.jpg', '.jpeg'], type: ObservationType.IMAGE },
  'image/png': { extensions: ['.png'], type: ObservationType.IMAGE },
  'image/webp': { extensions: ['.webp'], type: ObservationType.IMAGE },
  'image/gif': { extensions: ['.gif'], type: ObservationType.IMAGE },
};

export type ValidatedUpload = {
  mimeType: string;
  extension: string;
  observationType: ObservationType;
  safeFilename: string;
};

export async function validateUpload(params: {
  buffer: Buffer;
  originalFilename: string;
  declaredMimeType?: string;
}): Promise<ValidatedUpload> {
  const { buffer, originalFilename, declaredMimeType } = params;

  if (!buffer?.length) {
    throw new BadRequestException({
      error: {
        code: 'EMPTY_FILE',
        message: 'Uploaded file is empty.',
      },
    });
  }

  if (buffer.byteLength > MAX_UPLOAD_BYTES) {
    throw new BadRequestException({
      error: {
        code: 'FILE_TOO_LARGE',
        message: `File exceeds the maximum size of ${MAX_UPLOAD_BYTES} bytes.`,
      },
    });
  }

  const detected = await FileType.fromBuffer(buffer);
  const extension = path.extname(originalFilename).toLowerCase();
  const safeFilename = sanitizeFilename(originalFilename);

  // text/plain often has no magic bytes — fall back carefully
  let mimeType: string | undefined = detected?.mime;
  if (!mimeType) {
    if (
      declaredMimeType === 'text/plain' ||
      ['.txt', '.text', '.md'].includes(extension)
    ) {
      if (!looksLikeUtf8Text(buffer)) {
        throw new BadRequestException({
          error: {
            code: 'UNSUPPORTED_FILE',
            message: 'Unsupported or unrecognized file type.',
          },
        });
      }
      mimeType = 'text/plain';
    }
  }

  if (!mimeType || !ALLOWED_BY_MIME[mimeType]) {
    throw new BadRequestException({
      error: {
        code: 'UNSUPPORTED_FILE',
        message:
          'Unsupported file type. Allowed: PDF, TXT, JPEG, PNG, WebP, GIF.',
      },
    });
  }

  const rule = ALLOWED_BY_MIME[mimeType];
  if (extension && !rule.extensions.includes(extension)) {
    throw new BadRequestException({
      error: {
        code: 'UNSUPPORTED_FILE',
        message: 'File extension does not match the detected file type.',
      },
    });
  }

  return {
    mimeType,
    extension: extension || rule.extensions[0],
    observationType: rule.type,
    safeFilename,
  };
}

export function sanitizeFilename(filename: string): string {
  const base = path
    .basename(filename || 'upload')
    .replace(/[^\w.\-()+ ]+/g, '_');
  const trimmed = base.trim().slice(0, 180);
  return trimmed || 'upload';
}

function looksLikeUtf8Text(buffer: Buffer): boolean {
  // Reject buffers with too many nulls / control chars (except common whitespace)
  const sample = buffer.subarray(0, Math.min(buffer.length, 4096));
  let suspicious = 0;
  for (const byte of sample) {
    if (byte === 0) return false;
    if (byte < 7 || (byte > 14 && byte < 32)) {
      suspicious += 1;
    }
  }
  return suspicious / sample.length < 0.05;
}
