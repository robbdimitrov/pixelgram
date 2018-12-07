# Pixelgram

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

```
$ git clone git@github.com:robbdimitrov/pixelgram.git
$ cd pixelgram
```

### Build and run

Build images

```
$ docker-compose build
```

Run containers

```
$ docker-compose up
```

Stop containers

```
$ docker-compose down
```

Open the front-end [here](http://localhost:4000/) and access the API [here](http://localhost:4000/api/v1/).

## API

The API documentation is available [here](API.md).

## Contact

[Robert Dimitrov](http://robbdimitrov.com)   

[@robbdimitrov](https://twitter.com/robbdimitrov)

## License

Copyright (c) Robert Dimitrov.

Licensed under the [MIT](LICENSE) License.
