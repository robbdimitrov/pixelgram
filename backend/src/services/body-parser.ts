export class BodyParser {

    static parseBodyParametersToObject(body: any, allowedKeys: string[]): Object {
        let object = new Object();

        for (let i = 0; i < allowedKeys.length; i++) {
            let key = allowedKeys[i];
            if (Object.keys(body).indexOf(key) !== -1) {
                object[key] = body[key];
            }
        }

        return object;
    }

}
