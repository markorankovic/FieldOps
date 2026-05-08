import { ForbiddenException, Injectable } from '@nestjs/common';
import { Role } from '@prisma/client';
import type { AuthenticatedUser } from '../auth/auth.types';
import { PrismaService } from '../prisma/prisma.service';
import { UserSummaryDto } from './dto/user-summary.dto';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  findById(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
    });
  }

  findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
    });
  }

  async findSafeById(id: string): Promise<UserSummaryDto | null> {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
    });

    return user ? this.toUserSummary(user) : null;
  }

  async findAllSafe(
    user: AuthenticatedUser,
    role?: Role,
  ): Promise<UserSummaryDto[]> {
    if (user.role !== Role.ADMIN) {
      throw new ForbiddenException('Only admins can view users.');
    }

    const users = await this.prisma.user.findMany({
      where: role ? { role } : undefined,
      orderBy: [{ name: 'asc' }],
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
    });

    return users.map((entry) => this.toUserSummary(entry));
  }

  toUserSummary(user: {
    id: string;
    name: string;
    email: string;
    role: UserSummaryDto['role'];
  }): UserSummaryDto {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    };
  }
}
