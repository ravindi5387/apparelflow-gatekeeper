import type { Request } from "express";
import type { UserRole } from "@prisma/client";

export interface AuthUser {
  id: number;
  email: string;
  role: UserRole;
  fullName: string;
}

export interface AuthRequest extends Request {
  user?: AuthUser;
}
