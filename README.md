# Welcome to your Lovable project

## Project info

**URL**: https://lovable.dev/projects/ab4ae2f9-2cdb-4d5d-a568-cf5b96cac09f

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/ab4ae2f9-2cdb-4d5d-a568-cf5b96cac09f) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## Local development

Install deps and run the dev server:

```bash
npm i
npm run dev
```

Build for production:

```bash
npm run build
```

## Vercel deployment

This repo includes `vercel.json` to enable SPA rewrites so client routes work when refreshing or deep linking. Ensure your build outputs to `dist` (Vite default).

## Firebase (optional migration)

If you prefer Firebase over Supabase, add these environment variables (Vite format) in your local `.env` and in Vercel Project Settings → Environment Variables:

- VITE_FIREBASE_API_KEY
- VITE_FIREBASE_AUTH_DOMAIN
- VITE_FIREBASE_PROJECT_ID
- VITE_FIREBASE_STORAGE_BUCKET
- VITE_FIREBASE_MESSAGING_SENDER_ID
- VITE_FIREBASE_APP_ID
- VITE_FIREBASE_MEASUREMENT_ID (optional)

A minimal Firebase client is scaffolded at `src/integrations/firebase/client.ts`. Wiring auth, profile storage, and document uploads to Firebase requires replacing Supabase usage in `src/hooks/useAuth.tsx`, `src/components/DocumentUpload.tsx`, and pages that query `profiles` with Firestore and Firebase Auth equivalents.

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/ab4ae2f9-2cdb-4d5d-a568-cf5b96cac09f) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/tips-tricks/custom-domain#step-by-step-guide)

## Documentation

- Start here: [docs/FullDocumentation.md](docs/FullDocumentation.md)
- For modular references, see: [docs/README.md](docs/README.md)
