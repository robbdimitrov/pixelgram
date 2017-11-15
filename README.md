# Pixelgram API

REST API for image sharing service

## Setup

### Clone the repository

Clone the repository to your filesystem

```
$ git clone git@github.com:robbdimitrov/pixelgram-api.git
$ cd pixelgram-api
```

### Config file

Copy over the sample config file and edit the default settings if need

```
$ cp ./config/sample.server.config.ts ./config/sample.config.ts
```

### Using Docker

Create a `Docker` machine

```
$ docker-machine create --driver virtualbox default
$ eval $(docker-machine env default)
```

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

### Using npm

This method will require setting supplying your own [MongoDB](https://www.mongodb.com/) instance. 
For download and configuration see https://docs.mongodb.com/manual/installation/.
After instalation make sure the instance is running and the correct URI is added to your `condig/server.config.ts` file.
It should look like `mongodb://<user>:<pass>@<server>:<mongo-port: default: 27017>/<database-name>`.

#### Install dependencies

Install the node dependencies required for the project

```
$ npm install
```

#### Build

Run the build script. This produces the compiled `js` file.

```
$ npm run build
```

#### Run

Run the project. By default it runs on port `3000`. This can be changed in `server.config.ts`.

```
$ npm run start
```

## API

The API documentation is available [here](API.md).

## Contact

[Robert Dimitrov](http://robbdimitrov.com)   
[@robbdimitrov](https://twitter.com/robbdimitrov)

## License

Copyright (c) 2017 Robert Dimitrov. Code released under the [MIT license](LICENSE).
