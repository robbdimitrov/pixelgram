import * as moment from 'moment';

import { User } from '../user';
import { AuthService } from '../../services/auth-service';

export class UserFactory {

    static createUser(name: string, username: string,
        email: string, password: string): Promise<User> {

        return new Promise((resolve, reject) => {
            let user = new User();
            user.name = name;
            user.username = username;
            user.email = email;
            user.avatar = '';
            user.bio = '';
            user.likedImages = [];
            user.postedImages = [];
            user.registrationDate = moment().format();

            AuthService.getInstance().generateHash(password).then((res) => {
                user.password = res;
                resolve(user);
            }).catch((err) => {
                reject(err);
            });
        });
    }

    // Creates a JSON user by stripping passwords and
    // replacing ObjectID with string representation
    static createJsonUser(user: User): Object {
        let jsonUser = new Object();

        jsonUser['id'] = user._id.toString();
        jsonUser['name'] = user.name;
        jsonUser['username'] = user.username;
        jsonUser['email'] = user.email;
        jsonUser['avatar'] = user.avatar;
        jsonUser['bio'] = user.bio;
        jsonUser['registrationDate'] = user.registrationDate;

        return jsonUser;
    }

}
