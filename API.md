## API

The following are all of the supported API calls. Almost all of them require JSON Web Token supplied 
in the headers. The only exclusions are `POST /sessions` and `POST /users`. Everything else won't 
work unless valid token is supplied. Token duration is `1 hour`.

### Sessions

#### Login

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

### Users

#### User registration

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

#### Get all users

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
