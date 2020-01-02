const AuthService = require('./auth-service');
const BodyParser = require('./body-parser');
const UserFactory = require('./user-factory');
const ValidatorService = require('./validator-service');

class UserService {
  constructor(dbClient) {
    this.dbClient = dbClient;
  }

  createUser(name, username, email, password) {
    return new Promise((resolve, reject) => {
      if (password === '') {
        return reject(new Error('Password can\'t be empty.'));
      }

      if (!ValidatorService.isValidEmail(email)) {
        return reject(new Error('Invalid email address.'));
      }

      UserFactory.createUser(name, username, email, password).then((user) => {
        this.dbClient.createUser(user)
          .then((result) => resolve(result))
          .catch((error) => reject(error));
      });
    });
  }

  updateUser(userId, updates) {
    return new Promise((resolve, reject) => {
      const allowedKeys = ['name', 'username', 'email', 'avatar', 'bio'];
      const updatedUser = BodyParser.parseBodyParametersToObject(updates, allowedKeys);

      const updateClosure = (dbClient, id, updatedUser) => {
        dbClient.updateUser(id, { $set: updatedUser })
          .then(() => resolve())
          .catch((error) => reject(error));
      };

      if (updates.email !== undefined) {
        if (!ValidatorService.isValidEmail(updates.email)) {
          return reject(new Error('Invalid email address.'));
        }
      }

      if (updates.password !== undefined) {
        const password = updates.password;
        const oldPassword = updates.oldPassword;

        if (!oldPassword) {
          return reject(new Error('Both password and the current password are required.'));
        }

        if (password === '') {
          return reject(new Error('Password can\'t be empty.'));
        }

        this.dbClient.getUser('id', userId, true).then((user) => {
          AuthService.getInstance().validatePassword(oldPassword, user['password']).then(() => {
            AuthService.getInstance().generateHash(password).then((result) => {
              updatedUser['password'] = result;
              updateClosure(this.dbClient, userId, updatedUser);
            });
          }).catch(() => {
            return reject(new Error('Wrong password. Enter the correct current password.'));
          });
        }).catch((error) => {
          return reject(error);
        });
      } else {
        updateClosure(this.dbClient, userId, updatedUser);
      }
    });
  }
}

module.exports = UserService;
