const { generateKey, validatePassword } = require('../shared/crypto');
const printLog = require('../shared/logger');

class AuthController {
  constructor(dbClient) {
    this.dbClient = dbClient;
  }

  createSession(req, res) {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).send({
        message: 'Email and password are required.'
      });
    }

    this.dbClient.getUserWithEmail(email).then((user) => {
      if (!user) {
        return Promise.resolve();
      }
      req.userId = user.id;
      return validatePassword(password, user.password);
    }).then((valid) => {
      if (!valid) {
        return Promise.resolve();
      }
      return this.dbClient.createSession(generateKey(), req.userId);
    }).then((session) => {
      if (session) {
        this.createCookie(res, session.id);
        res.status(200).send({
          id: session.userId
        });
      } else {
        res.status(401).send({
          message: 'Incorrect email or password.'
        });
      }
    }).catch((error) => {
      printLog(`Creating session failed: ${error}`);
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
          req.userId = result.userId.toString();
          this.createCookie(res, result.id);
          next();
        } else {
          res.clearCookie('session');
          return res.status(401).send({
            message: 'Unauthorized'
          });
        }
      }).catch((error) => {
        printLog(`Getting session failed: ${error}`);
        res.status(500).send({
          message: 'Internal Server Error'
        });
      });
  }

  deleteSession(req, res) {
    const sessionId = req.cookies['session'];

    this.dbClient.deleteSession(sessionId)
      .then(() => {
        res.clearCookie('session');
        res.sendStatus(204);
      }).catch((error) => {
        printLog(`Deleting session failed: ${error}`);
        res.status(500).send({
          message: 'Internal Server Error'
        });
      });
  }

  createCookie(res, sessionId) {
    const oneWeek = 7 * 24 * 60 * 60 * 1000;
    res.cookie('session', sessionId, {
      sameSite: 'strict',
      maxAge: oneWeek,
      httpOnly: true
    });
  }
}

module.exports = AuthController;
