import { Request, Response, NextFunction } from 'express';

export default function jsonErrorHandler(error: any, _req: Request, res: Response, next: NextFunction) {
  if (error.type === 'entity.too.large') {
    return res.status(413).send({
      message: 'Request body is too large.'
    });
  }

  if (error instanceof SyntaxError && 'body' in error) {
    return res.status(400).send({
      message: 'Malformed JSON request body.'
    });
  }

  return next(error);
}
