const { Pool } = require('pg');

class UserClient {
  constructor(dbUrl) {
    this.pool = new Pool({
      connectionString: dbUrl
    });
  }

  close() {
    this.pool.end();
  }

  getWhereClause(identifier) {
    if (Number.isInteger(identifier)) {
      return 'WHERE id = $1';
    } else if (identifier.contains('@')) {
      return 'WHERE email = $1';
    }
    return 'WHERE username = $1';
  }

  async createUser(user) {
    return new Promise((resolve, reject) => {
      const query =
        `INSERT INTO users (name, username, email, password)
        VALUES ($1, $2, $3, $4) RETURNING id`;

      this.pool.query(query, [user.name, user.username, user.email, user.password])
        .then((res) => {
          resolve(res[0]);
        }).catch((err) => {
          Logger.logError(`Error creating user: ${err}`);

          if (err.message.includes('email')) {
            return reject(new Error('User with this email already exists'));
          } else {
            return reject(new Error('User with this username already exists'));
          }
        });
    });
  }

  async getUserCredentials(identifier) {
    return new Promise((resolve, reject) => {
      let query = 'SELECT id, password FROM users';

      query.concat(' ', this.getWhereClause(identifier));

      this.pool.query(query, [identifier])
        .then((res) => {
          resolve(res);
        }).catch((error) => {
          Logger.logError(`Error getting user: ${error}`);
          return reject(error);
        });
    });
  }

  async getUser(identifier) {
    return new Promise((resolve, reject) => {
      let query =
        `SELECT id, name, username, email, avatar, bio, created_at,
        (
          SELECT count(*) from likes where images.user_id = users.id
        ) as likes,
        (
          SELECT count(*) from images where images.user_id = users.id
        ) as likes,
        FROM users`;

      query.concat(' ', this.getWhereClause(identifier));

      this.pool.query(query, [identifier]).then((res) => {
        if (!res.length) {
          reject(new Error('User not found.'));
        } else {
          resolve(res[0]);
        }
      }).catch((error) => {
        Logger.logError(`Error getting user: ${error}`);
        reject(new Error('Getting user failed.'));
      });
    });
  }

  async getAllUsers(query, page, limit) {
    return new Promise((resolve, reject) => {
      const query =
        `SELECT id, name, username, email, avatar, bio, created_at,
        (
          SELECT count(*) from likes where images.user_id = users.id
        ) as likes,
        (
          SELECT count(*) from images where images.user_id = users.id
        ) as likes,
        FROM users LIMIT $1 OFFSET $2`;

      this.pool.query(query, [limit, page * limit])
        .then((res) => {
          resolve(res);
        }).catch((err) => {
          Logger.logError(`Error getting users: ${err}`);
          return reject('Getting users failed.');
        });
    });
  }

  async updateUser(userId, userUpdates) {
    return new Promise((resolve, reject) => {
      client.db().collection('users').updateOne({ id: userId }, userUpdates)
        .then(() => resolve())
        .catch((error) => reject(error));
    });
  }

  async deleteUser(userId) {
    return new Promise((resolve, reject) => {
      const query = 'DELETE FROM users WHERE id = $1';

      this.pool.query(query).then((res) => {
        resolve();
      }).catch((err) => {
        Logger.logError(`Error deleting users: ${err}`);
        return reject(new Error('Deleting user failed.'));
      })
    });
  }
}

module.exports = UserClient;
