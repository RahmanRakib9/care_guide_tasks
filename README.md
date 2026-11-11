# Care Guide Tasks

## Run locally

1. Install the dependencies from the project root:

   ```sh
   npm install
   ```

2. Start MongoDB locally. The default database is `mongodb://127.0.0.1:27017/secure_notes`.
3. Keep the admin test account values in the root `.env` file:

   ```env
   ADMIN_NAME="Admin bhai"
   ADMIN_EMAIL="admin@gmail.com"
   ADMIN_PASSWORD="123456"
   ```

   The root `.env` is ignored by Git. On a new, empty database, the development server creates the initial admin account automatically. If you already have data and need to create or update this admin, run `npm run seed` from the project root.
4. Start the frontend and backend:

   ```sh
   npm run dev
   ```

5. Open <http://localhost:5173>, choose **Login**, and sign in with the admin email and password above. The API runs at <http://localhost:5000>.

## Deploy to Vercel

Deploy the backend first, then deploy the frontend as a separate Vercel project from this repository.

### 1. Deploy the backend

1. Import the Git repository into Vercel and set **Root Directory** to `server`.
2. Use the Express framework preset and set the build command to `npm run build`. Leave the output directory empty.
3. Add these environment variables to the backend Vercel project:
   - `MONGODB_URI`: your production MongoDB connection string.
   - `JWT_SECRET`: a long, random secret used to sign tokens.
   - `JWT_EXPIRES_IN`: for example, `1d`.
   - `CLIENT_URL`: the production URL of the frontend Vercel project (set this after deploying the frontend).
   - `NODE_ENV`: `production`.
4. Deploy and verify `https://<backend-domain>/api/health` returns a healthy response.

Vercel serves the exported Express app in `server/src/app.ts` as a Function. The app connects to MongoDB on request and reuses the connection while the function instance stays warm. Do not use the local `npm run dev` or `npm start` server command for this deployment.

Vercel does not run the local development seeding logic in `server/src/server.ts`. If the production database has no admin account, seed it from a trusted local environment configured with the production `MONGODB_URI`, `ADMIN_EMAIL`, and `ADMIN_PASSWORD`, then run `npm.cmd run seed --workspace=server` from the repository root. The seed command updates or creates only that admin account; it does not delete other users.

### 2. Deploy the frontend

1. Create a second Vercel project from the same Git repository and set **Root Directory** to `client`.
2. Use the Vite preset, build command `npm run build`, and output directory `dist`.
3. The client Vercel rewrite forwards `/api/*` requests to `https://notes-server-khaki.vercel.app/api/*`. Leave `VITE_API_URL` unset to use this rewrite; if you set it, use the backend API base URL including `/api`.
4. Deploy and open the frontend URL. Login requests should go through the client URL's `/api/auth/login` path and be forwarded to the backend.
5. Update the backend project's `CLIENT_URL` to the frontend's production URL, then redeploy the backend.

The frontend rewrite supports client-side routes such as `/login` and `/admin/users`.

Keep database credentials and JWT secrets in Vercel environment settings; do not commit them to the repository.
