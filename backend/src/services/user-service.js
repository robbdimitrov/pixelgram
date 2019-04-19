import { AuthService } from './auth-service';
import { BodyParser } from './body-parser';
import { UserFactory } from './user-factory';
import { ValidatorService } from './validator-service';

export class UserService {
  constructor(dbClient) {
    this.dbClient = dbClient;
  }

  createUser(name, username, email, password) {
    return new Promise((resolve, reject) => {
      if (password === '') {
        let error = new Error('Password can\'t be empty.');
        return reject(error);
      }

      if (!ValidatorService.isValidEmail(email)) {
        let error = new Error('Invalid email address.');
        return reject(error);
      }

      UserFactory.createUser(name, username, email, password).then((user) => {
        this.dbClient.createOneUser(user).then(() => {
          resolve();
        }).catch((error) => {
          reject(error);
        });
      });
    });
  }

  updateUser(userId, updates) {
    return new Promise((resolve, reject) => {
      let allowedKeys = ['name', 'username', 'email', 'avatar', 'bio'];
      let updatedUser = BodyParser.parseBodyParametersToObject(updates, allowedKeys);

      let updateClosure = (dbClient, id, updatedUser) => {
        dbClient.updateOneUser(id, { $set: updatedUser }).then(() => {
          resolve();
        }).catch((error) => {
          reject(error);
        });
      };

      if (updates.email !== undefined) {
        if (!ValidatorService.isValidEmail(updates.email)) {
          let error = new Error('Invalid email address.');
          return reject(error);
        }
      }

      if (updates.password !== undefined) {
        let password = updates.password;
        let oldPassword = updates.oldPassword;

        if (oldPassword === undefined) {
          let error = new Error('Both password and the current password are required.');
          return reject(error);
        }

        if (password === '') {
          let error = new Error('Password can\'t be empty.');
          return reject(error);
        }

        this.dbClient.getOneUser('id', userId, true).then((user) => {
          AuthService.getInstance().validatePassword(oldPassword, user['password']).then((value) => {
            if (value) {
              AuthService.getInstance().generateHash(password).then((result) => {
                updatedUser['password'] = result;
                updateClosure(this.dbClient, userId, updatedUser);
              });
            } else {
              throw new Error('Authentication failed.');
            }
          }).catch(() => {
            let error = new Error('Wrong password. Enter the correct current password.');
            reject(error);
          });
        }).catch((error) => {
          reject(error);
        });
      } else {
        updateClosure(this.dbClient, userId, updatedUser);
      }
    });
  }
}
