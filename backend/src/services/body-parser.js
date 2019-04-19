export class BodyParser {
  static parseBodyParametersToObject(body, allowedKeys) {
    let object = new Object();

    for (let key of allowedKeys) {
      if (Object.keys(body).indexOf(key) !== -1) {
        object[key] = body[key];
      }
    }

    return object;
  }
}
