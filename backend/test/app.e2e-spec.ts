import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import {
  AuditAction,
  JobPriority,
  JobStatus,
  Role,
} from '@prisma/client';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { hash } from 'bcryptjs';

const seedTestData = async (prisma: PrismaService) => {
  await prisma.auditEntry.deleteMany();
  await prisma.job.deleteMany();
  await prisma.user.deleteMany();

  const admin = await prisma.user.create({
    data: {
      name: 'Ava Dispatcher',
      email: 'admin@fieldops.local',
      passwordHash: await hash('demo-admin', 10),
      role: Role.ADMIN,
    },
  });

  const contractor = await prisma.user.create({
    data: {
      name: 'Maya Patel',
      email: 'maya@fieldops.local',
      passwordHash: await hash('demo-contractor', 10),
      role: Role.CONTRACTOR,
    },
  });

  const scheduledJob = await prisma.job.create({
    data: {
      address: 'North Yard Warehouse',
      description: 'Replace damaged loading bay lights.',
      priority: JobPriority.HIGH,
      status: JobStatus.SCHEDULED,
      assignedUserId: contractor.id,
      scheduledDate: new Date('2026-05-08T09:00:00.000Z'),
    },
  });

  const newJob = await prisma.job.create({
    data: {
      address: 'Brunswick House',
      description: 'Repair reception desk drawer runners.',
      priority: JobPriority.MEDIUM,
      status: JobStatus.NEW,
      scheduledDate: new Date('2026-05-09T14:00:00.000Z'),
    },
  });

  await prisma.auditEntry.createMany({
    data: [
      {
        jobId: scheduledJob.id,
        actorUserId: admin.id,
        action: AuditAction.JOB_CREATED,
        toStatus: JobStatus.SCHEDULED,
      },
      {
        jobId: newJob.id,
        actorUserId: admin.id,
        action: AuditAction.JOB_CREATED,
        toStatus: JobStatus.NEW,
      },
    ],
  });

  return { admin, scheduledJob, newJob };
};

describe('App (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let testData: Awaited<ReturnType<typeof seedTestData>>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    await app.init();
    prisma = moduleFixture.get(PrismaService);
    testData = await seedTestData(prisma);
  });

  afterEach(async () => {
    await app.close();
  });

  it('/api/jobs (GET) returns safe job data without password hashes', async () => {
    const response = await request(app.getHttpServer()).get('/api/jobs').expect(200);

    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body.length).toBeGreaterThan(0);
    expect(response.body[0]).toMatchObject({
      id: expect.any(String),
      address: expect.any(String),
      description: expect.any(String),
      assignedUser: expect.anything(),
      auditEntries: expect.any(Array),
    });

    expect(response.body[0].assignedUser?.passwordHash).toBeUndefined();
    expect(response.body[0].auditEntries[0]?.actorUser?.passwordHash).toBeUndefined();
  });

  it('/api/jobs/:id (GET) returns one safe job by id', async () => {
    const response = await request(app.getHttpServer())
      .get(`/api/jobs/${testData.scheduledJob.id}`)
      .expect(200);

    expect(response.body.id).toBe(testData.scheduledJob.id);
    expect(response.body.assignedUser?.passwordHash).toBeUndefined();
    expect(response.body.auditEntries[0]?.actorUser?.passwordHash).toBeUndefined();
  });

  it('/api/jobs/:id/status (PATCH) updates status and creates an audit entry', async () => {
    const response = await request(app.getHttpServer())
      .patch(`/api/jobs/${testData.scheduledJob.id}/status`)
      .send({
        status: JobStatus.IN_PROGRESS,
        actorUserId: testData.admin.id,
      })
      .expect(200);

    expect(response.body.status).toBe(JobStatus.IN_PROGRESS);
    expect(response.body.auditEntries[0]).toMatchObject({
      action: 'STATUS_CHANGED',
      fromStatus: 'SCHEDULED',
      toStatus: 'IN_PROGRESS',
    });
    expect(response.body.auditEntries[0].actorUser.passwordHash).toBeUndefined();
  });

  it('/api/jobs/:id/status (PATCH) rejects invalid workflow transitions', async () => {
    await request(app.getHttpServer())
      .patch(`/api/jobs/${testData.newJob.id}/status`)
      .send({
        status: JobStatus.COMPLETED,
        actorUserId: testData.admin.id,
      })
      .expect(400);

    const unchangedJob = await prisma.job.findUniqueOrThrow({
      where: { id: testData.newJob.id },
    });

    expect(unchangedJob.status).toBe(JobStatus.NEW);
  });
});
