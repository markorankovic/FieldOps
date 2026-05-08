import { Role } from '@prisma/client';

export type AuthenticatedUser = {
  id: string;
  name: string;
  email: string;
  role: Role;
};

export type JwtPayload = {
  sub: string;
  name: string;
  email: string;
  role: Role;
};
