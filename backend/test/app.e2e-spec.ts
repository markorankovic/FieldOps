import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

describe('App (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    await app.init();
    prisma = moduleFixture.get(PrismaService);
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
    const job = await prisma.job.findFirstOrThrow();

    const response = await request(app.getHttpServer())
      .get(`/api/jobs/${job.id}`)
      .expect(200);

    expect(response.body.id).toBe(job.id);
    expect(response.body.assignedUser?.passwordHash).toBeUndefined();
    expect(response.body.auditEntries[0]?.actorUser?.passwordHash).toBeUndefined();
  });
});
