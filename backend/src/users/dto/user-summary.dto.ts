import { Role } from '@prisma/client';

export type UserSummaryDto = {
  id: string;
  name: string;
  email: string;
  role: Role;
};
