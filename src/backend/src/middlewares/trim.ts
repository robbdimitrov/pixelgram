export default function trim(req: any, _res: any, next: any) {
  const trimStrings = (obj: any) => {
    if (typeof obj === 'string') {
      return obj.trim();
    }
    if (obj !== null && typeof obj === 'object') {
      for (const key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
          if (key === 'password' || key === 'oldPassword') {
            continue;
          }
          obj[key] = trimStrings(obj[key]);
        }
      }
    }
    return obj;
  };

  if (req.body) {
    trimStrings(req.body);
  }
  if (req.query) {
    trimStrings(req.query);
  }
  if (req.params) {
    trimStrings(req.params);
  }

  next();
}
