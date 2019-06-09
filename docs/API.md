# API

## Table of contents

* [Sessions](#sessions)
  * [Login](#login)
* [Users](#users)
  * [User registration](#user-registration)
  * [Get all users](#get-all-users)
  * [Get user](#get-user)
  * [Update user](#update-user)
  * [Delete user](#delete-user)
  * [Get user's images](#get-users-images)
  * [Get user's liked images](#get-users-liked-images)
* [Images](#images)
  * [Create an image](#create-an-image)
  * [Get all images](#get-all-images)
  * [Get image](#get-image)
  * [Update image](#update-image)
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

Body parameters:

```
email: string
password: string
```

Headers:

```
content-type: application/json
```

Response:

```json
{
  "user": {
    "_id": "5a0c11682ce7e1000f2a1f5a",
    "name": "Clark Kent",
    "username": "superman",
    "email": "clark.kent@dailyplanet.com",
    "avatar": "d1d99db3ac32052b9dd66cb5914508dd",
    "bio": "Kryptonian hero",
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

Body parameters:

```
name: string
username: string
email: string
password: string
```

Headers:

```
content-type: application/json
```

Response:

```json
{
  "message": "User created."
}
```

### Get all users

```
GET /users
```

Headers:

```
content-type: application/json
authorization: <access-token>
```

Response:

```json
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

URL parameters:

```
userId - id of the user
```

Headers:

```
content-type: application/json
authorization: <access-token>
```

Response:

```json
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

### Update user

```
PUT /users/<userId>
```

URL parameters:

```
userId - id of the user
```

Body parameters:

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
content-type: application/json
authorization: <access-token>
```

Response:

```json
{
  "message": "User updated."
}
```

### Delete user

```
DELETE /users/<userId>
```

URL parameters:

```
userId - id of the user
```

Headers:

```
content-type: application/json
authorization: <access-token>
```

Response:

```json
{
  "message": "User deleted."
}
```

### Get user's images

```
GET /users/<userId>/images
```

URL parameters:

```
userId - id of the user
count - if count=1, the request returns only the count (optional)
```

Headers:

```
content-type: application/json
authorization: <access-token>
```

Response:

```json
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

URL parameters:

```
userId - id of the user
count - if count=1, the request returns only the count (optional)
```

Headers:

```
content-type: application/json
authorization: <access-token>
```

Response:

```json
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

Body parameters:

```
filename: string
description: string
```

Headers:

```
content-type: application/json
authorization: <access-token>
```

Response:

```json
{
  "message": "Image created."
}
```

### Get all images

```
GET /images
```

Headers:

```
content-type: application/json
authorization: <access-token>
```

Response:

```json
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

URL parameters:

```
imageId - id of the image
```

Body parameters:

```
description: string
```

Headers:

```
content-type: application/json
authorization: <access-token>
```

Response:

```json
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

### Update image

```
PUT /images/<imageId>
```

URL parameters:

```
imageId - id of the image
```

Body parameters:

```
description: string
```

Headers:

```
content-type: application/json
authorization: <access-token>
```

Response:

```json
{
  "message": "Image updated."
}
```

### Delete image

```
DELETE /images/<imageId>
```

URL parameters:

```
imageId - id of the image
```

Headers:

```
content-type: application/json
authorization: <access-token>
```

Response:

```json
{
  "message": "Image deleted."
}
```

### Add image to the current user's likes

```
POST /images/<imageId>/likes
```

Headers:

```
content-type: application/json
authorization: <access-token>
```

Response:

```json
{
  "message": "Image liked."
}
```

### Get all users liked an image

```
GET /images/<imageId>/likes
```

URL parameters:

```
imageId - id of the image
count - if count=1, the request returns only the count (optional)
```

Headers:

```
content-type: application/json
authorization: <access-token>
```

Response:

```json
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

URL parameters:

```
imageId - id of the image
userId - id of the user
```

Headers:

```
content-type: application/json
authorization: <access-token>
```

Response:

```json
{
  "message": "Image unliked."
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

Body parameters:

```
image: file sent as multipart/form-data
```

```
authorization: <access-token>
```

Response:

```json
{
  "filename": "d4aab3fd72517522479c08520bc150a3"
}
```

### Load image asset

```
GET /uploads/<filename>
```

URL parameters:

```
filename - filename returned from the upload function
```

Response:

```
The image data
```
