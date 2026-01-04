import { defineConfig } from 'vite';

// Для GitHub Pages: автоматично визначає base path
// Якщо репозиторій називається 'project', то base = '/project/'
// Якщо репозиторій знаходиться в корені (username.github.io), то base = '/'
// Можна встановити вручну через змінну середовища VITE_BASE_PATH
function getBasePath() {
  // Перевіряємо змінну середовища (для GitHub Actions)
  if (process.env.VITE_BASE_PATH) {
    return process.env.VITE_BASE_PATH;
  }
  
  // Перевіряємо GITHUB_REPOSITORY (для GitHub Actions)
  if (process.env.GITHUB_REPOSITORY) {
    const repoName = process.env.GITHUB_REPOSITORY.split('/')[1];
    // Якщо це username.github.io, то base = '/'
    if (repoName && repoName.endsWith('.github.io')) {
      return '/';
    }
    // Інакше base = '/repo-name/'
    return repoName ? `/${repoName}/` : '/';
  }
  
  // Для локальної розробки або ручного встановлення
  // ЗМІНІТЬ 'project' на назву вашого репозиторію
  const repositoryName = ''; // ЗМІНІТЬ НА НАЗВУ ВАШОГО РЕПОЗИТОРІЮ
  return repositoryName ? `/${repositoryName}/` : '/';
}

const base = getBasePath();

export default defineConfig({
  base: base,
  root: './',
  publicDir: 'public',
  build: {
    outDir: 'dist',
    assetsDir: 'assets'
  },
  server: {
    port: 4000,
    open: true
  },
  // Підтримка змінних середовища
  envPrefix: 'VITE_'
});

