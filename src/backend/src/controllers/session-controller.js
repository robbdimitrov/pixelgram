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

    this.dbClient.getUserCredentials(email).then((user) => {
      if (!user) {
        throw new Error('User not found.');
      }
      validatePassword(password, user.password).then((valid) => {
        if (!valid) {
          throw new Error('Incorrect email or password.');
        }
        return generateKey();
      }).then((sessionId) => {
        return this.dbClient.createSession(sessionId, user.id);
      }).then((session) => {
        this.createCookie(res, session.id);
        return this.dbClient.getUser(session.userId);
      }).then((result) => {
        res.status(200).send(result);
      });
    }).catch((error) => {
      res.status(401).send({
        message: error.message
      });
    });
  }

  createCookie(res, sessionId) {
    const oneWeek = 7 * 24 * 60 * 60 * 1000;
    res.cookie('SID', sessionId, {
      sameSite: 'strict',
      maxAge: oneWeek,
      httpOnly: true
    });
  }

  validateSession(req, res, next) {
    const sessionId = req.cookies['SID'];

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
        res.clearCookie('SID');
        res.status(401).send({
          message: error.message
        });
      });
  }

  deleteSession(req, res) {
    const sessionId = req.cookies['SID'];

    this.dbClient.deleteSession(sessionId)
      .then(() => {
        res.clearCookie('SID');
        res.sendStatus(204);
      }).catch((error) => {
        res.status(500).send({
          message: error.message
        });
      });
  }
}

module.exports = SessionController;
