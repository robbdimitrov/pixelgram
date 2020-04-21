# Pixelgram

**Pixelgram** is an image-sharing application where users can create, 
browse and like images.

## Table of contents

- [Stack](#stack)
- [Screenshots](#screenshots)
- [Setup](#setup)
  - [Clone the repository](#clone-the-repository)
  - [Build the images](#build-the-images)
  - [Create deployments](#create-deployments)
- [Access the frontend](#access-the-frontend)
- [Cleanup](#cleanup)
- [API](#api)
- [License](#license)

## Stack

- Angular
- Express
- PostgreSQL
- Docker
- Kubernetes

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

### Build the images

Build all the images

```sh
$ make
```

Or build specific images

```sh
$ make frontend
$ make backend
$ make database
```

### Create namespace

Create namespace for the k8s resources

```sh
$ kubectl create namespace pixelgram
```

### Create deployments

Create deployments and volumes

```sh
$ kubectl apply -f ./k8s -n pixelgram
```

## Access the frontend

Enable port forwarding

```sh
$ kubectl port-forward service/frontend 8080:8080 -n pixelgram
```

Open the frontend [here](http://localhost:8080/).

## Cleanup

Delete all resources

```sh
$ kubectl delete -f ./k8s -n pixelgram
```

Delete the namespace

```sh
$ kubectl delete namespace pixelgram
```

## API

The API documentation is available [here](/docs/API.md).

## License

Licensed under the [MIT](LICENSE) License.
