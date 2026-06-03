import { Request, Response, NextFunction } from 'express';

const unsafeMethods = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

function requestOrigin(req: Request) {
  const origin = req.get('origin');
  if (!origin) {
    return undefined;
  }

  try {
    const parsed = new URL(origin);
    return `${parsed.protocol}//${parsed.host}`;
  } catch {
    return null;
  }
}

function expectedOrigin(req: Request) {
  return `${req.protocol}://${req.get('host')}`;
}

export default function originGuard(req: Request, res: Response, next: NextFunction) {
  if (!unsafeMethods.has(req.method)) {
    return next();
  }

  const origin = requestOrigin(req);
  if (origin === null) {
    return res.status(403).send({
      message: 'Forbidden'
    });
  }

  if (!origin || origin === expectedOrigin(req)) {
    return next();
  }

  return res.status(403).send({
    message: 'Forbidden'
  });
}
