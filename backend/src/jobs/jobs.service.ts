import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  AuditEntryResponseDto,
  JobResponseDto,
  UserSummaryDto,
} from './dto/job-response.dto';

const userSummarySelect = {
  id: true,
  name: true,
  email: true,
  role: true,
} as const;

@Injectable()
export class JobsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(): Promise<JobResponseDto[]> {
    const jobs = await this.prisma.job.findMany({
      orderBy: [{ scheduledDate: 'asc' }],
      include: {
        assignedUser: {
          select: userSummarySelect,
        },
        auditEntries: {
          orderBy: [{ createdAt: 'desc' }],
          include: {
            actorUser: {
              select: userSummarySelect,
            },
          },
        },
      },
    });

    return jobs.map((job) => this.toJobResponse(job));
  }

  async findById(id: string): Promise<JobResponseDto> {
    const job = await this.prisma.job.findUnique({
      where: { id },
      include: {
        assignedUser: {
          select: userSummarySelect,
        },
        auditEntries: {
          orderBy: [{ createdAt: 'desc' }],
          include: {
            actorUser: {
              select: userSummarySelect,
            },
          },
        },
      },
    });

    if (!job) {
      throw new NotFoundException(`Job ${id} was not found.`);
    }

    return this.toJobResponse(job);
  }

  private toUserSummary(user: {
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

  private toAuditEntryResponse(entry: {
    id: string;
    action: AuditEntryResponseDto['action'];
    fromStatus: AuditEntryResponseDto['fromStatus'];
    toStatus: AuditEntryResponseDto['toStatus'];
    createdAt: Date;
    actorUser: {
      id: string;
      name: string;
      email: string;
      role: UserSummaryDto['role'];
    };
  }): AuditEntryResponseDto {
    return {
      id: entry.id,
      action: entry.action,
      fromStatus: entry.fromStatus,
      toStatus: entry.toStatus,
      createdAt: entry.createdAt,
      actorUser: this.toUserSummary(entry.actorUser),
    };
  }

  private toJobResponse(job: {
    id: string;
    address: string;
    description: string;
    priority: JobResponseDto['priority'];
    status: JobResponseDto['status'];
    scheduledDate: Date;
    updatedAt: Date;
    assignedUser: {
      id: string;
      name: string;
      email: string;
      role: UserSummaryDto['role'];
    } | null;
    auditEntries: Array<{
      id: string;
      action: AuditEntryResponseDto['action'];
      fromStatus: AuditEntryResponseDto['fromStatus'];
      toStatus: AuditEntryResponseDto['toStatus'];
      createdAt: Date;
      actorUser: {
        id: string;
        name: string;
        email: string;
        role: UserSummaryDto['role'];
      };
    }>;
  }): JobResponseDto {
    return {
      id: job.id,
      address: job.address,
      description: job.description,
      priority: job.priority,
      status: job.status,
      scheduledDate: job.scheduledDate,
      updatedAt: job.updatedAt,
      assignedUser: job.assignedUser ? this.toUserSummary(job.assignedUser) : null,
      auditEntries: job.auditEntries.map((entry) => this.toAuditEntryResponse(entry)),
    };
  }
}
