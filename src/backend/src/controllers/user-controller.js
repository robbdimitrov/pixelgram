const { isValidEmail, castObject } = require('../shared/utils');
const { generateHash, validatePassword } = require('../shared/crypto');

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

      if (updates.password) {
        const password = updates.password;
        const oldPassword = updates.oldPassword;

        if (!oldPassword || !password) {
          return reject(new Error('Both password and the current password are required.'));
        }

        this.getUserCredentials(userId)
          .then((user) => {
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
            reject(error);
          });
      } else {
        resolve(userUpdates);
      }
    });
  }

  createUser(req, res) {
    const body = req.body || {};

    const { name, username, email, password } = body;

    if (!name || !username || !email || !password) {
      return res.status(400).send({
        message: 'Missing argument(s). Name, username, email and password are expected.'
      });
    }

    this.dbClient.createUser(name, username, email, password)
      .then((result) => {
        res.status(201).send({
          id: result
        });
      }).catch((error) => {
        res.status(400).send({
          message: error.message
        });
      });
  }

  getUser(req, res) {
    const userId = req.params.userId;

    this.dbClient.getUser(userId)
      .then((result) => {
        if (result) {
          res.status(200).send(result);
        }
      }).catch((error) => {
        res.status(400).send({
          message: error.message
        });
      });
  }

  updateUser(req, res) {
    const userId = req.params.userId;
    const body = req.body;

    if (userId !== req.userId) {
      return res.status(403).send({
        message: 'Can\'t update other people\'s accounts.'
      });
    }

    if (Object.keys(body).length === 0) {
      return res.status(304).send({
        message: 'Nothing to update.'
      });
    }

    this.dbClient.updateUser(userId, body)
      .then(() => {
        res.sendStatus(204);
      }).catch((error) => {
        res.status(400).send({
          message: error.message
        });
      });
  }
}

module.exports = UserController;
