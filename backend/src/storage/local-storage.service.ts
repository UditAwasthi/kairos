import { Injectable } from '@nestjs/common';
import { promises as fs } from 'fs';
import * as path from 'path';
import type { StorageService, StoredObject } from './storage.types';

@Injectable()
export class LocalStorageService implements StorageService {
  private readonly rootDir: string;

  constructor() {
    this.rootDir =
      process.env.STORAGE_ROOT ?? path.join(process.cwd(), 'storage');
  }

  async upload(
    key: string,
    data: Buffer,
    contentType: string,
  ): Promise<StoredObject> {
    const absolutePath = this.resolveSafePath(key);
    await fs.mkdir(path.dirname(absolutePath), { recursive: true });
    await fs.writeFile(absolutePath, data);

    return {
      key,
      size: data.byteLength,
      contentType,
    };
  }

  async get(key: string): Promise<Buffer> {
    const absolutePath = this.resolveSafePath(key);
    return fs.readFile(absolutePath);
  }

  async delete(key: string): Promise<void> {
    const absolutePath = this.resolveSafePath(key);
    try {
      await fs.unlink(absolutePath);
    } catch (error) {
      const err = error as NodeJS.ErrnoException;
      if (err.code !== 'ENOENT') {
        throw error;
      }
    }
  }

  private resolveSafePath(key: string): string {
    const normalizedKey = key.replace(/\\/g, '/').replace(/^\/+/, '');
    if (
      !normalizedKey ||
      normalizedKey.includes('..') ||
      path.isAbsolute(normalizedKey)
    ) {
      throw new Error('Invalid storage key');
    }

    const absolutePath = path.resolve(this.rootDir, normalizedKey);
    const rootResolved = path.resolve(this.rootDir);
    if (
      absolutePath !== rootResolved &&
      !absolutePath.startsWith(rootResolved + path.sep)
    ) {
      throw new Error('Invalid storage key');
    }

    return absolutePath;
  }
}
