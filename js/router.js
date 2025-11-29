const routes = [];

function parseHash(hash) {
  const cleaned = hash.startsWith('#') ? hash.slice(1) : hash;
  return cleaned || '/';
}

export function registerRoute(pattern, handler) {
  routes.push({ pattern, handler });
}

export function navigateTo(hash) {
  if (window.location.hash === hash) {
    window.dispatchEvent(new HashChangeEvent('hashchange'));
  } else {
    window.location.hash = hash;
  }
}

export function matchRoute(path) {
  for (const { pattern, handler } of routes) {
    const params = {};
    const patternParts = pattern.split('/').filter(Boolean);
    const pathParts = path.split('/').filter(Boolean);
    if (patternParts.length !== pathParts.length) continue;

    let matched = true;
    patternParts.forEach((part, idx) => {
      if (part.startsWith(':')) {
        params[part.slice(1)] = decodeURIComponent(pathParts[idx]);
      } else if (part !== pathParts[idx]) {
        matched = false;
      }
    });

    if (matched) return { handler, params };
  }
  return null;
}

export function startRouter() {
  async function handleHashChange() {
    const path = parseHash(window.location.hash || '#/');
    const match = matchRoute(path);
    if (match) {
      await match.handler(match.params || {});
<<<<<<< HEAD
    } else {
      const root = document.getElementById('app-root');
      if (root) {
        root.innerHTML =
          '<div class="min-h-screen flex items-center justify-center bg-slate-950 text-slate-100 px-4"><div class="max-w-md text-center space-y-3">' +
          '<h1 class="text-2xl font-semibold text-white">Page not found</h1>' +
          '<p class="text-slate-400 text-sm">The requested page could not be located.</p>' +
          '<a href="#/marketplaces" class="text-sky-400 hover:underline text-sm">Back to home</a>' +
          '</div></div>';
      }
=======
>>>>>>> origin/main
    }
  }

  window.addEventListener('hashchange', handleHashChange);
  handleHashChange();
}
