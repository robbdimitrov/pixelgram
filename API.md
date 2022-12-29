# API

## Table of contents

* [Users](#users)
  * [Create user](#create-user)
  * [Get user](#get-user)
  * [Update user](#update-user)
  * [Get user's images](#get-users-images)
  * [Get user's likes](#get-users-likes)
* [Sessions](#sessions)
  * [Login](#login)
  * [Logout](#logout)
* [Images](#images)
  * [Create image](#create-image)
  * [Get feed](#get-feed)
  * [Get images](#get-images)
  * [Get liked images](#get-liked-images)
  * [Get image](#get-image)
  * [Delete image](#delete-image)
  * [Like image](#like-image)
  * [Unlike image](#unlike-image)
* [Image assets](#image-assets)
  * [Upload image](#upload-image)
  * [Load image asset](#load-image-asset)

## Users

### Create user

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

Response:

```json
{
  "id": 10
}
```

### Get user

```
GET /users/:userId
```

Path parameters:

```
userId - id of the user
```

Response:

```json
{
  "id": 10,
  "name": "Clark Kent",
  "username": "superman",
  "email": "clark.kent@dailyplanet.com",
  "avatar": "d1d99db3ac32052b9dd66cb5914508dd",
  "bio": "Kryptonian hero",
  "likes": 2,
  "images": 10,
  "created": "2017-11-15T10:05:28Z"
}
```

### Update user

```
PUT /users/:userId
```

Path parameters:

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

### Get user's images

```
GET /users/:userId/images
```

Path parameters:

```
userId - id of the user
```

Response:

```json
{
  "items": [
    {
      "id": 12,
      "userId": 10,
      "filename": "d1d99db3ac32052b9dd66cb5914508dd",
      "description": "Image description",
      "likes": 2,
      "liked": true,
      "created": "2017-11-15T16:58:49Z"
    }
  ]
}
```

### Get user's likes

```
GET /users/:userId/likes
```

Path parameters:

```
userId - id of the user
```

Response:

```json
{
  "items": [
    {
      "id": 12,
      "userId": 10,
      "filename": "d1d99db3ac32052b9dd66cb5914508dd",
      "description": "Image description",
      "likes": 2,
      "liked": true,
      "created": "2017-11-15T16:58:49Z"
    }
  ]
}
```

## Sessions

### Login

Sets an `session` cookie with the session id.

```
POST /sessions
```

Body parameters:

```
email: string
password: string
```

Response:

```json
{
  "id": 10
}
```

### Logout

The active session is taken from the `session` cookie.

```
DELETE /sessions
```

## Images

### Create image

```
POST /images
```

Body parameters:

```
filename: string
description: string
```

Response:

```json
{
  "id": 12
}
```

### Get feed

```
GET /images
```

Response:

```json
{
  "items": [
    {
      "id": 12,
      "userId": 10,
      "filename": "6710497b36573655ed145f1bc1e01052",
      "description": "Some image description",
      "likes": 3,
      "liked": false,
      "created": "2017-11-13T14:57:19Z"
    }
  ]
}
```

### Get images

```
GET /users/:userId/images
```

Response:

```json
{
  "items": [
    {
      "id": 12,
      "userId": 10,
      "filename": "6710497b36573655ed145f1bc1e01052",
      "description": "Some image description",
      "likes": 3,
      "liked": false,
      "created": "2017-11-13T14:57:19Z"
    }
  ]
}
```

### Get liked images

```
GET /users/:userId/likes
```

Response:

```json
{
  "items": [
    {
      "id": 12,
      "userId": 10,
      "filename": "6710497b36573655ed145f1bc1e01052",
      "description": "Some image description",
      "likes": 3,
      "liked": false,
      "created": "2017-11-13T14:57:19Z"
    }
  ]
}
```

### Get image

```
GET /images/:imageId
```

Path parameters:

```
imageId - id of the image
```

Response:

```json
{
  "id": 12,
  "userId": 10,
  "filename": "6710497b36573655ed145f1bc1e01052",
  "description": "Some image description",
  "likes": 3,
  "liked": false,
  "created": "2017-11-13T14:57:19Z"
}
```

### Delete image

```
DELETE /images/:imageId
```

Path parameters:

```
imageId - id of the image
```

### Like image

```
POST /images/:imageId/likes
```

Path parameters:

```
imageId - id of the image
```

### Unlike image

```
DELETE /images/:imageId/likes
```

Path parameters:

```
imageId - id of the image
```

## Image assets

### Upload image

An image asset has to be uploaded before creating an Image object.
The returned image name is used for the `filename` parameter.
File size should be less than 1MB.

```
POST /uploads
```

Body parameters:

```
image: file sent as multipart/form-data
```

Response:

```json
{
  "filename": "d4aab3fd72517522479c08520bc150a3"
}
```

### Load image asset

```
GET /uploads/:filename
```

Path parameters:

```
filename - filename returned from the upload function
```

Response:

```
The image data
```
