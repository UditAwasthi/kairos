import { Injectable } from '@nestjs/common';
import type { User } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findOrCreateByClerkId(clerkUserId: string): Promise<User> {
    return this.prisma.user.upsert({
      where: { clerkUserId },
      create: { clerkUserId },
      update: {},
    });
  }
}
