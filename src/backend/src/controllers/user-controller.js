const {isValidEmail} = require('../shared/utils');
const {generateHash, verifyPassword} = require('../shared/crypto');
const {logInfo, logError} = require('../shared/logger');

class UserController {
  constructor(dbClient) {
    this.dbClient = dbClient;
  }

  createUser(req, res) {
    const {name, username, email, password} = req.body;

    if (!name || !username || !email || !password) {
      logError('Creating user failed: Missing field');
      return res.status(400).send({
        message: 'Name, username, email and password are required.'
      });
    }

    if (!isValidEmail(email)) {
      logError('Creating user failed: Invalid email address');
      return res.status(400).send({
        message: 'Invalid email address.'
      });
    }

    generateHash(password).then((hash) => {
      return this.dbClient.createUser(name, username, email, hash);
    }).then((result) => {
      logInfo('Successfully created user');
      res.status(201).send(result);
    }).catch((error) => {
      logError(`Creating user failed: ${error}`);
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
          logInfo('Successfully fetched user');
          res.status(200).send(result);
        } else {
          logError('Getting user failed: Not Found');
          res.status(404).send({
            message: 'Not Found'
          });
        }
      }).catch((error) => {
        logError(`Getting user failed: ${error}`);
        res.status(500).send({
          message: 'Internal Server Error'
        });
      });
  }

  updateUser(req, res) {
    const userId = req.params.userId;

    if (userId !== req.userId) {
      logError('Updating user failed: Forbidden');
      return res.status(403).send({
        message: 'Forbidden'
      });
    }

    if (req.body.password) {
      return this.updatePassword(req, res);
    }

    const {name, username, email, avatar, bio} = req.body;

    if (!isValidEmail(email)) {
      logError('Updating user failed: Invalid email address');
      return res.status(400).send({
        message: 'Invalid email address.'
      });
    }

    this.dbClient.updateUser(userId, name, username, email, avatar, bio)
      .then(() => {
        logInfo('Successfully updated user');
        res.sendStatus(204);
      }).catch((error) => {
        logError(`Updating user failed: ${error}`);

        let message = 'Bad Request';
        if (/email|username/.test(error.message)) {
          message = 'This username or email is already in use.';
        }

        res.status(400).send({message});
      });
  }

  updatePassword(req, res) {
    const userId = req.params.userId;

    if (!req.body.oldPassword) {
      logError('Updating password failed: Missing current password');
      return res.status(400).send({
        message: 'Both password and the current password are required.'
      });
    }

    this.dbClient.getUserWithId(userId).then((user) => {
      return verifyPassword(req.body.oldPassword, user.password);
    }).then((valid) => {
      if (!valid) {
        throw new Error('Wrong password. Enter the correct current password.');
      }
      return generateHash(req.body.password);
    }).then((hash) => {
      logInfo('Successfully updated password');
      return this.dbClient.updatePassword(userId, hash);
    }).then(() => {
      res.sendStatus(204);
    }).catch((error) => {
      logError(`Updating password failed: ${error}`);
      res.status(400).send({
        message: error.message
      });
    });
  }
}

module.exports = UserController;
