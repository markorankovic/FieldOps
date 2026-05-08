import { Body, Controller, Get, Param, Patch, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import type { AuthenticatedUser } from '../auth/auth.types';
import { AssignJobDto } from './dto/assign-job.dto';
import { UpdateJobStatusDto } from './dto/update-job-status.dto';
import { JobsService } from './jobs.service';

@UseGuards(JwtAuthGuard)
@Controller('jobs')
export class JobsController {
  constructor(private readonly jobsService: JobsService) {}

  @Get()
  findAll(@CurrentUser() user: AuthenticatedUser) {
    return this.jobsService.findAll(user);
  }

  @Get(':id')
  findById(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.jobsService.findById(id, user);
  }

  @Patch(':id/status')
  updateStatus(
    @Param('id') id: string,
    @Body() body: UpdateJobStatusDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.jobsService.updateStatus(id, body.status, user);
  }

  @Patch(':id/assign')
  assignJob(
    @Param('id') id: string,
    @Body() body: AssignJobDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.jobsService.assignJob(id, body.assignedUserId, user);
  }
}
