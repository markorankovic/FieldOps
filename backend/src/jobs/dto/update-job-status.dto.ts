import { JobStatus } from '@prisma/client';
import { IsEnum, IsString } from 'class-validator';

export class UpdateJobStatusDto {
  @IsEnum(JobStatus)
  status!: JobStatus;

  @IsString()
  actorUserId!: string;
}
