# BiblioDrop Server

Express API scaffold for the BiblioDrop platform.

## Vercel Deployment

- Deploy this folder as its own Vercel project.
- Vercel will load `index.js` and run the Express app without `app.listen()` in production.
- Set `CLIENT_ORIGIN` to your live client URL, then redeploy after the client is live.
- Set `BETTER_AUTH_URL` to your live server URL, like `https://your-server.vercel.app`.
- The browser client should use the deployed server URL as `NEXT_PUBLIC_API_BASE_URL`.
- Use `BETTER_AUTH_SECRET` as the signing secret for sessions and OAuth state.

## Endpoints

- `GET /api/health`
- `GET /api/books`
- `GET /api/books/:id`
- `GET /api/dashboard/:role`
- `POST /api/auth/login`
- `POST /api/auth/register`
- `POST /api/auth/google/start`
- `GET /api/auth/google/callback`
- `POST /api/auth/logout`
- `GET /api/me`
- `POST /api/uploads/image`
- `POST /api/deliveries/request`
- `POST /api/reviews`
- `GET /api/transactions`

## Environment

Copy `.env.example` to `.env` and fill the values before connecting to real services.

Required values:

- `MONGODB_URI` for user persistence
- `BETTER_AUTH_SECRET` for session signing
- `BETTER_AUTH_URL` for the public auth server URL
- `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` for Google sign-in
- `IMGBB_API_KEY` for profile image uploads
- `CLIENT_ORIGIN` with the deployed client URL
