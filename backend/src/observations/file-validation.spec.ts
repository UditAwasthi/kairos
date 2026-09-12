import { BadRequestException } from '@nestjs/common';
import { ObservationType } from '@prisma/client';
import { MAX_UPLOAD_BYTES, validateUpload } from './file-validation';

describe('validateUpload', () => {
  it('accepts plain text', async () => {
    const result = await validateUpload({
      buffer: Buffer.from('hello world'),
      originalFilename: 'note.txt',
      declaredMimeType: 'text/plain',
    });
    expect(result.mimeType).toBe('text/plain');
    expect(result.observationType).toBe(ObservationType.TEXT);
  });

  it('rejects unsupported binary', async () => {
    await expect(
      validateUpload({
        buffer: Buffer.from([0x00, 0x01, 0x02, 0x03, 0x04]),
        originalFilename: 'x.bin',
        declaredMimeType: 'application/octet-stream',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects oversized buffers', async () => {
    await expect(
      validateUpload({
        buffer: Buffer.alloc(MAX_UPLOAD_BYTES + 1, 0x61),
        originalFilename: 'big.txt',
        declaredMimeType: 'text/plain',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
