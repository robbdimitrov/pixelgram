class SessionController {
  constructor(secret) {
    this.secret = secret;
  }

  validatePassword(password, passwordHash) {
    return new Promise((resolve, reject) => {
      bcrypt.compare(password, passwordHash).then((result) => {
        resolve(result);
      }).catch((error) => {
        logger.logError(`Error validating password: ${error}`);
        reject(error);
      });
    });
  }

  generateHash(password) {
    return new Promise((resolve, reject) => {
      bcrypt.genSalt(12, (error, salt) => {
        if (error) {
          logger.logError(`Error generating hash: ${error}`);
          return reject(error);
        }
        bcrypt.hash(password, salt, (error, hash) => {
          if (error) {
            logger.logError(`Error generating hash: ${error}`);
            return reject(error);
          }
          resolve(hash);
        });
      });
    });
  }

  generateToken(user) {
    const options = { algorithm: 'HS256', expiresIn: '12h' };
    const payload = { sub: user.id };
    const token = jwt.sign(payload, this.secret, options);
    return token;
  }

  validateToken(token) {
    return new Promise((resolve, reject) => {
      jwt.verify(token, this.secret, { algorithm: 'HS256' }, (error, result) => {
        if (error) {
          logger.logError(`Error validating token: ${error}`);
          reject(new Error('Failed to authenticate token.'));
        } else {
          resolve({ id: result.sub });
        }
      });
    });
  }


  constructor(dbClient, options, authService) {
    super(dbClient, options);

    this.authService = authService;
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

  // router

  createOne(req, res) {
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
