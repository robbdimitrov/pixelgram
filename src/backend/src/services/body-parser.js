class BodyParser {
  static parseBodyParametersToObject(body, allowedKeys) {
    const object = new Object();

    for (const key of allowedKeys) {
      if (Object.keys(body).indexOf(key) !== -1) {
        object[key] = body[key];
      }
    }

    return object;
  }
}

module.exports = BodyParser;
