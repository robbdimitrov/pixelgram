const { generateHash, validatePassword } = require('../tools/auth');
const { isValidEmail, castObject } = require('../tools/utils');

class UserService {
  constructor(dbClient) {
    this.dbClient = dbClient;
  }

  createUser(name, username, email, password) {
    return new Promise((resolve, reject) => {
      if (password === '') {
        return reject(new Error('Password can\'t be empty.'));
      }

      if (!isValidEmail(email)) {
        return reject(new Error('Invalid email address.'));
      }

      const user = { email, name, username };

      try {
        user.password = await generateHash(password);
        const result = await this.dbClient.createUser(user);
        resolve(result);
      } catch (error) {
        reject(error);
      }
    });
  }

  updateUser(userId, updates) {
    return new Promise((resolve, reject) => {
      const allowedKeys = ['name', 'username', 'email', 'avatar', 'bio'];
      const updatedUser = castObject(updates, allowedKeys);

      if (updates.email && !isValidEmail(updates.email)) {
        return reject(new Error('Invalid email address.'));
      }

      if (updates.password) {
        const password = updates.password;
        const oldPassword = updates.oldPassword;

        if (!oldPassword) {
          return reject(new Error('Both password and the current password are required.'));
        }

        if (password === '') {
          return reject(new Error('Password can\'t be empty.'));
        }

        try {
          const user = await this.dbClient.getUserCredentials(userId);
          const isPasswordValid = await validatePassword(oldPassword, user.password);

          if (!isPasswordValid) {
            return reject(new Error('Wrong password. Enter the correct current password.'));
          }

          updatedUser.password = await generateHash(password);
          await dbClient.updateUser(id, updatedUser);
          resolve();
        } catch(error) {
          reject(error);
        }
      } else {
        try {
          await dbClient.updateUser(id, updatedUser);
          resolve();
        } catch(error) {
          reject(error);
        }
      }
    });
  }
}

module.exports = UserService;
