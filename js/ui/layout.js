import { handleLogout } from '../auth.js';
import { getCurrentAccount } from '../api.js';

function buildTabs(tabs, currentRoute) {
  const nav = document.createElement('div');
  nav.className = 'app-tabs';
  const hash = currentRoute || window.location.hash || '#/';

  tabs.forEach(tab => {
    const btn = document.createElement('button');
    btn.className = 'app-tab';
    btn.textContent = tab.label;
    const active = tab.isActive(hash);
    if (active) {
      btn.classList.add('app-tab--active');
      btn.setAttribute('aria-selected', 'true');
    } else {
      btn.setAttribute('aria-selected', 'false');
    }
    btn.addEventListener('click', () => {
      window.location.hash = tab.href;
    });
    nav.appendChild(btn);
  });

  return nav;
}

function shellBase({ title, subtitle, tabs, currentRoute, showAccount }) {
  const root = document.getElementById('app-root');
  root.innerHTML = '';

  const shell = document.createElement('div');
  shell.className = 'app-shell-card';

  const header = document.createElement('div');
  header.className = 'app-shell-header';
  const heading = document.createElement('div');
  const titleEl = document.createElement('h1');
  titleEl.className = 'app-shell-title';
  titleEl.textContent = title;
  const subEl = document.createElement('p');
  subEl.className = 'app-subtext';
  subEl.textContent = subtitle || '';
  heading.appendChild(titleEl);
  heading.appendChild(subEl);
  header.appendChild(heading);

  if (showAccount?.name) {
    const accountBox = document.createElement('div');
    accountBox.className = 'app-header-meta';
    const avatar = document.createElement('div');
    avatar.className = 'app-avatar';
    avatar.textContent = showAccount.name.slice(0, 2).toUpperCase();
    const name = document.createElement('div');
    name.innerHTML = `<div class="app-subtext">Signed in</div><div>${showAccount.name}</div>`;
    const logout = document.createElement('button');
    logout.className = 'app-btn-secondary';
    logout.textContent = 'Logout';
    logout.addEventListener('click', handleLogout);
    accountBox.appendChild(avatar);
    accountBox.appendChild(name);
    accountBox.appendChild(logout);
    header.appendChild(accountBox);
  }

  shell.appendChild(header);
  if (tabs?.length) {
    const nav = buildTabs(tabs, currentRoute);
    nav.classList.add('app-shell-nav');
    shell.appendChild(nav);
  }

  const main = document.createElement('div');
  main.className = 'app-stack';
  shell.appendChild(main);
  root.appendChild(shell);

  return main;
}

export async function renderPublicShell(viewFn, { currentRoute } = {}) {
  const tabs = [
    {
      label: 'Login',
      href: '#/login',
      isActive: hash => hash.startsWith('#/login')
    },
    {
      label: 'Sign Up',
      href: '#/signup',
      isActive: hash => hash.startsWith('#/signup')
    }
  ];

  const main = shellBase({
    title: 'Enterprise App Store',
    subtitle: 'Access your workspace apps securely',
    tabs,
    currentRoute
  });

  await viewFn(main);
}

export async function renderAppShell(viewFn, { currentRoute } = {}) {
  const { data: account } = await getCurrentAccount();
  const tabs = [
    {
      label: 'Marketplaces',
      href: '#/marketplaces',
      isActive: hash =>
        hash.startsWith('#/marketplaces') || hash.startsWith('#/category') || hash.startsWith('#/app')
    }
  ];

  if (account?.role === 'admin') {
    tabs.push({
      label: 'Admin',
      href: '#/admin',
      isActive: hash => hash.startsWith('#/admin')
    });
  }

  const main = shellBase({
    title: 'Enterprise App Store',
    subtitle: 'Browse, manage, and deploy applications',
    tabs,
    currentRoute,
    showAccount: account ? { name: account.full_name || account.email || 'User' } : null
  });

  await viewFn(main);
}

// Backwards compatibility for existing calls
export async function renderShell(viewFn, options = {}) {
  return renderAppShell(viewFn, options);
}

export async function renderAuthShell(viewFn, options = {}) {
  return renderPublicShell(viewFn, options);
}
