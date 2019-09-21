const User = require('../models/user');
const AuthService = require('./auth-service');

class UserFactory {
  static createUser(name, username, email, password) {
    return new Promise((resolve, reject) => {
      const user = new User();
      user.name = name;
      user.username = username;
      user.email = email;
      user.avatar = '';
      user.bio = '';
      user.likedImages = [];
      user.postedImages = [];
      user.registrationDate = new Date().toISOString();

      AuthService.getInstance().generateHash(password).then((res) => {
        user.password = res;
        resolve(user);
      }).catch((error) => {
        reject(error);
      });
    });
  }
}

module.exports = UserFactory;
