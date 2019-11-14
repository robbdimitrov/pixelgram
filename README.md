<img src="docs/img/logo.png" alt="Pixelgram Logo" width="400"/>

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
| [![Screenshot of feed screen](/docs/img/01_feed.png)](/docs/img/01_feed.png) | [![Screenshot of profile screen](/docs/img/02_profile.png)](/docs/img/02_profile.png) |

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

The API documentation is available [here](/docs/API.md).

## License

Licensed under the [MIT](LICENSE) License.
