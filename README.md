# Haikin & Co. website (חייקין ושות׳)

Static, Hebrew (RTL) one-page website for Haikin & Co., attorneys and notary.
One office photograph stays behind every section. The opening screen shows the managing partner's cut-out portrait,
which slides in once on load; nothing animates on scroll.

## Structure

```
index.html            page markup (RTL, lang="he")
assets/css/styles.css all styles, including the readability layer over the photos
assets/js/main.js     background photo, section indicator, portrait centring, dust animation, contact form
assets/img/           office photos (full size + "-sm"), portrait-*.webp cut-out at 900/1600/2400/3712 px wide
```

There is no backend and no build step. The contact form does not send data to any server:
it builds an email draft to office@hdl-law.co.il in the visitor's mail app.
The only external request is Google Fonts (David Libre, Assistant).

## Run locally

Open `index.html` in a browser, or serve the folder:

```
npx serve .
```

## Publish to GitHub (first time)

1. On github.com create a new **private** repository named `haikin-law-site` (no README, no .gitignore).
2. In this folder run:

```
git init
git add .
git commit -m "Initial commit: Haikin & Co. website"
git branch -M main
git remote add origin https://github.com/<your-username>/haikin-law-site.git
git push -u origin main
```

Or open this folder in Claude Code and ask it to push to the new repo.

## Hosting

Any static host works: GitHub Pages (Settings → Pages → branch `main`, root),
Netlify or Vercel (drag and drop the folder, no build command).
