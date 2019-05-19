import { User } from "../models/user";
import { AuthService } from "./auth-service";

export class UserFactory {
  static createUser(name, username, email, password) {
    return new Promise((resolve, reject) => {
      let user = new User();
      user.name = name;
      user.username = username;
      user.email = email;
      user.avatar = "";
      user.bio = "";
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
