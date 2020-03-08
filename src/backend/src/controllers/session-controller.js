const { generateKey, validatePassword } = require('../shared/crypto');
const logger = require('../shared/logger');

class SessionController {
  constructor(dbClient) {
    this.dbClient = dbClient;
  }

  createSession(req, res) {
    const body = req.body || {};

    if (!body.email || !body.password) {
      return res.status(400).send({
        message: 'Missing argument(s). Email and password are required.'
      });
    }

    this.dbClient.getUserCredentials(body.email).then((user) => {
      if (!user) {
        throw new Error('User not found.');
      }
      validatePassword(body.password, user.password).then((valid) => {
        if (!valid) {
          throw new Error('Invalid password.');
        }
        generateKey().then((sessionId) => {
          this.dbClient.createSession(sessionId, user.id, body.userAgent)
            .then(() => {
              this.dbClient.getUser(user.id).then((user) => {
                res.cookie('sessionId', sessionId, {
                  sameSite: 'strict',
                  maxAge: 7 * 24 * 60 * 60 * 1000,
                  httpOnly: true
                });

                res.status(200).send({
                  user
                });
              });
            });
        });
      });
    }).catch((error) => {
      logger.logError(`Validating password failed: ${error}`);
      res.status(401).send({
        message: 'Authentication failed. Incorrect email or password.'
      });
    });
  }

  validateSession(req, res, next) {
    const sessionId = req.cookies['sessionId'];

    if (!sessionId) {
      res.status(401).send({
        message: 'Missing session cookie.'
      });
    }

    this.dbClient.getSession(sessionId)
      .then((session) => {
        if (!session) {
          throw new Error('Session doesn\'t exist.');
        }

        req.sessionId = session.id;
        req.userId = session.userId;

        res.cookie('sessionId', sessionId, {
          sameSite: 'strict',
          maxAge: 7 * 24 * 60 * 60 * 1000,
          httpOnly: true
        });

        next();
      }).catch((error) => {
        res.clearCookie('sessionId');
        res.status(401).send({
          message: error.message
        });
      });
  }

  deleteSession(req, res) {
    this.dbClient.deleteSession(req.sessionId)
      .then(() => {
        res.clearCookie('sessionId');
        res.status(204);
      }).catch((error) => {
        res.status(500).send({
          message: error.message
        });
      });
  }
}

module.exports = SessionController;
