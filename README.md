# REST API for Image sharing service

## Deployment

### Using Docker

### Using npm

#### Config file

Copy over the sample config file and add the missing settings.

```
$ cp ./config/sample.server.config.ts ./config/sample.config.ts
```

#### Install dependencies

Install the node dependencies required for the project.

```
$ npm install
```

#### Build

Run the build script. This produces the compiles `js` file.

```
$ npm run build
```

#### Run

Run the project. By default it runs on port `3000`. This can be changed in `server.config.ts`.

```
$ npm run start
```

## API

- `/`
- `/users`
- `/images`
- `/sessions`
