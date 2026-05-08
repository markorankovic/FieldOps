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
import { JwtService } from '@nestjs/jwt';

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

  const contractorTwo = await prisma.user.create({
    data: {
      name: 'Lewis Grant',
      email: 'lewis@fieldops.local',
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

  const inProgressJob = await prisma.job.create({
    data: {
      address: 'Maple Court Apartments',
      description: 'Investigate boiler pressure drop.',
      priority: JobPriority.URGENT,
      status: JobStatus.IN_PROGRESS,
      assignedUserId: contractorTwo.id,
      scheduledDate: new Date('2026-05-07T12:30:00.000Z'),
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
      {
        jobId: inProgressJob.id,
        actorUserId: admin.id,
        action: AuditAction.JOB_CREATED,
        toStatus: JobStatus.IN_PROGRESS,
      },
    ],
  });

  return { admin, contractor, contractorTwo, scheduledJob, newJob, inProgressJob };
};

describe('App (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let jwtService: JwtService;
  let testData: Awaited<ReturnType<typeof seedTestData>>;
  let adminToken: string;
  let contractorToken: string;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    await app.init();
    prisma = moduleFixture.get(PrismaService);
    jwtService = moduleFixture.get(JwtService);
    testData = await seedTestData(prisma);
    adminToken = await login('admin@fieldops.local', 'demo-admin');
    contractorToken = await login('maya@fieldops.local', 'demo-contractor');
  });

  afterEach(async () => {
    await app.close();
  });

  const login = async (email: string, password: string) => {
    const response = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email, password })
      .expect(201);

    return response.body.accessToken as string;
  };

  it('/api/auth/login (POST) logs in successfully and never returns passwordHash', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({
        email: 'admin@fieldops.local',
        password: 'demo-admin',
      })
      .expect(201);

    expect(response.body.accessToken).toEqual(expect.any(String));
    expect(response.body.user).toMatchObject({
      email: 'admin@fieldops.local',
      role: 'ADMIN',
    });
    expect(response.body.user.passwordHash).toBeUndefined();
  });

  it('/api/auth/login (POST) rejects invalid credentials', async () => {
    await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({
        email: 'admin@fieldops.local',
        password: 'wrong-password',
      })
      .expect(401);
  });

  it('/api/auth/me (GET) returns the current user', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    expect(response.body).toMatchObject({
      email: 'admin@fieldops.local',
      role: 'ADMIN',
    });
    expect(response.body.passwordHash).toBeUndefined();
  });

  it('/api/auth/me (GET) rejects expired tokens', async () => {
    const expiredToken = await jwtService.signAsync(
      {
        sub: testData.admin.id,
        name: testData.admin.name,
        email: testData.admin.email,
        role: testData.admin.role,
      },
      {
        expiresIn: -1,
      },
    );

    await request(app.getHttpServer())
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${expiredToken}`)
      .expect(401);
  });

  it('/api/jobs (GET) returns safe job data without password hashes', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/jobs')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

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

  it('/api/jobs (GET) lets contractors see only assigned jobs', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/jobs')
      .set('Authorization', `Bearer ${contractorToken}`)
      .expect(200);

    expect(response.body).toHaveLength(1);
    expect(response.body[0].assignedUser.id).toBe(testData.contractor.id);
  });

  it('/api/jobs/:id (GET) returns one safe job by id', async () => {
    const response = await request(app.getHttpServer())
      .get(`/api/jobs/${testData.scheduledJob.id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    expect(response.body.id).toBe(testData.scheduledJob.id);
    expect(response.body.assignedUser?.passwordHash).toBeUndefined();
    expect(response.body.auditEntries[0]?.actorUser?.passwordHash).toBeUndefined();
  });

  it('/api/jobs/:id (GET) blocks contractors from another contractor job', async () => {
    await request(app.getHttpServer())
      .get(`/api/jobs/${testData.inProgressJob.id}`)
      .set('Authorization', `Bearer ${contractorToken}`)
      .expect(403);
  });

  it('/api/jobs/:id/status (PATCH) updates status and creates an audit entry', async () => {
    const response = await request(app.getHttpServer())
      .patch(`/api/jobs/${testData.scheduledJob.id}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        status: JobStatus.IN_PROGRESS,
      })
      .expect(200);

    expect(response.body.status).toBe(JobStatus.IN_PROGRESS);
    expect(response.body.auditEntries[0]).toMatchObject({
      action: 'STATUS_CHANGED',
      fromStatus: 'SCHEDULED',
      toStatus: 'IN_PROGRESS',
    });
    expect(response.body.auditEntries[0].actorUser.id).toBe(testData.admin.id);
    expect(response.body.auditEntries[0].actorUser.passwordHash).toBeUndefined();
  });

  it('/api/jobs/:id/status (PATCH) blocks contractors from updating another contractor job', async () => {
    await request(app.getHttpServer())
      .patch(`/api/jobs/${testData.inProgressJob.id}/status`)
      .set('Authorization', `Bearer ${contractorToken}`)
      .send({
        status: JobStatus.BLOCKED,
      })
      .expect(403);
  });

  it('/api/jobs/:id/status (PATCH) rejects invalid workflow transitions', async () => {
    await request(app.getHttpServer())
      .patch(`/api/jobs/${testData.newJob.id}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        status: JobStatus.COMPLETED,
      })
      .expect(400);

    const unchangedJob = await prisma.job.findUniqueOrThrow({
      where: { id: testData.newJob.id },
    });

    expect(unchangedJob.status).toBe(JobStatus.NEW);
  });

  it('/api/jobs/:id/assign (PATCH) lets admins assign jobs', async () => {
    const response = await request(app.getHttpServer())
      .patch(`/api/jobs/${testData.newJob.id}/assign`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        assignedUserId: testData.contractorTwo.id,
      })
      .expect(200);

    expect(response.body.assignedUser.id).toBe(testData.contractorTwo.id);
    expect(response.body.auditEntries[0].action).toBe('JOB_ASSIGNED');
  });

  it('/api/jobs/:id/assign (PATCH) blocks contractors from assigning jobs', async () => {
    await request(app.getHttpServer())
      .patch(`/api/jobs/${testData.newJob.id}/assign`)
      .set('Authorization', `Bearer ${contractorToken}`)
      .send({
        assignedUserId: testData.contractorTwo.id,
      })
      .expect(403);
  });

  it('/api/users (GET) lets admins fetch contractor options', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/users?role=CONTRACTOR')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    expect(response.body).toHaveLength(2);
    expect(response.body[0].role).toBe('CONTRACTOR');
    expect(response.body[0].passwordHash).toBeUndefined();
  });

  it('/api/users (GET) blocks contractors from fetching user lists', async () => {
    await request(app.getHttpServer())
      .get('/api/users?role=CONTRACTOR')
      .set('Authorization', `Bearer ${contractorToken}`)
      .expect(403);
  });
});
