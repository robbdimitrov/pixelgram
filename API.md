# API

The following are all of the supported API calls. Almost all of them require JSON Web Token 
in the headers. The only exclusions are `POST /sessions`, `POST /users` and `GET /uploads`. 
Everything else won't work unless valid token is supplied. Token duration is `12 hours`. 
All request have the prefix `/api/v1.0` or whatever are set in the `server.config.ts` file.

## Table of contents

* [API](#api)
* [Table of contents](#table-of-contents)
* [Sessions](#sessions)
  * [Login](#login)
* [Users](#users)
  * [User registration](#user-registration)
  * [Get all users](#get-all-users)
  * [Get user](#get-user)
  * [Edit user](#edit-user)
  * [Delete user](#delete-user)
  * [Get user's images](#get-users-images)
  * [Get user's liked images](#get-users-liked-images)
* [Images](#images)
  * [Create an image](#create-an-image)
  * [Get all images](#get-all-images)
  * [Get image](#get-image)
  * [Edit image](#edit-image)
  * [Delete image](#delete-image)
  * [Add image to the current user's likes](#add-image-to-the-current-users-likes)
  * [Get all users liked an image](#get-all-users-liked-an-image)
  * [Remove image from user's likes](#remove-image-from-users-likes)
* [Image assets](#image-assets)
  * [Upload an image](#upload-an-image)
  * [Load image asset](#load-image-asset)

## Sessions

### Login

```
POST /sessions
```

Parameters in the request body:

```
email: string
password: string
```

Headers:

```
Content-Type: application/x-www-form-urlencoded
```

Response:

```
{
    "user": {
        "_id": "5a0c11682ce7e1000f2a1f5a",
        "name": "Clark Kent",
        "username": "superman",
        "email": "clark.kent@dailyplanet.com",
        "avatar": "d1d99db3ac32052b9dd66cb5914508dd",
        "bio": "Kriptonian hero",
        "likes": 0,
        "images": 1,
        "registrationDate": "2017-11-15T10:05:28+00:00"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VybmFtZSI6InN1cGVybWFuIiwiaWQiOiI1YTBjMTE2ODJjZTdlMTAwMGYyYTFmNWEiLCJpYXQiOjE1MTA3NDg4ODksImV4cCI6MTUxMDc1MjQ4OX0.ZDmxdzis314r1VNSXWKjqHDCVrilfdeJO9d5Rviids0"
}
```

## Users

### User registration

```
POST /users
```

Parameters in the request body:

```
name: string
username: string
email: string
password: string
```

Headers:

```
Content-Type: application/x-www-form-urlencoded
```

Response:

```
{
    "message": "User with email superman@dccomics.com created successfully."
}
```

### Get all users

```
GET /users
```

Headers:

```
Content-Type: application/x-www-form-urlencoded
X-Access-Token: <valid-session-token>
```

Response:

```
{
    "users": [
        {
            "_id": "5a0c11682ce7e1000f2a1f5a",
            "name": "Clark Kent",
            "username": "superman",
            "email": "clark.kent@dailyplanet.com",
            "avatar": "d1d99db3ac32052b9dd66cb5914508dd",
            "bio": "Kriptonian hero",
            "likes": 0,
            "images": 2,
            "registrationDate": "2017-11-15T10:05:28+00:00"
        },
        {
            "_id": "5a0c361b7ceeae000ffc8bdd",
            "name": "Bruce Wayne",
            "username": "batman",
            "email": "bruce@wayneindustries.com",
            "avatar": "",
            "bio": "The dark knight",
            "likes": 1,
            "images": 1,
            "registrationDate": "2017-11-15T12:42:03+00:00"
        }
    ]
}
```

### Get user

```
GET /users/<userId>
```

Parameters in the URL:

```
userId - id of the user
```

Headers:

```
Content-Type: application/x-www-form-urlencoded
X-Access-Token: <valid-session-token>
```

Response:

```
{
    "user": {
        "_id": "5a0c11682ce7e1000f2a1f5a",
        "name": "Clark Kent",
        "username": "superman",
        "email": "clark.kent@dailyplanet.com",
        "avatar": "d1d99db3ac32052b9dd66cb5914508dd",
        "bio": "",
        "likes": 1,
        "images": 1,
        "registrationDate": "2017-11-15T10:05:28+00:00"
    }
}
```

### Edit user

```
PUT /users/<userId>
```

Parameters in the URL:

```
userId - id of the user
```

Parameters in the request body:

```
name: string (optional)
username: string (optional)
email: string (optional)
password: string (optional)
oldPassword: string (optional, required if password is present)
avatar: string (optional)
bio: string (optional)
```

Headers:

```
Content-Type: application/x-www-form-urlencoded
X-Access-Token: <valid-session-token>
```

Response:

```
{
    "message": "User updated successfully."
}
```

### Delete user

```
DELETE /users/<userId>
```

Parameters in the URL:

```
userId - id of the user
```

Headers:

```
Content-Type: application/x-www-form-urlencoded
X-Access-Token: <valid-session-token>
```

Response:

```
{
    "message": "User deleted successfully."
}
```

### Get user's images

```
GET /users/<userId>/images
```

Parameters in the URL:

```
userId - id of the user
count - if count=1, the request returns only the count (optional)
```

Headers:

```
Content-Type: application/x-www-form-urlencoded
X-Access-Token: <valid-session-token>
```

Response:

```
{
    "images": [
        {
            "_id": "5a0c5629ca682d61abcd5786",
            "ownerId": "5a09b5acc3d0655f6f6225cb",
            "filename": "d1d99db3ac32052b9dd66cb5914508dd",
            "description": "Image description",
            "dateCreated": "2017-11-15T16:58:49+02:00",
            "likes": 2,
            "isLiked": true
        },
        {
            "_id": "5a0c5630ca682d61abcd5787",
            "ownerId": "5a09b5acc3d0655f6f6225cb",
            "filename": "d1d99db3ac32052b9dd66cb5914508dd",
            "description": "Other description #awesome",
            "dateCreated": "2017-11-15T16:58:56+02:00",
            "likes": 1,
            "isLiked": false
        }
    ]
}
```

### Get user's liked images

```
GET /users/<userId>/likes
```

Parameters in the URL:

```
userId - id of the user
count - if count=1, the request returns only the count (optional)
```

Headers:

```
Content-Type: application/x-www-form-urlencoded
X-Access-Token: <valid-session-token>
```

Response:

```
{
    "images": [
        {
            "_id": "5a0c5629ca682d61abcd5786",
            "ownerId": "5a09b5acc3d0655f6f6225cb",
            "filename": "d1d99db3ac32052b9dd66cb5914508dd",
            "description": "Image description",
            "dateCreated": "2017-11-15T16:58:49+02:00",
            "likes": 2,
            "isLiked": true
        }
    ]
}
```

## Images

### Create an image

```
POST /images
```

Parameters in the request body:

```
filename: string
description: string
```

Headers:

```
Content-Type: application/x-www-form-urlencoded
X-Access-Token: <valid-session-token>
```

Response:

```
{
    "message": "Image created successfully."
}
```

### Get all images

```
GET /images
```

Headers:

```
Content-Type: application/x-www-form-urlencoded
X-Access-Token: <valid-session-token>
```

Response:

```
{
    "images": [
        {
            "_id": "5a0996ba2775b637bd49b0ab",
            "ownerId": "5a069fd03bd9992ce9520ec5",
            "filename": "6710497b36573655ed145f1bc1e01052",
            "description": "Some image description",
            "dateCreated": "2017-11-13T14:57:19+02:00",
            "likes": 0,
            "isLiked": false
        },
        {
            "_id": "5a0c5629ca682d61abcd5786",
            "ownerId": "5a09b5acc3d0655f6f6225cb",
            "filename": "d1d99db3ac32052b9dd66cb5914508dd",
            "description": "Image description 2",
            "dateCreated": "2017-11-15T16:58:49+02:00",
            "likes": 1,
            "isLiked": true
        }
    ]
}
```

### Get image

```
GET /images/<imageId>
```

Parameters in the URL:

```
imageId - id of the image
```

Parameters in the request body:

```
description: string
```

Headers:

```
Content-Type: application/x-www-form-urlencoded
X-Access-Token: <valid-session-token>
```

Response:

```
{
    "image": {
        "_id": "5a0996ba2775b637bd49b0ab",
        "ownerId": "5a069fd03bd9992ce9520ec5",
        "filename": "6710497b36573655ed145f1bc1e01052",
        "description": "Image description",
        "dateCreated": "2017-11-13T14:57:19+02:00",
        "likes": 2,
        "isLiked": true
    }
}
```

### Edit image

```
PUT /images/<imageId>
```

Parameters in the URL:

```
imageId - id of the image
```

Parameters in the request body:

```
description: string
```

Headers:

```
Content-Type: application/x-www-form-urlencoded
X-Access-Token: <valid-session-token>
```

Response:

```
{
    "message": "Image updated successfully."
}
```

### Delete image

```
DELETE /images/<imageId>
```

Parameters in the URL:

```
imageId - id of the image
```

Headers:

```
Content-Type: application/x-www-form-urlencoded
X-Access-Token: <valid-session-token>
```

Response:

```
{
    "message": "Image deleted successfully."
}
```

### Add image to the current user's likes

```
POST /images/<imageId>/likes
```

Headers:

```
Content-Type: application/x-www-form-urlencoded
X-Access-Token: <valid-session-token>
```

Response:

```
{
    "message": "Image liked successfully."
}
```

### Get all users liked an image

```
GET /images/<imageId>/likes
```

Parameters in the URL:

```
imageId - id of the image
count - if count=1, the request returns only the count (optional)
```

Headers:

```
Content-Type: application/x-www-form-urlencoded
X-Access-Token: <valid-session-token>
```

Response:

```
{
    "users": [
        {
            "_id": "5a09b5acc3d0655f6f6225cb",
            "name": "Bruce Wayne",
            "username": "batman",
            "email": "bruce@wayneindustries.com",
            "avatar": "",
            "bio": "The dark knight",
            "likes": 1,
            "images": 2,
            "registrationDate": "2017-11-13T17:09:19+02:00"
        }
    ]
}
```

### Remove image from user's likes

```
DELETE /images/<imageId>/likes/<userId>
```

Parameters in the URL:

```
imageId - id of the image
userId - id of the user
```

Headers:

```
Content-Type: application/x-www-form-urlencoded
X-Access-Token: <valid-session-token>
```

Response:

```
{
    "message": "Image unliked successfully."
}
```

## Image assets

### Upload an image

An image asset has to be uploaded before creating an Image object. The returned image name
is used for the `filename` parameter. File size should be less than 1MB. 
This is used for uploading user's avatars as well.

```
POST /upload
```

Parameters in the request body:

```
image: file sent as multipart/form-data
```

```
Content-Type: application/x-www-form-urlencoded
X-Access-Token: <valid-session-token>
```

Response:

```
{
    "filename": "d4aab3fd72517522479c08520bc150a3"
}
```

### Load image asset

```
GET /uploads/<filename>
```

Parameters in the URL:

```
filename - filename returned from the upload function
```

Response:

```
The image data
```
