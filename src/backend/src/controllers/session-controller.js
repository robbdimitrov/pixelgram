const { generateKey, validatePassword } = require('../shared/crypto');

class SessionController {
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
      res.status(200).send(session.userId);
    }).catch((error) => {
      res.status(401).send({
        message: error.message
      });
    });
  }

  validateSession(req, res, next) {
    const sessionId = req.cookies['session'];

    if (!sessionId) {
      return res.status(401).send({
        message: 'Missing session cookie.'
      });
    }

    this.dbClient.getSession(sessionId)
      .then((session) => {
        if (!session) {
          throw new Error('Session doesn\'t exist.');
        }

        req.sessionId = session.id;
        req.userId = session.userId.toString();

        this.createCookie(res, sessionId);

        next();
      }).catch((error) => {
        res.clearCookie('session');
        res.status(401).send({
          message: error.message
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
        res.status(500).send({
          message: error.message
        });
      });
  }

  // Private

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
      }).catch((error) => reject(error));
    });
  }

  createSessionWithId(userId) {
    return new Promise((resolve, reject) => {
      generateKey().then((sessionId) => {
        this.dbClient.createSession(sessionId, userId)
          .then((session) => resolve(session))
          .catch((error) => reject(error));
      }).catch((error) => reject(error));
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

module.exports = SessionController;
