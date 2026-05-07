import { AuditAction, JobPriority, JobStatus, Role } from '@prisma/client';

export type UserSummaryDto = {
  id: string;
  name: string;
  email: string;
  role: Role;
};

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
