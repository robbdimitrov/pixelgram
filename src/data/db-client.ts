import { User } from '../models/user';
import { Image } from '../models/image';

/**
 * An enum with types of user fields to search by.
 */
export enum UserSearchField {
    Identifier,
    Username,
    Email,
}

/**
 * An abstract class used for database operations.
 */
export abstract class DBClient {

    /**
     * Default constructor
     *
     * @param url url of the database
     */
    constructor(protected url: string) {}

    // Images

    /**
     * Returns all images or their count for a given query.
     *
     * @param userId if of the user
     * @param imageId id of the image
     * @returns Promise with empty result or error
     */
    abstract async imageIsOwnedByUser(userId: string, imageId: string);

    /**
     * Returns all images or their count for a given query.
     *
     * @param query used for searching the images
     * @param page current page of content
     * @param limit number of items per page
     * @param countOnly if true, function returns just count. Default is false.
     * @param userId used for checking if the current user has liked the image
     * @returns Promise with either image array or count
     */
    abstract async getAllImages(query: Object, page: number, limit: number,
        countOnly?: boolean, userId?: string);

    /**
     * Creates an image in the database for a given Image object
     *
     * @param user the image to be inserted in the database
     * @returns Promise with the write operation result
     */
    abstract async createOneImage(image: Image);

    /**
     * Returns a Promise with image object with a given identifier
     *
     * @param imageId id of the image
     * @param userId used for checking if the current user has liked the image
     * @returns Promise with Image Object
     */
    abstract async getOneImage(imageId: string, userId?: string);

    /**
     * Updates an image
     *
     * @param imageId id of the image
     * @param imageUpdates JS Object with the updated values
     * @returns Promise with empty object or error
     */
    abstract async updateOneImage(imageId: string, imageUpdates: Object);

    /**
     * Deletes an image with a given id
     *
     * @param userId id of the owner
     * @param imageId id of the image
     * @returns Promise with empty object or error
     */
    abstract async deleteOneImage(userId: string, imageId: string);

    // Users

    /**
     * Returns all users or their count for a given query.
     *
     * @param query used for searching the users
     * @param page current page of content
     * @param limit number of items per page
     * @param countOnly if true, function returns just count. Default is false.
     * @returns Promise with either image array or count
     */
    abstract async getAllUsers(query: Object, page: number, limit: number, countOnly?: boolean);

    /**
     * Creates a user in the database for a given User object
     *
     * @param user the user to be inserted in the database
     * @returns Promise with the write operation result
     */
    abstract async createOneUser(user: User);

    /**
     * Returns a Promise with user object with a given identifier. Identifiers work in the
     * following priority: userId > email > username.
     *
     * @param field field by which to search. Possible values defined in UserSearchField enum
     * @param value value of the field
     * @param raw if true, the raw User object is returned. Default is false.
     * @returns Promise with User JS Object
     */
    abstract async getOneUser(field: UserSearchField, value: string, raw?: boolean);

    /**
     * Updates a user
     *
     * @param userId id of the user
     * @param userUpdates JS Object with the updated values
     * @returns Promise with empty object or error
     */
    abstract async updateOneUser(userId: string, userUpdates: Object);

    /**
     * Deletes a user with a given id
     *
     * @param userId id of the user
     * @returns Promise with empty object or error
     */
    abstract async deleteOneUser(userId: string);

}
