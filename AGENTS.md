# figma-make-app

React + Vite + Tailwind CSS project running inside Figma Make.

## Development Server

A Vite development server is **already running** on `$PORT` (default 8443). You don't need to start it manually.

- Preview URL: The user can access the running app through the preview panel
- Hot reload: Changes to source files are reflected immediately

## Project Structure

This is the canonical project structure. Start with task-relevant files below. Only follow imports or inspect other files when required, when a documented path is missing, or when the repository contradicts this guide.

- `src/main.tsx` - React entrypoint; imports `src/index.css` and mounts `src/App.tsx` into the `#root` element
- `src/App.tsx` - Primary application component and the usual starting point for UI work
- `src/index.css` - Global CSS entrypoint and Tailwind CSS v4 import
- `index.html` - Vite HTML shell containing the `#root` element and loading `src/main.tsx`
- `package.json` - Project dependencies and the Vite build, development, preview, and formatting scripts
- `vite.config.ts` - Vite configuration with React, Tailwind CSS v4, and Figma Make plugins plus the `@` alias for `src`
- `.mise.toml` - Toolchain versions for Node.js and pnpm

## Dependencies

- Runtime: React 19 and React DOM 19
- Styling: Tailwind CSS v4 with the `@tailwindcss/vite` plugin
- Build tooling: Vite 8, TypeScript 5.7, and `@vitejs/plugin-react`
- Formatting: oxfmt

## Styling

This project uses **Tailwind CSS v4** through the `@tailwindcss/vite` plugin configured in `vite.config.ts`. `src/index.css` imports Tailwind with `@import 'tailwindcss';`. Use Tailwind utility classes directly in JSX and put global CSS or Tailwind v4 theme customization in `src/index.css`. This scaffold does not need a Tailwind config file or PostCSS config.

`src/main.tsx` imports `src/index.css`, so global font wiring belongs in `src/index.css`. Keep CSS `@import` statements first, then add any `@font-face` rules and font-family defaults there.

## Code quality

- Use double quotes for strings containing apostrophes (`"We're here to help"`), or escape them in single-quoted strings. An unescaped apostrophe in a single-quoted string breaks the build.
- Ensure JSX tags are closed and braces are balanced.
- Export components as default exports.

## Mandatory Tool & Infrastructure Verification Protocol

Before executing ANY operation involving databases, storage, email, or third-party services, all AI agents **MUST** confirm the target against [`PROJECT_TOOLS.md`](file:///c:/Dev/Active%20Projects/lux%202/PROJECT_TOOLS.md).

- **Neon Database**:
  - **Authorized Project ID**: `soft-butterfly-02907949` (`Luxury Shop Mauritius`)
  - **Authorized Branch**: `production`
  - **Account Owner**: `anesumupesa@gmail.com`
  - **Host**: `ep-morning-firefly-ay13w5o8-pooler.c-5.us-east-2.aws.neon.tech`
  - ⚠️ **PROHIBITED**: Never target `rapid-hill-42448439` (`Zimthreads Collective`) or any other project.
- **Neon S3 Storage**:
  - **Bucket Name**: `luxury-brands`
  - **Region**: `us-east-2`
  - **Retention Policy**: 90-day retention for Proof of Payment uploads.
- **Resend Email**:
  - **Admin Recipient**: `anesumupesa@gmail.com`
  - **Sender**: `Noir & Lumière <onboarding@resend.dev>`
- **Cloudinary**:
  - **Target Namespace**: `noir-lumiere/`
  - Confirm credentials and cloud name in [`PROJECT_TOOLS.md`](file:///c:/Dev/Active%20Projects/lux%202/PROJECT_TOOLS.md) before implementing media uploads.
- **GitHub & Version Control**:
  - **Authorized Account Email**: `anesumupesa@gmail.com`
  - ⚠️ **STRICTLY PROHIBITED**: Never link, commit, configure, or push to any GitHub account other than `anesumupesa@gmail.com` (strictly forbid `anesu@intern-mail.metabox.technology` or any corporate/secondary accounts).

**Enforcement Gate**: If ANY parameter or project ID does not match, the AI **MUST ABORT IMMEDIATELY** and request user confirmation.

