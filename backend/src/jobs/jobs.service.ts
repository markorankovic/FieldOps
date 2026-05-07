import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class JobsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.job.findMany({
      orderBy: [{ scheduledDate: 'asc' }],
      include: {
        assignedUser: true,
        auditEntries: {
          orderBy: [{ createdAt: 'desc' }],
          include: {
            actorUser: true,
          },
        },
      },
    });
  }

  async findById(id: string) {
    const job = await this.prisma.job.findUnique({
      where: { id },
      include: {
        assignedUser: true,
        auditEntries: {
          orderBy: [{ createdAt: 'desc' }],
          include: {
            actorUser: true,
          },
        },
      },
    });

    if (!job) {
      throw new NotFoundException(`Job ${id} was not found.`);
    }

    return job;
  }
}
