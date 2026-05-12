# Pixelgram

**Pixelgram** is an image-sharing application where users can create,
browse and like images.

## Architecture

Service | Language | Description
--- | --- | ---
[backend](/src/backend) | JavaScript | Backend of the app, responsible for users, posts and authentication.
[database](/src/database) | SQL | PostgreSQL database with tables, relationships and functions.
[frontend](/src/frontend) | TypeScript | Angular frontend of the app.

## Quickstart (Kind cluster)

The easiest way to run the app locally is with the deploy script. It creates a kind cluster with a local registry, builds all images, and deploys everything into the `pixelgram` namespace.

```sh
./scripts/deploy.sh
```

Then forward the frontend service:

```sh
kubectl port-forward service/frontend 8080:8080 -n pixelgram
```

Open the frontend at [http://localhost:8080](http://localhost:8080).

## Manual setup

If you prefer to manage your own cluster or registry, follow the steps below.

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
kubectl port-forward service/frontend 8080:8080 -n pixelgram
```

Open the frontend [here](http://localhost:8080/).

## Cleanup

For the kind cluster created by the deploy script:

```sh
kind delete cluster --name pixelgram
```

For manual deployments, delete all resources and the namespace:

```sh
kubectl delete -f ./k8s -n pixelgram
kubectl delete namespace pixelgram
```

## API

The API documentation is available [here](/API.md).

## License

Licensed under the [MIT](LICENSE) License.
