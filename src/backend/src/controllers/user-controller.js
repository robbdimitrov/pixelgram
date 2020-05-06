const { isValidEmail, castObject } = require('../shared/utils');
const { generateHash, validatePassword } = require('../shared/crypto');
const printLog = require('../shared/logger');

class UserController {
  constructor(dbClient) {
    this.dbClient = dbClient;
  }

  validateUpdates(userId, updates) {
    return new Promise((resolve, reject) => {
      if (updates.email && !isValidEmail(updates.email)) {
        return reject(new Error('Invalid email address.'));
      }

      const allowedKeys = ['name', 'username', 'email', 'avatar', 'bio'];
      const userUpdates = castObject(updates, allowedKeys);
      const { password, oldPassword } = updates;

      if (password) {
        if (!oldPassword) {
          return reject(new Error('Both password and the current password are required.'));
        }

        this.dbClient.getUserWithId(userId).then((user) => {
          return validatePassword(oldPassword, user.password);
        }).then((valid) => {
          if (!valid) {
            throw new Error('Wrong password. Enter the correct current password.');
          }
          return generateHash(password);
        }).then((hash) => {
          userUpdates.password = hash;
          resolve(userUpdates);
        }).catch((error) => {
          printLog(`Getting user credentials failed: ${error}`);
          reject(error);
        });
      } else {
        resolve(userUpdates);
      }
    });
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

    this.dbClient.createUser(name, username, email, password)
      .then((result) => {
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
      return res.sendStatus(403);
    }

    if (Object.keys(req.body).length === 0) {
      return res.sendStatus(304);
    }

    this.validateUpdates(userId, req.body).then((updates) => {
      return this.dbClient.updateUser(userId, updates);
    }).then(() => {
      res.sendStatus(204);
    }).catch((error) => {
      printLog(`Updating user failed: ${error}`);
      res.status(400).send({
        message: 'Bad Request'
      });
    });
  }
}

module.exports = UserController;
