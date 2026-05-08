import { AuditAction, JobPriority, JobStatus } from '@prisma/client';
import { UserSummaryDto } from '../../users/dto/user-summary.dto';

export type AuditEntryResponseDto = {
  id: string;
  action: AuditAction;
  fromStatus: JobStatus | null;
  toStatus: JobStatus | null;
  createdAt: Date;
  actorUser: UserSummaryDto;
};

export type JobResponseDto = {
  id: string;
  address: string;
  description: string;
  priority: JobPriority;
  status: JobStatus;
  scheduledDate: Date;
  updatedAt: Date;
  assignedUser: UserSummaryDto | null;
  auditEntries: AuditEntryResponseDto[];
};
