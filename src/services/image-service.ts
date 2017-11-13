class ImageService {

    private static instance: ImageService;

    private constructor() {}

    static getInstance() {
        if (!ImageService.instance) {
            ImageService.instance = new ImageService();
        }
        return ImageService.instance;
    }

    likeImage(imageId: string, userId: string) {

    }

    unlikeImage(imageId: string, userId: string) {

    }

    allImagesForUser(userId: string) {

    }

    allImagesLikedByUser(userId: string) {

    }

    numberOfUsersLikedImage(imageId: string) {

    }

    createImage(ownerId: string, url: string, description: string) {

    }

}
