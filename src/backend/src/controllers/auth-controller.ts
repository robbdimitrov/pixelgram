import { generateKey, verifyPassword } from '../shared/crypto';
import { logInfo, logError } from '../shared/logger';
import { Request, Response, NextFunction } from 'express';
import DbClient from '../db';
import { User, Session } from '../types';

const oneWeek = 7 * 24 * 60 * 60 * 1000;
const rateLimitWindow = 15 * 60 * 1000;
const maxLoginFailures = 5;
const sessionIdLength = 28;
const sessionCookieBaseOptions = {
  sameSite: 'strict' as const,
  httpOnly: true,
  secure: process.env.SESSION_COOKIE_SECURE === 'true',
  path: '/'
};
const sessionCookieOptions = {
  ...sessionCookieBaseOptions,
  maxAge: oneWeek
};

function getExpiresAt() {
  return new Date(Date.now() + oneWeek);
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function isValidSessionId(sessionId: any) {
  return typeof sessionId === 'string' &&
    sessionId.length === sessionIdLength &&
    /^[A-Za-z0-9+/=]+$/.test(sessionId);
}

class AuthController {
  dbClient: DbClient;
  loginFailures: Map<string, { count: number, resetAt?: number }> = new Map();
  constructor(dbClient: DbClient) {
    this.dbClient = dbClient;
    this.loginFailures = new Map();
  }

  isRateLimited(key: string) {
    const now = Date.now();
    const failure = this.loginFailures.get(key);
    if (!failure || (failure.resetAt || 0) <= now) {
      this.loginFailures.delete(key);
      return false;
    }

    return failure.count >= maxLoginFailures;
  }

  recordLoginFailure(key: string) {
    const now = Date.now();
    const failure = this.loginFailures.get(key);

    if (!failure || (failure.resetAt || 0) <= now) {
      this.loginFailures.set(key, {
        count: 1,
        resetAt: now + rateLimitWindow
      });
      return;
    }

    failure.count += 1;
  }

  clearLoginFailures(keys: string[]) {
    keys.forEach((key: string) => this.loginFailures.delete(key));
  }

  createSession(req: Request, res: Response) {
    const {password} = req.body;
    const email = typeof req.body.email === 'string' ?
      normalizeEmail(req.body.email) :
      undefined;
    const rateLimitKeys = [`ip:${req.ip}`, `email:${email}`];

    if (!email || !password) {
      logError('Creating session failed: Missing email or password');
      return res.status(400).send({
        message: 'Email and password are required.'
      });
    }

    if (rateLimitKeys.some((key: string) => this.isRateLimited(key))) {
      logError('Creating session failed: Rate limited');
      return res.status(429).send({
        message: 'Incorrect email or password.'
      });
    }

    this.dbClient.deleteExpiredSessions().then(() => {
      return this.dbClient.getUserWithEmail(email);
    }).then((user: User) => {
      if (!user) {
        return Promise.resolve(false);
      }
      req.userId! = user.id;
      return verifyPassword(password, user.password);
    }).then((valid: boolean) => {
      if (!valid) {
        return Promise.resolve();
      }
      return this.dbClient.createSession(generateKey(), req.userId!, getExpiresAt());
    }).then((session: Session) => {
      if (session) {
        logInfo('Successfully created session');
        this.clearLoginFailures(rateLimitKeys);
        this.createCookie(res, session.id);
        res.status(200).send({
          id: session.userId
        });
      } else {
        logError('Creating session failed: Incorrect email or password');
        rateLimitKeys.forEach((key: string) => this.recordLoginFailure(key));
        res.status(401).send({
          message: 'Incorrect email or password.'
        });
      }
    }).catch((error: any) => {
      logError(`Creating session failed: ${error}`);
      res.status(500).send({
        message: 'Internal Server Error'
      });
    });
  }

  validateSession(req: Request, res: Response, next: NextFunction) {
    const sessionId = req.cookies['session'];

    if (!sessionId) {
      return res.status(401).send({
        message: 'Unauthorized'
      });
    }

    if (!isValidSessionId(sessionId)) {
      logError('Validating session failed: Invalid session cookie');
      this.clearSessionCookie(res);
      return res.status(401).send({
        message: 'Unauthorized'
      });
    }

    this.dbClient.getSession(sessionId)
      .then((result: any) => {
        if (result) {
          logInfo('Successfully validated session');
          req.userId! = result.userId.toString();
          return this.dbClient.refreshSession(result.id, getExpiresAt())
            .then((session: Session) => {
              if (!session) {
                this.clearSessionCookie(res);
                return res.status(401).send({
                  message: 'Unauthorized'
                });
              }

              this.createCookie(res, session.id);
              next();
            });
        } else {
          logError('Validating session failed: Unauthorized');
          this.clearSessionCookie(res);
          return res.status(401).send({
            message: 'Unauthorized'
          });
        }
      }).catch((error: any) => {
        logError(`Validating session failed: ${error}`);
        res.status(500).send({
          message: 'Internal Server Error'
        });
      });
  }

  deleteSession(req: Request, res: Response) {
    const sessionId = req.cookies['session'];

    if (!isValidSessionId(sessionId)) {
      this.clearSessionCookie(res);
      return res.sendStatus(204);
    }

    this.dbClient.deleteSession(sessionId)
      .then(() => {
        logInfo('Successfully deleted session');
        this.clearSessionCookie(res);
        res.sendStatus(204);
      }).catch((error: any) => {
        logError(`Deleting session failed: ${error}`);
        res.status(500).send({
          message: 'Internal Server Error'
        });
      });
  }

  createCookie(res: Response, sessionId: string) {
    res.cookie('session', sessionId, sessionCookieOptions);
  }

  clearSessionCookie(res: Response) {
    res.clearCookie('session', sessionCookieBaseOptions);
  }
}

export default AuthController;
