const {generateKey, verifyPassword} = require('../shared/crypto');
const {logInfo, logError} = require('../shared/logger');

const oneWeek = 7 * 24 * 60 * 60 * 1000;
const rateLimitWindow = 15 * 60 * 1000;
const maxLoginFailures = 5;

function getExpiresAt() {
  return new Date(Date.now() + oneWeek);
}

function normalizeEmail(email) {
  return email.trim().toLowerCase();
}

class AuthController {
  constructor(dbClient) {
    this.dbClient = dbClient;
    this.loginFailures = new Map();
  }

  isRateLimited(key) {
    const now = Date.now();
    const failure = this.loginFailures.get(key);
    if (!failure || failure.resetAt <= now) {
      this.loginFailures.delete(key);
      return false;
    }

    return failure.count >= maxLoginFailures;
  }

  recordLoginFailure(key) {
    const now = Date.now();
    const failure = this.loginFailures.get(key);

    if (!failure || failure.resetAt <= now) {
      this.loginFailures.set(key, {
        count: 1,
        resetAt: now + rateLimitWindow
      });
      return;
    }

    failure.count += 1;
  }

  clearLoginFailures(keys) {
    keys.forEach((key) => this.loginFailures.delete(key));
  }

  createSession(req, res) {
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

    if (rateLimitKeys.some((key) => this.isRateLimited(key))) {
      logError('Creating session failed: Rate limited');
      return res.status(429).send({
        message: 'Incorrect email or password.'
      });
    }

    this.dbClient.deleteExpiredSessions().then(() => {
      return this.dbClient.getUserWithEmail(email);
    }).then((user) => {
      if (!user) {
        return Promise.resolve();
      }
      req.userId = user.id;
      return verifyPassword(password, user.password);
    }).then((valid) => {
      if (!valid) {
        return Promise.resolve();
      }
      return this.dbClient.createSession(generateKey(), req.userId, getExpiresAt());
    }).then((session) => {
      if (session) {
        logInfo('Successfully created session');
        this.clearLoginFailures(rateLimitKeys);
        this.createCookie(res, session.id);
        res.status(200).send({
          id: session.userId
        });
      } else {
        logError('Creating session failed: Incorrect email or password');
        rateLimitKeys.forEach((key) => this.recordLoginFailure(key));
        res.status(401).send({
          message: 'Incorrect email or password.'
        });
      }
    }).catch((error) => {
      logError(`Creating session failed: ${error}`);
      res.status(500).send({
        message: 'Internal Server Error'
      });
    });
  }

  validateSession(req, res, next) {
    const sessionId = req.cookies['session'];

    if (!sessionId) {
      return res.status(401).send({
        message: 'Unauthorized'
      });
    }

    this.dbClient.getSession(sessionId)
      .then((result) => {
        if (result) {
          logInfo('Successfully validated session');
          req.userId = result.userId.toString();
          return this.dbClient.refreshSession(result.id, getExpiresAt())
            .then((session) => {
              if (!session) {
                res.clearCookie('session');
                return res.status(401).send({
                  message: 'Unauthorized'
                });
              }

              this.createCookie(res, session.id);
              next();
            });
        } else {
          logError('Validating session failed: Unauthorized');
          res.clearCookie('session');
          return res.status(401).send({
            message: 'Unauthorized'
          });
        }
      }).catch((error) => {
        logError(`Validating session failed: ${error}`);
        res.status(500).send({
          message: 'Internal Server Error'
        });
      });
  }

  deleteSession(req, res) {
    const sessionId = req.cookies['session'];

    this.dbClient.deleteSession(sessionId)
      .then(() => {
        logInfo('Successfully deleted session');
        res.clearCookie('session');
        res.sendStatus(204);
      }).catch((error) => {
        logError(`Deleting session failed: ${error}`);
        res.status(500).send({
          message: 'Internal Server Error'
        });
      });
  }

  createCookie(res, sessionId) {
    res.cookie('session', sessionId, {
      sameSite: 'strict',
      maxAge: oneWeek,
      httpOnly: true
    });
  }
}

module.exports = AuthController;
