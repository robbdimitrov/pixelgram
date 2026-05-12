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

## Cleanup

For the kind cluster created by the deploy script:

```sh
kind delete cluster --name pixelgram
```

## License

Licensed under the [MIT](LICENSE) License.
