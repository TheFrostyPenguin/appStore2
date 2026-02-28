import { signOutAndRedirect, getCurrentAccount } from '../auth.js';

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
  root.className = 'app-root-container';

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

    const name = document.createElement('div');
    name.innerHTML = `<div class="app-subtext">Signed in</div><div>${showAccount.name}</div>`;

    const menuWrap = document.createElement('div');
    menuWrap.className = 'relative';

    const accountButton = document.createElement('button');
    accountButton.type = 'button';
    accountButton.className =
      'w-10 h-10 rounded-full flex items-center justify-center hover:bg-slate-800/60 transition border border-slate-800';
    accountButton.setAttribute('aria-label', 'Account menu');
    accountButton.innerHTML = '<span class="material-symbols-outlined">account_circle</span>';

    const menu = document.createElement('div');
    menu.className = 'hidden absolute right-0 mt-2 w-44 bg-slate-900 border border-slate-800 rounded-xl shadow-lg overflow-hidden z-50';

    const logoutItem = document.createElement('button');
    logoutItem.type = 'button';
    logoutItem.className = 'w-full text-left px-4 py-2 text-sm text-slate-100 hover:bg-slate-800';
    logoutItem.textContent = 'Log out';

    let detachOutsideClick = null;

    const closeMenu = () => {
      menu.classList.add('hidden');
      if (detachOutsideClick) {
        detachOutsideClick();
        detachOutsideClick = null;
      }
    };

    const openMenu = () => {
      menu.classList.remove('hidden');
      const onDocClick = event => {
        if (!menuWrap.contains(event.target)) {
          closeMenu();
        }
      };
      document.addEventListener('click', onDocClick, true);
      detachOutsideClick = () => document.removeEventListener('click', onDocClick, true);
    };

    accountButton.addEventListener('click', event => {
      event.stopPropagation();
      if (menu.classList.contains('hidden')) {
        openMenu();
      } else {
        closeMenu();
      }
    });

    logoutItem.addEventListener('click', async () => {
      closeMenu();
      await signOutAndRedirect();
    });

    menu.appendChild(logoutItem);
    menuWrap.appendChild(accountButton);
    menuWrap.appendChild(menu);

    accountBox.appendChild(name);
    accountBox.appendChild(menuWrap);
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
  const { account, error } = await getCurrentAccount();
  if (error) {
    console.error('Failed to resolve account for app shell', error);
  }
  const tabs = [
    {
      label: 'Marketplaces',
      href: '#/marketplaces',
      isActive: hash =>
        hash.startsWith('#/marketplaces') || hash.startsWith('#/category') || hash.startsWith('#/app')
    }
  ];

  if ((account?.role || '').toLowerCase() === 'admin') {
    tabs.push({
      label: 'Admin',
      href: '#/admin',
      isActive: hash => hash.startsWith('#/admin')
    });
    tabs.push({
      label: 'Analytics',
      href: '#/analytics',
      isActive: hash => hash.startsWith('#/analytics') || hash.startsWith('#/admin/analytics')
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
