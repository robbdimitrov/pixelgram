import * as bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';

export class AuthService {

    private static instance: AuthService;
    private secret = process.env.JWT_SECRET || 'secret';

    private constructor() {}

    static getInstance() {
        if (!AuthService.instance) {
            AuthService.instance = new AuthService();
        }
        return AuthService.instance;
    }

    validatePassword(password: string, passwordHash: string): Promise<boolean> {
        return new Promise((resolve, reject) => {
            bcrypt.compare(password, passwordHash).then((res) => {
                return resolve(res);
            }).catch((err) => {
                return reject(new Error('Authentication failed. ' + err));
            });
        });
    }

    generateHash(password: string): Promise<string> {
        return new Promise((resolve, reject) => {
            bcrypt.genSalt(10, (err, salt) => {
                if (err) {
                    return reject(err);
                }
                bcrypt.hash(password, salt, (err, hash) => {
                    if (err) {
                        return reject(err);
                    }
                    resolve(hash);
                });
            });
        });
    }

    generateToken(user: Object): string {
        let payload = {
            id: user['_id'].toString(),
        };

        let token = jwt.sign(payload, this.secret, {
            expiresIn: '12h',
        });

        return token;
    }

    validateToken(token: string): Promise<any> {
        return new Promise((resolve, reject) => {
            jwt.verify(token, this.secret, (err, decoded) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(decoded);
                }
            });
        });
    }

}
