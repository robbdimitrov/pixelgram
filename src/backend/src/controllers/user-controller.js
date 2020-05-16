const { isValidEmail, castObject } = require('../shared/utils');
const { generateHash, validatePassword } = require('../shared/crypto');
const printLog = require('../shared/logger');

class UserController {
  constructor(dbClient) {
    this.dbClient = dbClient;
  }

  createUser(req, res) {
    const { name, username, email, password } = req.body;

    if (!name || !username || !email || !password) {
      return res.status(400).send({
        message: 'Name, username, email and password are required.'
      });
    }

    if (!isValidEmail(email)) {
      return res.status(400).send({
        message: 'Invalid email address.'
      });
    }

    generateHash(password).then((hash) => {
      return this.dbClient.createUser(name, username, email, hash);
    }).then((result) => {
      res.status(201).send(result);
    }).catch((error) => {
      printLog(`Creating user failed: ${error}`);
      res.status(400).send({
        message: 'User with this username or email already exists.'
      });
    });
  }

  getUser(req, res) {
    const userId = req.params.userId;

    this.dbClient.getUser(userId)
      .then((result) => {
        if (result) {
          res.status(200).send(result);
        } else {
          res.status(404).send({
            message: 'Not Found'
          });
        }
      }).catch((error) => {
        printLog(`Getting user failed: ${error}`);
        res.status(400).send({
          message: 'Bad Request'
        });
      });
  }

  updateUser(req, res) {
    const userId = req.params.userId;

    if (userId !== req.userId) {
      return res.status(403).send({
        message: 'Forbidden'
      });
    }

    if (Object.keys(req.body).length === 0) {
      return res.sendStatus(304);
    }

    if (req.body.password) {
      return this.updatePassword(req, res);
    }

    if (req.body.email && !isValidEmail(req.body.email)) {
      return res.status(400).send({
        message: 'Invalid email address.'
      });
    }

    const allowedKeys = ['name', 'username', 'email', 'avatar', 'bio'];
    const updates = castObject(req.body, allowedKeys);

    this.dbClient.updateUser(userId, updates).then(() => {
      res.sendStatus(204);
    }).catch((error) => {
      printLog(`Updating user failed: ${error}`);

      let message = 'Bad Request';
      if (/email|username/.test(error.message)) {
        message = 'This username or email is already in use.';
      }

      res.status(400).send({ message });
    });
  }

  updatePassword(req, res) {
    const userId = req.params.userId;

    if (!req.body.oldPassword) {
      return res.status(400).send({
        message: 'Both password and the current password are required.'
      });
    }

    this.dbClient.getUserWithId(userId).then((user) => {
      return validatePassword(req.body.oldPassword, user.password);
    }).then((valid) => {
      if (!valid) {
        throw new Error('Wrong password. Enter the correct current password.');
      }
      return generateHash(req.body.password);
    }).then((hash) => {
      return this.dbClient.updateUser(userId, { password: hash });
    }).then(() => {
      res.sendStatus(204);
    }).catch((error) => {
      printLog(`Updating user failed: ${error}`);
      res.status(400).send({
        message: error.message
      });
    });
  }
}

module.exports = UserController;
