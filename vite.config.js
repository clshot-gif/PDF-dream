import { defineConfig } from 'vite';

// GitHub Pages serves a project site at https://<user>.github.io/<repo>/ —
// asset URLs need this prefix or they'll 404 once deployed (works fine
// without it in local dev, which is what makes this easy to miss).
export default defineConfig({
  base: '/PDF-dream/',
});
