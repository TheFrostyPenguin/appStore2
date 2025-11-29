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
    }
  }

  window.addEventListener('hashchange', handleHashChange);
  handleHashChange();
}
