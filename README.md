# Ike

Ike is a tiny Eisenhower matrix task management app.

Tasks can be placed in four quadrants -- urgent/important (Q1), important (Q2), important (Q3), and neither (Q4). Everything is saved in `localStorage`, so it works offline with no build step, framework, or external server. If you sign in, then you can sync through Supabase, but the app is designed to work offline and through purley local storage. 

The whole thing is:

- `index.html`: the entire app, with CSS, markup, and some JS in a single file
- `sw.js`: a service worker that caches everything so it works as an installable offline PWA
- `manifest.json`: the PWA manifest
- `vendor/supabase.js`: Supabase client (only dependency)
- `fonts/`: self-hosted Fraunces and Nunito type faces
- `icons/`: crappy app icons

You can easily serve this over GH pages (like I'm doing) or over some static server.

This app was built by John Wu & Claude Opus 4.8 and Fable 5