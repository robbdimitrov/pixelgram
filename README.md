<!-- ![Pixelgram Logo](logo/horizontal.png) -->
<img src="logo/horizontal.png" alt="Pixelgram Logo" width="400"/>

Pixelgram is an image sharing service.

## Table of contents

- [Stack](#stack)
- [Screenshots](#screenshots)
- [Setup](#setup)
  - [Clone the repository](#clone-the-repository)
  - [Build and run](#build-and-run)
- [API](#api)
- [Contact](#contact)
- [License](#license)

## Stack

- Angular front end
- Express back end
- MongoDB database
- NGINX
- Docker

## Screenshots

Screenshots are available in the [`screenshots`](screenshots) directory.

## Setup

### Clone the repository

Clone the repository to your filesystem

```sh
$ git clone git@github.com:robbdimitrov/pixelgram.git
$ cd pixelgram
```

### Create .env

Copy the `.env.example` file to `.env`

```sh
$ cp .env.example .env
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

The API documentation is available [here](API.md).

## License

Licensed under the [MIT](LICENSE) License.
