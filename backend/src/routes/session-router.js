import { AuthService } from '../services/auth-service';
import { APIRouter } from './api-router';

export class SessionRouter extends APIRouter {
  createOne(req, res) {
    let body = req.body || {};

    if (body.email === undefined || body.password === undefined) {
      let error = new Error('Missing argument(s). Email and password are required.');
      res.status(400).send({
        'error': error.message,
      });
    }

    let email = body.email || '';
    let password = body.password || '';

    let authFailedBlock = () => {
      res.status(401).send({
        'error': 'Authentication failed. Incorrect email or password.',
      });
    };

    this.dbClient.getOneUser('email', email, true).then((user) => {
      if (user === undefined) {
        return authFailedBlock();
      }

      AuthService.getInstance().validatePassword(password, user['password']).then((result) => {
        if (result === true) {
          delete user['password'];
          let token = AuthService.getInstance().generateToken(user);
          res.send({
            'user': user,
            'token': token,
          });
        } else {
          authFailedBlock();
        }
      });
    }).catch((error) => {
      res.status(401).send({
        'error': error.message,
      });
    });
  }
}
