import { generateKey, verifyPassword } from '../shared/crypto';
import { logInfo, logError } from '../shared/logger';
import { Request, Response, NextFunction } from 'express';
import DbClient from '../db';
import { LoginFailureRow, SessionDto } from '../types';

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

function isValidSessionId(sessionId: unknown) {
  return typeof sessionId === 'string' &&
    sessionId.length === sessionIdLength &&
    /^[A-Za-z0-9+/=]+$/.test(sessionId);
}

class AuthController {
  dbClient: DbClient;
  constructor(dbClient: DbClient) {
    this.dbClient = dbClient;
  }

  async isRateLimited(keys: string[]) {
    const now = Date.now();
    const failures = await this.dbClient.getLoginFailures(keys);
    return failures.some((failure: LoginFailureRow) =>
      failure.count >= maxLoginFailures &&
      new Date(failure.reset_at).getTime() > now
    );
  }

  recordLoginFailures(keys: string[]) {
    const resetAt = new Date(Date.now() + rateLimitWindow);
    return Promise.all(keys.map((key: string) =>
      this.dbClient.recordLoginFailure(key, resetAt)
    ));
  }

  clearLoginFailures(keys: string[]) {
    return this.dbClient.clearLoginFailures(keys);
  }

  async createSession(req: Request, res: Response) {
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

    const sessionId = generateKey();

    try {
      await this.dbClient.deleteExpiredSessions();
      await this.dbClient.deleteExpiredLoginFailures();

      if (await this.isRateLimited(rateLimitKeys)) {
        logError('Creating session failed: Rate limited');
        return res.status(429).send({
          message: 'Incorrect email or password.'
        });
      }

      const user = await this.dbClient.getUserWithEmail(email);
      let valid = false;
      if (!user) {
        valid = false;
      } else {
        req.userId! = user.id.toString();
        valid = await verifyPassword(password, user.password);
      }

      if (!valid) {
        logError('Creating session failed: Incorrect email or password');
        await this.recordLoginFailures(rateLimitKeys);
        return res.status(401).send({
          message: 'Incorrect email or password.'
        });
      }

      const session = await this.dbClient.createSession(sessionId, req.userId!, getExpiresAt());
      logInfo('Successfully created session');
      await this.clearLoginFailures(rateLimitKeys);
      this.createCookie(res, sessionId);
      res.status(200).send({
        id: session.userId
      });
    } catch (error: unknown) {
      logError(`Creating session failed: ${error}`);
      res.status(500).send({
        message: 'Internal Server Error'
      });
    }
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
      .then((result: SessionDto | undefined) => {
        if (result) {
          logInfo('Successfully validated session');
          req.userId! = result.userId.toString();
          return this.dbClient.refreshSession(sessionId, getExpiresAt())
            .then((session: SessionDto | undefined) => {
              if (!session) {
                this.clearSessionCookie(res);
                return res.status(401).send({
                  message: 'Unauthorized'
                });
              }

              this.createCookie(res, sessionId);
              next();
            });
        } else {
          logError('Validating session failed: Unauthorized');
          this.clearSessionCookie(res);
          return res.status(401).send({
            message: 'Unauthorized'
          });
        }
      }).catch((error: unknown) => {
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
      }).catch((error: unknown) => {
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
