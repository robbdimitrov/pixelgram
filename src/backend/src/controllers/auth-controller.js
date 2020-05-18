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

    this.loginUser(email, password).then((user) => {
      return this.createSessionWithId(user.id);
    }).then((session) => {
      this.createCookie(res, session.id);
      res.status(200).send({
        id: session.userId
      });
    }).catch((error) => {
      printLog(`Creating session failed: ${error}`);
      res.status(401).send({
        message: error.message
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

  loginUser(email, password) {
    return new Promise((resolve, reject) => {
      this.dbClient.getUserWithEmail(email).then((user) => {
        if (!user) {
          return reject(new Error('Incorrect email or password.'));
        }
        validatePassword(password, user.password).then((valid) => {
          if (!valid) {
            return reject(new Error('Incorrect email or password.'));
          }
          resolve(user);
        });
      }).catch((error) => {
        reject(error);
      });
    });
  }

  createSessionWithId(userId) {
    return new Promise((resolve, reject) => {
      generateKey().then((sessionId) => {
        return this.dbClient.createSession(sessionId, userId);
      }).then((result) => {
        resolve(result);
      }).catch((error) => {
        printLog(`Creating session failed: ${error}`);
        reject(error);
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
