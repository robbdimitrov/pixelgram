const AuthService = require('./auth-service');

class UserFactory {
  static createUser(name, username, email, password) {
    return new Promise((resolve, reject) => {
      const user = {
        name: name,
        username: username,
        email: email,
        avatar: '',
        bio: '',
        likedImages: [],
        postedImages: []
      };

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
