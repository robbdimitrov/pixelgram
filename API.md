# API

The following are all of the supported API calls. Almost all of them require JSON Web Token 
in the headers. The only exclusions are `POST /sessions` and `POST /users`. Everything else won't 
work unless valid token is supplied. Token duration is `1 hour`.

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
        "likedImages": [
            "5a0c186b7ceeae000ffc8bdc"
        ],
        "postedImages": [
            "5a0c186b7ceeae000ffc8bdc"
        ],
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
email: name
password: username
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
x-access-token: <valid-session-token>
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
            "likedImages": [
                "5a0c186b7ceeae000ffc8bdc"
            ],
            "postedImages": [
                "5a0c186b7ceeae000ffc8bdc"
            ],
            "registrationDate": "2017-11-15T10:05:28+00:00"
        },
        {
            "_id": "5a0c361b7ceeae000ffc8bdd",
            "name": "Bruce Wayne",
            "username": "batman",
            "email": "bruce@wayneindustries.com",
            "avatar": "",
            "bio": "The dark knight",
            "likedImages": [],
            "postedImages": [],
            "registrationDate": "2017-11-15T12:42:03+00:00"
        }
    ]
}
```

### Get a user

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
x-access-token: <valid-session-token>
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
        "likedImages": [
            "5a0c186b7ceeae000ffc8bdc"
        ],
        "postedImages": [
            "5a0c186b7ceeae000ffc8bdc"
        ],
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
email: name
password: username
email: string
password: string
avatar: string
bio: string
```

Headers:

```
Content-Type: application/x-www-form-urlencoded
x-access-token: <valid-session-token>
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
x-access-token: <valid-session-token>
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
x-access-token: <valid-session-token>
```

Response:

```
{
    "images": [
        {
            "_id": "5a0c5629ca682d61abcd5786",
            "ownerID": "5a09b5acc3d0655f6f6225cb",
            "url": "d1d99db3ac32052b9dd66cb5914508dd",
            "description": "Sweet doggy",
            "dateCreated": "2017-11-15T16:58:49+02:00",
            "likedUsers": []
        },
        {
            "_id": "5a0c5630ca682d61abcd5787",
            "ownerID": "5a09b5acc3d0655f6f6225cb",
            "url": "d1d99db3ac32052b9dd66cb5914508dd",
            "description": "Sweet doggy",
            "dateCreated": "2017-11-15T16:58:56+02:00",
            "likedUsers": []
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
x-access-token: <valid-session-token>
```

Response:

```
{
    "images": [
        {
            "_id": "5a0c5629ca682d61abcd5786",
            "ownerID": "5a09b5acc3d0655f6f6225cb",
            "url": "d1d99db3ac32052b9dd66cb5914508dd",
            "description": "Sweet doggy",
            "dateCreated": "2017-11-15T16:58:49+02:00",
            "likedUsers": [
                "5a09b5acc3d0655f6f6225cb"
            ]
        }
    ]
}
```
