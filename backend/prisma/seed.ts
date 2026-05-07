import { PrismaClient, AuditAction, JobPriority, JobStatus, Role } from '@prisma/client';
import { hash } from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  await prisma.auditEntry.deleteMany();
  await prisma.job.deleteMany();
  await prisma.user.deleteMany();

  const adminPasswordHash = await hash('demo-admin', 10);
  const contractorPasswordHash = await hash('demo-contractor', 10);

  const admin = await prisma.user.create({
    data: {
      name: 'Ava Dispatcher',
      email: 'admin@fieldops.local',
      passwordHash: adminPasswordHash,
      role: Role.ADMIN,
    },
  });

  const contractorOne = await prisma.user.create({
    data: {
      name: 'Maya Patel',
      email: 'maya@fieldops.local',
      passwordHash: contractorPasswordHash,
      role: Role.CONTRACTOR,
    },
  });

  const contractorTwo = await prisma.user.create({
    data: {
      name: 'Lewis Grant',
      email: 'lewis@fieldops.local',
      passwordHash: contractorPasswordHash,
      role: Role.CONTRACTOR,
    },
  });

  const jobOne = await prisma.job.create({
    data: {
      address: 'North Yard Warehouse',
      description:
        'Replace damaged loading bay lights and confirm safety compliance after a power surge.',
      priority: JobPriority.HIGH,
      status: JobStatus.SCHEDULED,
      assignedUserId: contractorOne.id,
      scheduledDate: new Date('2026-05-08T09:00:00.000Z'),
    },
  });

  const jobTwo = await prisma.job.create({
    data: {
      address: 'Maple Court Apartments',
      description:
        'Investigate boiler pressure drop and inspect the pressure valve, expansion vessel, and pipework.',
      priority: JobPriority.URGENT,
      status: JobStatus.IN_PROGRESS,
      assignedUserId: contractorTwo.id,
      scheduledDate: new Date('2026-05-07T12:30:00.000Z'),
    },
  });

  const jobThree = await prisma.job.create({
    data: {
      address: 'Brunswick House',
      description:
        'Repair the reception desk drawer runners and check neighboring fittings.',
      priority: JobPriority.MEDIUM,
      status: JobStatus.NEW,
      scheduledDate: new Date('2026-05-09T14:00:00.000Z'),
    },
  });

  await prisma.auditEntry.createMany({
    data: [
      {
        jobId: jobOne.id,
        actorUserId: admin.id,
        action: AuditAction.JOB_CREATED,
        toStatus: JobStatus.SCHEDULED,
      },
      {
        jobId: jobTwo.id,
        actorUserId: admin.id,
        action: AuditAction.JOB_CREATED,
        toStatus: JobStatus.IN_PROGRESS,
      },
      {
        jobId: jobThree.id,
        actorUserId: admin.id,
        action: AuditAction.JOB_CREATED,
        toStatus: JobStatus.NEW,
      },
    ],
  });

  console.log('Seeded users:');
  console.log('admin@fieldops.local / demo-admin');
  console.log('maya@fieldops.local / demo-contractor');
  console.log('lewis@fieldops.local / demo-contractor');
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
