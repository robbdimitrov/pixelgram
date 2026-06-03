import { isValidEmail } from '../shared/utils';
import { generateHash, verifyPassword } from '../shared/crypto';
import { logInfo, logError } from '../shared/logger';
import { Request, Response } from 'express';
import DbClient from '../db';
import { UserCredentialsRow, UserDto, UserId } from '../types';

function isUniqueViolation(error: unknown) {
  return typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    error.code === '23505';
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Bad Request';
}

class UserController {
  dbClient: DbClient;
  constructor(dbClient: DbClient) {
    this.dbClient = dbClient;
  }

  createUser(req: Request, res: Response) {
    const name = req.body.name?.trim();
    const username = req.body.username?.trim();
    const email = req.body.email?.trim().toLowerCase();
    const password = req.body.password;

    if (!name || !username || !email || !password) {
      logError('Creating user failed: Missing field');
      return res.status(400).send({
        message: 'Name, username, email and password are required.'
      });
    }

    if (password.length < 8) {
      logError('Creating user failed: Password too short');
      return res.status(400).send({
        message: 'Password must be at least 8 characters long.'
      });
    }

    if (!isValidEmail(email)) {
      logError('Creating user failed: Invalid email address');
      return res.status(400).send({
        message: 'Invalid email address.'
      });
    }

    generateHash(password).then((hash: string) => {
      return this.dbClient.createUser(name, username, email, hash);
    }).then((result: UserId) => {
      logInfo('Successfully created user');
      res.status(201).send(result);
    }).catch((error: unknown) => {
      logError(`Creating user failed: ${error}`);

      if (isUniqueViolation(error)) {
        return res.status(409).send({
          message: 'User with this username or email already exists.'
        });
      }

      res.status(500).send({
        message: 'Could not create user. Please try again.'
      });
    });
  }

  getUser(req: Request, res: Response) {
    const userId = req.params.userId as string;

    this.dbClient.getUser(userId)
      .then((result: UserDto | undefined) => {
        if (result) {
          logInfo('Successfully fetched user');
          res.status(200).send(result);
        } else {
          logError('Getting user failed: Not Found');
          res.status(404).send({
            message: 'Not Found'
          });
        }
      }).catch((error: unknown) => {
        logError(`Getting user failed: ${error}`);
        res.status(500).send({
          message: 'Internal Server Error'
        });
      });
  }

  updateUser(req: Request, res: Response) {
    const userId = req.params.userId as string;

    if (userId !== req.userId!) {
      logError('Updating user failed: Forbidden');
      return res.status(403).send({
        message: 'Forbidden'
      });
    }

    if (req.body.password) {
      return this.updatePassword(req, res);
    }

    const name = req.body.name?.trim();
    const username = req.body.username?.trim();
    const email = req.body.email?.trim().toLowerCase();
    const {avatar, bio} = req.body;

    if (!name || !username) {
      logError('Updating user failed: Missing field');
      return res.status(400).send({
        message: 'Name and username are required.'
      });
    }

    if (!isValidEmail(email)) {
      logError('Updating user failed: Invalid email address');
      return res.status(400).send({
        message: 'Invalid email address.'
      });
    }

    this.dbClient.updateUser(userId, name, username, email, avatar, bio)
      .then(() => {
        logInfo('Successfully updated user');
        res.sendStatus(204);
      }).catch((error: unknown) => {
        logError(`Updating user failed: ${error}`);

        let message = 'Bad Request';
        if (isUniqueViolation(error)) {
          message = 'This username or email is already in use.';
        }

        res.status(400).send({message});
      });
  }

  updatePassword(req: Request, res: Response) {
    const userId = req.params.userId as string;

    if (!req.body.oldPassword || !req.body.password) {
      logError('Updating password failed: Missing password field');
      return res.status(400).send({
        message: 'Both password and the current password are required.'
      });
    }

    if (req.body.password.length < 8) {
      logError('Updating password failed: Password too short');
      return res.status(400).send({
        message: 'Password must be at least 8 characters long.'
      });
    }

    this.dbClient.getUserWithId(userId).then((user: UserCredentialsRow | undefined) => {
      if (!user) {
        throw new Error('User not found.');
      }

      return verifyPassword(req.body.oldPassword, user.password);
    }).then((valid: boolean) => {
      if (!valid) {
        throw new Error('Wrong password. Enter the correct current password.');
      }
      return generateHash(req.body.password);
    }).then((hash: string) => {
      logInfo('Successfully updated password');
      return this.dbClient.updatePassword(userId, hash);
    }).then(() => {
      return this.dbClient.deleteOtherSessions(userId, req.cookies['session']);
    }).then(() => {
      res.sendStatus(204);
    }).catch((error: unknown) => {
      logError(`Updating password failed: ${error}`);
      res.status(400).send({
        message: getErrorMessage(error)
      });
    });
  }
}

export default UserController;
