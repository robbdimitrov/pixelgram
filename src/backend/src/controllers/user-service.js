const { isValidEmail, castObject } = require('../tools/utils');

class UserController {
  constructor(dbClient, userService, imageService, authService, options) {
    super(dbClient, options);

    this.userService = userService;
    this.imageService = imageService;

    this.createSubrouters();
    this.setupSubrouters(this.router);
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

        this.getUserCredentials(userId).then((user) => {
          return this.authService.validatePassword(oldPassword, user.password);
        }).then((valid) => {
          if (!valid) {
            return reject(new Error('Wrong password. Enter the correct current password.'));
          }
          return this.authService.generateHash(password);
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

  getAll(req, res) {
    const query = req.query || {};
    const limit = parseInt(query.limit, 10) || 20;
    const page = parseInt(query.page, 10) || 0;

    this.dbClient.getAllUsers({}, page, limit).then((result) => {
      res.status(200).send({
        items: result
      });
    }).catch((error) => {
      res.status(400).send({
        message: error.message
      });
    });
  }

  createOne(req, res) {
    const body = req.body || {};

    const { name, username, email, password } = body;

    if (!name || !username || !email || !password) {
      return res.status(400).send({
        message: 'Missing argument(s). Name, username, email and password are expected.'
      });
    }

    this.userService.createUser(name, username, email, password)
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

  getOne(req, res) {
    const id = req.params.id;

    this.dbClient.getUser('id', id).then((result) => {
      if (result) {
        res.status(200).send(result);
      }
    }).catch((error) => {
      res.status(400).send({
        message: error.message
      });
    });
  }

  updateOne(req, res) {
    const userId = req.params.id;
    const body = req.body;

    if (userId !== req.user.id) {
      return res.status(403).send({
        message: 'Can\'t update other people\'s accounts.'
      });
    }

    if (Object.keys(body).length < 1) {
      return res.status(304).send({
        message: 'Nothing to update.'
      });
    }

    this.userService.updateUser(userId, body).then(() => {
      res.sendStatus(204);
    }).catch((error) => {
      res.status(400).send({
        message: error.message
      });
    });
  }

  deleteOne(req, res) {
    const id = req.params.id;

    if (id !== req.user.id) {
      return res.status(403).send({
        message: 'Can\'t delete other people\'s accounts.'
      });
    }

    this.dbClient.deleteUser(id).then(() => {
      res.sendStatus(204);
    }).catch((error) => {
      res.status(400).send({
        message: error.message
      });
    });
  }
}

module.exports = UserController;
