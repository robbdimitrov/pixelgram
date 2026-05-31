import cookie from 'cookie';
import { Request, Response, NextFunction } from 'express';

export default function (req: Request, res: Response, next: NextFunction) {
  if (req.cookies) {
    return next();
  }
  const cookies = req.header('cookie');
  req.cookies = cookies ? cookie.parse(cookies) : {};
  next();
};
