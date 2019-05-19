import { User } from "../models/user.model";

export class UserFactory {

    static userFromObject(object: Object): User {
        let image = new User(
            object["_id"],
            object["name"],
            object["username"],
            object["email"],
            object["avatar"],
            object["bio"],
            object["images"],
            object["likes"]
        );
        return image;
    }

}
