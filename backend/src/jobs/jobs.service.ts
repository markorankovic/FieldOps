import { AuditAction, JobStatus, Prisma, Role } from '@prisma/client';
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  AuditEntryResponseDto,
  JobResponseDto,
} from './dto/job-response.dto';
import { canTransitionStatus } from './workflow';
import { UserSummaryDto } from '../users/dto/user-summary.dto';
import { AuthenticatedUser } from '../auth/auth.types';

const userSummarySelect = {
  id: true,
  name: true,
  email: true,
  role: true,
} as const;

const jobWithRelationsInclude = Prisma.validator<Prisma.JobInclude>()({
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
});

@Injectable()
export class JobsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(user: AuthenticatedUser): Promise<JobResponseDto[]> {
    const jobs = await this.prisma.job.findMany({
      where:
        user.role === Role.ADMIN ? undefined : { assignedUserId: user.id },
      orderBy: [{ scheduledDate: 'asc' }],
      include: jobWithRelationsInclude,
    });

    return jobs.map((job) => this.toJobResponse(job));
  }

  async findById(id: string, user: AuthenticatedUser): Promise<JobResponseDto> {
    const job = await this.findJobRecordById(id);

    if (!job) {
      throw new NotFoundException(`Job ${id} was not found.`);
    }

    this.assertCanAccessJob(job.assignedUser?.id ?? null, user);

    return this.toJobResponse(job);
  }

  async updateStatus(
    id: string,
    nextStatus: JobStatus,
    actor: AuthenticatedUser,
  ): Promise<JobResponseDto> {
    const job = await this.prisma.job.findUnique({
      where: { id },
      select: {
        id: true,
        status: true,
        assignedUserId: true,
      },
    });

    if (!job) {
      throw new NotFoundException(`Job ${id} was not found.`);
    }

    this.assertCanAccessJob(job.assignedUserId, actor);

    if (!canTransitionStatus(job.status, nextStatus)) {
      throw new BadRequestException(
        `Cannot transition job ${id} from ${job.status} to ${nextStatus}.`,
      );
    }

    const updatedJob = await this.prisma.$transaction(async (tx) => {
      await tx.auditEntry.create({
        data: {
          jobId: job.id,
          actorUserId: actor.id,
          action: AuditAction.STATUS_CHANGED,
          fromStatus: job.status,
          toStatus: nextStatus,
        },
      });

      await tx.job.update({
        where: { id: job.id },
        data: {
          status: nextStatus,
        },
      });

      return tx.job.findUnique({
        where: { id: job.id },
        include: jobWithRelationsInclude,
      });
    });

    if (!updatedJob) {
      throw new NotFoundException(`Job ${id} was not found after update.`);
    }

    return this.toJobResponse(updatedJob);
  }

  async assignJob(
    id: string,
    assignedUserId: string,
    actor: AuthenticatedUser,
  ): Promise<JobResponseDto> {
    if (actor.role !== Role.ADMIN) {
      throw new ForbiddenException('Only admins can assign jobs.');
    }

    const [job, assignee] = await Promise.all([
      this.prisma.job.findUnique({
        where: { id },
        select: { id: true },
      }),
      this.prisma.user.findUnique({
        where: { id: assignedUserId },
        select: { id: true, role: true },
      }),
    ]);

    if (!job) {
      throw new NotFoundException(`Job ${id} was not found.`);
    }

    if (!assignee) {
      throw new NotFoundException(`User ${assignedUserId} was not found.`);
    }

    if (assignee.role !== Role.CONTRACTOR) {
      throw new BadRequestException('Jobs can only be assigned to contractors.');
    }

    const updatedJob = await this.prisma.$transaction(async (tx) => {
      await tx.job.update({
        where: { id: job.id },
        data: {
          assignedUserId,
        },
      });

      await tx.auditEntry.create({
        data: {
          jobId: job.id,
          actorUserId: actor.id,
          action: AuditAction.JOB_ASSIGNED,
        },
      });

      return tx.job.findUnique({
        where: { id: job.id },
        include: jobWithRelationsInclude,
      });
    });

    if (!updatedJob) {
      throw new NotFoundException(`Job ${id} was not found after assignment.`);
    }

    return this.toJobResponse(updatedJob);
  }

  private findJobRecordById(id: string) {
    return this.prisma.job.findUnique({
      where: { id },
      include: jobWithRelationsInclude,
    });
  }

  private assertCanAccessJob(
    assignedUserId: string | null,
    user: AuthenticatedUser,
  ) {
    if (user.role === Role.ADMIN) {
      return;
    }

    if (assignedUserId !== user.id) {
      throw new ForbiddenException('You do not have access to this job.');
    }
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
