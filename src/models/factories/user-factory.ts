import * as moment from 'moment';
import * as bcrypt from 'bcryptjs';

import { User } from '../user';

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
            user.avatar = '';
            user.likedImages = [];
            user.postedImages = [];
            user.registrationDate = moment().format();
            user.sessions = [];

            bcrypt.genSalt(10, (err, salt) => {
                bcrypt.hash(password, salt, (err, hash) => {
                    user.password = hash;
                    resolve(user);
                });
            });
        });
    }

}
