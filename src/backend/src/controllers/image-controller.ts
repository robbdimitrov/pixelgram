import { logInfo, logError } from '../shared/logger';
import { parsePagination } from '../shared/utils';
import { Request, Response } from 'express';
import DbClient from '../db';
import { Image } from '../types';

class ImageController {
  dbClient: DbClient;
  loginFailures: Map<string, { count: number, timeout: NodeJS.Timeout, resetAt?: number }> = new Map();
  constructor(dbClient: DbClient) {
    this.dbClient = dbClient;
  }

  createImage(req: Request, res: Response) {
    const {filename, description} = req.body;

    if (!filename) {
      logError('Creating image failed: Missing filename');
      return res.status(400).send({
        message: 'Image filename is required.'
      });
    }

    this.dbClient.createImage(req.userId!, filename, description)
      .then((result: any) => {
        if (!result) {
          logError('Creating image failed: Upload not found');
          return res.status(400).send({
            message: 'Upload is invalid or expired.'
          });
        }

        logInfo('Successfully created image');
        res.status(201).send(result);
      }).catch((error: any) => {
        logError(`Creating image failed: ${error}`);
        res.status(400).send({
          message: 'Bad Request'
        });
      });
  }

  getFeed(req: Request, res: Response) {
    const pagination = parsePagination(req.query);

    if (!pagination) {
      return res.status(400).send({
        message: 'Invalid pagination parameters.'
      });
    }

    this.dbClient.getFeed(pagination.page, pagination.limit, req.userId!)
      .then((result: any) => {
        logInfo('Successfully fetched feed');
        res.status(200).send({
          items: result
        });
      }).catch((error: any) => {
        logError(`Getting feed failed: ${error}`);
        res.status(500).send({
          message: 'Internal Server Error'
        });
      });
  }

  getImages(req: Request, res: Response) {
    const userId = req.params.userId as string;
    const pagination = parsePagination(req.query);

    if (!pagination) {
      return res.status(400).send({
        message: 'Invalid pagination parameters.'
      });
    }

    this.dbClient.getImages(userId, pagination.page, pagination.limit, req.userId!)
      .then((result: any) => {
        logInfo('Successfully fetched images');
        res.status(200).send({
          items: result
        });
      }).catch((error: any) => {
        logError(`Getting images failed: ${error}`);
        res.status(500).send({
          message: 'Internal Server Error'
        });
      });
  }

  getLikedImages(req: Request, res: Response) {
    const userId = req.params.userId as string;
    const pagination = parsePagination(req.query);

    if (!pagination) {
      return res.status(400).send({
        message: 'Invalid pagination parameters.'
      });
    }

    this.dbClient.getLikedImages(userId, pagination.page, pagination.limit, req.userId!)
      .then((result: any) => {
        logInfo('Successfully fetched liked images');
        res.status(200).send({
          items: result
        });
      }).catch((error: any) => {
        logError(`Getting liked images failed: ${error}`);
        res.status(500).send({
          message: 'Internal Server Error'
        });
      });
  }

  getImage(req: Request, res: Response) {
    const imageId = req.params.imageId as string;

    this.dbClient.getImage(imageId, req.userId!)
      .then((result: any) => {
        if (result) {
          logInfo('Successfully fetched image');
          res.status(200).send(result);
        } else {
          logError('Getting image failed: Not Found');
          res.status(404).send({
            message: 'Not Found'
          });
        }
      }).catch((error: any) => {
        logError(`Getting image failed: ${error}`);
        res.status(500).send({
          message: 'Internal Server Error'
        });
      });
  }

  deleteImage(req: Request, res: Response) {
    const imageId = req.params.imageId as string;

    this.dbClient.deleteImage(imageId, req.userId!)
      .then((rowCount: number) => {
        if (rowCount) {
          logInfo('Successfully deleted image');
          return res.sendStatus(204);
        }

        return this.dbClient.getImage(imageId, req.userId!).then((image: Image) => {
          if (image) {
            logError('Deleting image failed: Forbidden');
            return res.status(403).send({
              message: 'Forbidden'
            });
          }

          logError('Deleting image failed: Not Found');
          return res.status(404).send({
            message: 'Not Found'
          });
        });
      }).catch((error: any) => {
        logError(`Deleting image failed: ${error}`);
        res.status(500).send({
          message: 'Internal Server Error'
        });
      });
  }

  likeImage(req: Request, res: Response) {
    const imageId = req.params.imageId as string;

    this.dbClient.imageExists(imageId)
      .then((exists: boolean) => {
        if (!exists) {
          return false;
        }

        return this.dbClient.likeImage(imageId, req.userId!).then(() => true);
      })
      .then((exists: boolean) => {
        if (!exists) {
          logError('Liking image failed: Not Found');
          return res.status(404).send({
            message: 'Not Found'
          });
        }

        logInfo('Successfully liked image');
        return res.sendStatus(204);
      }).catch((error: any) => {
        logError(`Liking image failed: ${error}`);
        res.status(500).send({
          message: 'Internal Server Error'
        });
      });
  }

  unlikeImage(req: Request, res: Response) {
    const imageId = req.params.imageId as string;

    this.dbClient.imageExists(imageId)
      .then((exists: boolean) => {
        if (!exists) {
          return false;
        }

        return this.dbClient.unlikeImage(imageId, req.userId!).then(() => true);
      })
      .then((exists: boolean) => {
        if (!exists) {
          logError('Unliking image failed: Not Found');
          return res.status(404).send({
            message: 'Not Found'
          });
        }

        logInfo('Successfully unliked image');
        return res.sendStatus(204);
      }).catch((error: any) => {
        logError(`Unliking image failed: ${error}`);
        res.status(500).send({
          message: 'Internal Server Error'
        });
      });
  }
}

export default ImageController;
