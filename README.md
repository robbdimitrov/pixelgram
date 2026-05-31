# Pixelgram

**Pixelgram** is an image-sharing application where users can create,
browse and like images.

## Architecture

Service | Language | Description
--- | --- | ---
[backend](/src/backend) | JavaScript | Express API responsible for users, sessions, posts, likes and uploads.
[database](/src/database) | SQL | PostgreSQL database with tables, relationships and functions.
[frontend](/src/frontend) | TypeScript | Angular 21 SPA styled with Tailwind CSS, DaisyUI and Lucide icons.

## Tech stack

- Backend: Node.js, Express, PostgreSQL, `argon2`, session cookies, `multer`
- Frontend: Angular 21, TypeScript, Tailwind CSS, DaisyUI, Lucide Angular
- Database: PostgreSQL schema initialized from `schema.sql`
- Runtime: Docker images deployed to a local kind Kubernetes cluster

## Quickstart

The easiest way to run the app locally is with the deploy script. It creates a kind cluster with a local registry, builds all images, and deploys everything into the `pixelgram` namespace.

```sh
./scripts/deploy.sh
```

Then forward the frontend service:

```sh
kubectl port-forward service/frontend 8080:8080 -n pixelgram
```

Open the frontend at [http://localhost:8080](http://localhost:8080).

## Frontend development

For faster UI iteration, run the Angular dev server locally and point it at a backend running in the kind cluster.

```sh
kubectl port-forward service/backend 8080:8080 -n pixelgram
cd src/frontend && npm start
```

Open [http://localhost:4200](http://localhost:4200). The Angular dev proxy forwards `/api` to `localhost:8080`.

If `8080` is already used by the deployed frontend port-forward, use another backend port and a temporary proxy config.

## Cleanup

For the kind cluster created by the deploy script:

```sh
kind delete cluster --name pixelgram
```

## License

Licensed under the [MIT](LICENSE) License.
