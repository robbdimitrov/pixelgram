import { Request, Response, NextFunction } from 'express';

export interface User {
  id: string;
  name: string;
  username: string;
  email: string;
  password?: string;
  avatar: string | null;
  bio: string | null;
  createdAt: Date;
}

export interface Session {
  id: string;
  userId: string;
  expiresAt: Date;
}

export interface Image {
  id: string;
  userId: string;
  filename: string;
  description: string | null;
  createdAt: Date;
}

export interface AuthenticatedRequest extends Request {
  userId?: string;
  cookies: Record<string, string>;
}

export type ExpressMiddleware = (req: AuthenticatedRequest, res: Response, next: NextFunction) => void;
export type ExpressHandler = (req: AuthenticatedRequest, res: Response) => Promise<any> | void;
