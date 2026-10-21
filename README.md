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
- The consultation forms send by email through Web3Forms. Create a free access key at web3forms.com with the office email, then add it in Vercel → Project → Settings → Environment Variables as `WEB3FORMS_KEY` and redeploy. Without it, the forms show an error asking visitors to call.
- Add the domain braces.co.il in Vercel → Project → Settings → Domains.

## Local preview
```
npm install
npm run preview
```
