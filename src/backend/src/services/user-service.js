const { Pool } = require('pg');

const Logger = require('../tools/logger');
const { isValidEmail, castObject } = require('../tools/utils');

class UserService {
  constructor(dbUrl, authService) {
    this.pool = new Pool({
      connectionString: dbUrl,
      max: 2
    });

    this.authService = authService;
  }

  close() {
    this.pool.end();
  }

  getWhereClause(identifier) {
    let type = 'username';
    if (Number.isInteger(identifier)) {
      type = 'id';
    } else if (identifier.contains('@')) {
      type = 'email';
    }
    return ` WHERE ${type} = $1`;
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

  createUser(name, username, email, password) {
    return new Promise((resolve, reject) => {
      if (!password) {
        return reject(new Error('Password can\'t be empty.'));
      }

      if (!isValidEmail(email)) {
        return reject(new Error('Invalid email address.'));
      }

      const query =
        `INSERT INTO users (name, username, email, password)
        VALUES ($1, $2, $3, $4) RETURNING id`;

      this.authService.generateHash(password).then((hash) => {
        const values = [name, username, email, hash];
        return this.pool.query(query, values);
      }).then((result) => {
        resolve(result);
      }).catch((error) => {
        Logger.logError(`Error creating user: ${error}`);

        if (error.message.includes('email')) {
          reject(new Error('User with this email already exists.'));
        } else if (error.message.includes('username')) {
          reject(new Error('User with this username already exists.'));
        } else {
          reject(new Error('Error creating user.'));
        }
      });
    });
  }

  getUserCredentials(identifier) {
    return new Promise((resolve, reject) => {
      let query = 'SELECT id, password FROM users';
      query += this.getWhereClause(identifier);

      this.pool.query(query, [identifier])
        .then((result) => {
          resolve(result);
        }).catch((error) => {
          Logger.logError(`Error getting user: ${error}`);
          reject(error);
        });
    });
  }

  getUser(identifier) {
    return new Promise((resolve, reject) => {
      let query =
        `SELECT id, name, username, email, avatar, bio, created,
        (
          SELECT count(*) from likes where images.user_id = users.id
        ) as likes,
        (
          SELECT count(*) from images where images.user_id = users.id
        ) as likes,
        FROM users`;
      query += this.getWhereClause(identifier);

      this.pool.query(query, [identifier]).then((result) => {
        if (!result.length) {
          reject(new Error('User not found.'));
        } else {
          resolve(result);
        }
      }).catch((error) => {
        Logger.logError(`Error getting user: ${error}`);
        reject(new Error('Getting user failed.'));
      });
    });
  }

  getAllUsers(query, page, limit) {
    return new Promise((resolve, reject) => {
      const query =
        `SELECT id, name, username, email, avatar, bio, created,
        (
          SELECT count(*) from likes where images.user_id = users.id
        ) as likes,
        (
          SELECT count(*) from images where images.user_id = users.id
        ) as likes,
        FROM users LIMIT $1 OFFSET $2`;

      this.pool.query(query, [limit, page * limit])
        .then((result) => {
          resolve(result);
        }).catch((error) => {
          Logger.logError(`Error getting users: ${error}`);
          reject('Getting users failed.');
        });
    });
  }

  updateUser(userId, updates) {
    return new Promise((resolve, reject) => {
      this.validateUpdates(userId, updates).then((updates) => {
        let query = 'UPDATE users SET ';
        const changes = [];
        const values = [];

        for (const [key, value] of Object.entries(updates)) {
          values.push(value);
          changes.push(`${key} = $${values.length}`);
        }

        query += values.join(', ');

        values.push(userId);
        query += ` WHERE id = $${values.length}`;

        return this.pool.query(query, values);
      }).then(() => {
        resolve();
      }).catch((error) => {
        Logger.logError(`Error updating user: ${error}`);
        reject(new Error('Updating user failed.'));
      });
    });
  }

  deleteUser(userId) {
    return new Promise((resolve, reject) => {
      const query = 'DELETE FROM users WHERE id = $1';

      this.pool.query(query, [userId]).then(() => {
        resolve();
      }).catch((error) => {
        Logger.logError(`Error deleting user: ${error}`);
        reject(new Error('Deleting user failed.'));
      });
    });
  }
}

module.exports = UserService;
