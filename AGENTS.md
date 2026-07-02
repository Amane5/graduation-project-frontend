# Repository Guidelines

## Project Structure & Module Organization

This is a Vite React TypeScript frontend. Application code lives in `src/`, with the app shell in `src/App.tsx` and entrypoint in `src/main.tsx`. Reusable UI is under `src/components/`; shadcn/Radix-style primitives are in `src/components/ui/`, while feature components are grouped in `chat/`, `dashboard/`, and `report/`. Shared hooks, contexts, helpers, models, and integrations belong in their matching `src/` folders. Tests and setup live in `src/test/`, and static assets live in `public/`. Do not edit generated `dist/` files by hand.

## Build, Test, and Development Commands

- `npm run dev`: start the Vite dev server on port `8080`.
- `npm run build`: create the production build in `dist/`.
- `npm run build:dev`: build with Vite development mode.
- `npm run preview`: preview the built app locally.
- `npm run lint`: run ESLint across the repository.
- `npm run test`: run Vitest once.
- `npm run test:watch`: run Vitest in watch mode.

Use npm for consistency with `package-lock.json`. Avoid mixing dependency managers unless lockfiles are intentionally reconciled.

## Coding Style & Naming Conventions

Use TypeScript and React function components. Prefer the `@/` alias for imports from `src/`, for example `@/components/ui/button`. Keep component files in PascalCase (`AppNavbar.tsx`), hooks in camelCase with a `use` prefix, and utilities in the surrounding folder's style. ESLint uses `typescript-eslint`, React Hooks rules, and React Refresh checks; fix warnings before opening a PR. Prettier uses defaults via `.prettierrc`.

## Testing Guidelines

There is no test strategy, Don't create any test.

## Commit & Pull Request Guidelines

Recent commits use short, direct messages such as `add-drawing-story`, `save-changes`, and `remove base property`. Keep new subjects concise, lower-case when practical, and focused on one change. Pull requests should include a brief summary, tests run (`npm run lint`, `npm run test`, `npm run build`), linked issues, and screenshots for visible UI changes.

## Security & Configuration Tips

Keep secrets out of git. Local environment values belong in `.env`; document required variables without committing credentials. Be careful with `firebase-messaging-sw.js`, Supabase/Firebase integration code, and `vercel.json`, because these can affect production behavior.
