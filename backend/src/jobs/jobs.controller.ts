import { Body, Controller, Get, Param, Patch } from '@nestjs/common';
import { UpdateJobStatusDto } from './dto/update-job-status.dto';
import { JobsService } from './jobs.service';

@Controller('jobs')
export class JobsController {
  constructor(private readonly jobsService: JobsService) {}

  @Get()
  findAll() {
    return this.jobsService.findAll();
  }

  @Get(':id')
  findById(@Param('id') id: string) {
    return this.jobsService.findById(id);
  }

  @Patch(':id/status')
  updateStatus(
    @Param('id') id: string,
    @Body() body: UpdateJobStatusDto,
  ) {
    return this.jobsService.updateStatus(id, body.status, body.actorUserId);
  }
}
