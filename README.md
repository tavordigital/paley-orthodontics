# Paley Orthodontics website

Redesign of braces.co.il for Dr. Jonathan Paley, Modiin.

## Pages
- `/` homepage
- `/about`
- `/children`
- `/adults`
- `/contact`

Page sources live in `src/pages/`, images in `src/assets/`. `npm run build` turns them into a static site in `site/`.

## Deploy on Vercel
1. In Vercel choose **Add New → Project** and import this repo.
2. Leave every setting as it is. `vercel.json` already sets the build command (`npm run build`) and output folder (`site`).
3. Click **Deploy**. Every push to `main` redeploys automatically.

## Before launch
- The consultation form on the homepage and contact page does not send anywhere yet. Connect it to a form service (Formspree, Web3Forms or similar) before going live.
- Add the domain braces.co.il in Vercel → Project → Settings → Domains.

## Local preview
```
npm install
npm run preview
```
