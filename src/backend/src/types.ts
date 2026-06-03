import { Request, Response, NextFunction } from 'express';
import { ParsedQs } from 'qs';

export interface UserId {
  id: number;
}

export interface UserCredentialsRow extends UserId {
  password: string;
}

export interface UserRow extends UserId {
  name: string;
  username: string;
  email: string;
  avatar: string | null;
  bio: string | null;
  images: string | number;
  likes: string | number;
  created: string;
}

export interface UserDto extends UserId {
  name: string;
  username: string;
  email: string;
  avatar: string | null;
  bio: string | null;
  images: number;
  likes: number;
  created: string;
}

export interface SessionRow {
  id: string;
  user_id: number;
  created: Date | string;
  expires_at: Date | string;
}

export interface SessionDto {
  id: string;
  userId: number;
  created: Date | string;
  expiresAt: Date | string;
}

export interface LoginFailureRow {
  key: string;
  count: number;
  reset_at: Date | string;
}

export interface ImageId {
  id: number;
}

export interface UploadFilename {
  filename: string;
}

export interface ImageRow extends ImageId {
  user_id: number;
  filename: string;
  description: string | null;
  likes: string | number;
  liked: boolean;
  created: string;
}

export interface ImageDto extends ImageId {
  userId: number;
  filename: string;
  description: string | null;
  likes: number;
  liked: boolean;
  created: string;
}

export interface Pagination {
  page: number;
  limit: number;
}

export type QueryValue = string | number | ParsedQs | (string | ParsedQs)[] | undefined;

export interface PaginationQuery {
  page?: QueryValue;
  limit?: QueryValue;
}

export interface AuthenticatedRequest extends Request {
  userId?: string;
  cookies: Record<string, string>;
}

export type RequestQuery = ParsedQs;
export type ExpressMiddleware = (req: AuthenticatedRequest, res: Response, next: NextFunction) => void;
export type ExpressHandler = (req: AuthenticatedRequest, res: Response) => Promise<void> | void;
