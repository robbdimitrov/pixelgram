# Pixelgram

**Pixelgram** is an image-sharing application where users can create,
browse and like images.

## Architecture

Service | Language | Description
--- | --- | ---
[backend](/src/backend) | JavaScript | Backend of the app, responsible for users, posts and authentication.
[database](/src/database) | SQL | PostgreSQL database with tables, relationships and functions.
[frontend](/src/frontend) | TypeScript | Angular frontend of the app.

## Setup

### Clone the repository

Clone the repository to your filesystem

```sh
git clone git@github.com:robbdimitrov/pixelgram.git
cd pixelgram
```

### Build the images

Build all the images

```sh
make
```

Or build specific images

```sh
make backend
make database
make frontend
```

### Create namespace

Create namespace for the k8s resources

```sh
kubectl create namespace pixelgram
```

### Create deployments

Create deployments and volumes

```sh
kubectl apply -f ./k8s -n pixelgram
```

## Access the frontend

Enable port forwarding

```sh
kubectl port-forward service/frontend 8080 -n pixelgram
```

Open the frontend [here](http://localhost:8080/).

## Cleanup

Delete all resources

```sh
kubectl delete -f ./k8s -n pixelgram
```

Delete the namespace

```sh
kubectl delete namespace pixelgram
```

## API

The API documentation is available [here](/API.md).

## License

Licensed under the [MIT](LICENSE) License.
