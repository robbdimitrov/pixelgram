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
- Runtime: Docker images deployed to an active Kubernetes cluster (e.g. colima/k3s)

## Quickstart

The easiest way to run the app locally is with the deploy script. It builds all images, creates the `pixelgram` namespace, and deploys everything into your active Kubernetes cluster.

```sh
./scripts/deploy.sh
```

The deploy script automatically starts a background port-forward for the frontend service.

Open the frontend at [http://pixelgram.localhost:8080](http://pixelgram.localhost:8080).

## Frontend development

For faster UI iteration, run the Angular dev server locally and point it at a backend running in the cluster.

```sh
kubectl port-forward service/backend 8080:8080 -n pixelgram
cd src/frontend && npm start
```

Open [http://localhost:4200](http://localhost:4200). The Angular dev proxy forwards `/api` to `localhost:8080`.

If `8080` is already used by the deployed frontend port-forward, use another backend port and a temporary proxy config.

## Testing

The project uses Jest for both frontend and backend unit and integration tests.

```sh
# Run backend test suite
cd src/backend && npx jest

# Run frontend test suite
cd src/frontend && npx jest
```

## Cleanup

To completely remove the deployment from your cluster:

```sh
kubectl delete -f ./k8s -n pixelgram
kubectl delete namespace pixelgram
```

## License

Licensed under the [MIT](LICENSE) License.
