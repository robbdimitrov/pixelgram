<img src="docs/logo/horizontal.png" alt="Pixelgram Logo" width="400"/>

Pixelgram is an image sharing service.

## Table of contents

- [Stack](#stack)
- [Screenshots](#screenshots)
- [Setup](#setup)
  - [Clone the repository](#clone-the-repository)
  - [Build and run](#build-and-run)
- [API](#api)
- [License](#license)

## Stack

- Angular front end
- Express back end
- MongoDB database
- NGINX
- Docker

## Screenshots

| Feed | Profile |
| --- | --- |
| [![Screenshot of feed screen](/docs/img/01_Feed.png)](/docs/img/01_Feed.png) | [![Screenshot of profile screen](/docs/img/02_Profile.png)](/docs/img/02_Profile.png) |

| Edit Profile | New Post |
| --- | --- |
| [![Screenshot of edit profile screen](/docs/img/03_Edit_Profile.png)](/docs/img/03_Edit_Profile.png) | [![Screenshot of new post screen](/docs/img/04_New_Post.png)](/docs/img/04_New_Post.png) |

| Login | Register |
| --- | --- |
| [![Screenshot of login screen](/docs/img/05_Login.png)](/docs/img/05_Login.png) | [![Screenshot of register screen](/docs/img/06_Register.png)](/docs/img/06_Register.png) |

## Setup

### Clone the repository

Clone the repository to your filesystem

```sh
$ git clone git@github.com:robbdimitrov/pixelgram.git
$ cd pixelgram
```

### Build and run

Build images

```sh
$ docker-compose build
```

Run containers

```sh
$ docker-compose up
```

Stop containers

```sh
$ docker-compose down
```

Open the front-end [here](http://localhost:4000/) and access the API [here](http://localhost:4000/api/).

## API

The API documentation is available [here](docs/API.md).

## License

Licensed under the [MIT](LICENSE) License.
