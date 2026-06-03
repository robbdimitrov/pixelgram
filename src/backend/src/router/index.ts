import { Router } from 'express';
import { Request, Response, NextFunction } from 'express';
import AuthController from '../controllers/auth-controller';
import ImageController from '../controllers/image-controller';
import { UploadController } from '../controllers/upload-controller';
import UserController from '../controllers/user-controller';

export interface Controllers {
  auth: AuthController;
  image: ImageController;
  upload: UploadController;
  user: UserController;
}

export default function ({auth, image, upload, user}: Controllers) {
  const router = Router();

  // Users
  router.post('/users', (req: Request, res: Response) => user.createUser(req, res));
  router.get('/users/:userId', (req: Request, res: Response) => user.getUser(req, res));
  router.put('/users/:userId', (req: Request, res: Response) => user.updateUser(req, res));

  // Sessions
  router.post('/sessions', (req: Request, res: Response) => auth.createSession(req, res));
  router.delete('/sessions', (req: Request, res: Response) => auth.deleteSession(req, res));

  // Images
  router.post('/images', (req: Request, res: Response) => image.createImage(req, res));
  router.get('/images', (req: Request, res: Response) => image.getFeed(req, res));
  router.get('/users/:userId/images', (req: Request, res: Response) => image.getImages(req, res));
  router.get('/users/:userId/likes', (req: Request, res: Response) => image.getLikedImages(req, res));
  router.get('/images/:imageId', (req: Request, res: Response) => image.getImage(req, res));
  router.delete('/images/:imageId', (req: Request, res: Response) => image.deleteImage(req, res));
  router.post('/images/:imageId/likes', (req: Request, res: Response) => image.likeImage(req, res));
  router.delete('/images/:imageId/likes', (req: Request, res: Response) => image.unlikeImage(req, res));

  // Upload
  router.post('/uploads', (req: Request, res: Response, next: NextFunction) => {
    upload.uploader(req, res, (error?: unknown) => {
      if (error) {
        return upload.handleUploadError(error, res);
      }

      return next();
    });
  }, (req: Request, res: Response) => upload.createFile(req, res));

  return router;
};
