class SessionController {
  constructor(dbClient) {
    this.dbClient = dbClient;
  }

  create(req, res) {
    const body = req.body || {};

    if (!body.email || !body.password) {
      return res.status(400).send({
        message: 'Missing argument(s). Email and password are required.'
      });
    }

    const authFailed = () => {
      res.status(401).send({
        message: 'Authentication failed. Incorrect email or password.'
      });
    };

    this.dbClient.getUserCredentials('email', body.email).then((user) => {
      if (!user) {
        return authFailed();
      }

      this.authService.validatePassword(body.password, user['password'])
        .then((valid) => {
          if (!valid) {
            return authFailed();
          }

          delete user['password'];
          const token = this.authService.generateToken(user);
          res.status(200).send({
            user, token
          });
        }).catch(() => {
          authFailed();
        });
    }).catch((error) => {
      res.status(401).send({
        message: error.message
      });
    });
  }

  get(req, res) {
    const body = req.body || {};

    if (!body.email || !body.password) {
      return res.status(400).send({
        message: 'Missing argument(s). Email and password are required.'
      });
    }

    const authFailed = () => {
      res.status(401).send({
        message: 'Authentication failed. Incorrect email or password.'
      });
    };

    this.dbClient.getUserCredentials('email', body.email).then((user) => {
      if (!user) {
        return authFailed();
      }

      this.authService.validatePassword(body.password, user['password'])
        .then((valid) => {
          if (!valid) {
            return authFailed();
          }

          delete user['password'];
          const token = this.authService.generateToken(user);
          res.status(200).send({
            user, token
          });
        }).catch(() => {
          authFailed();
        });
    }).catch((error) => {
      res.status(401).send({
        message: error.message
      });
    });
  }
}

module.exports = SessionController;
