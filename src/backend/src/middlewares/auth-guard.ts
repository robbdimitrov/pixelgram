import { Request, Response, NextFunction } from 'express';

const allowed = [
  {method: 'POST', path: '/sessions'},
  {method: 'DELETE', path: '/sessions'},
  {method: 'POST', path: '/users'}
];

function isAllowed(req: Request) {
  if (req.method === 'OPTIONS') {
    return true;
  }
  for (const route of allowed) {
    if (req.method === route.method && req.path === route.path) {
      return true;
    }
  }
  return false;
}

export default function (controller: any) {
  return function (req: Request, res: Response, next: NextFunction) {
    if (isAllowed(req)) {
      return next();
    }
    controller.validateSession(req, res, next);
  };
};
