export function initTabs(rootEl, defaultTab) {
  const tabButtons = rootEl.querySelectorAll('[data-tab]');
  const panels = rootEl.querySelectorAll('[data-tab-panel]');

  function activate(tabName) {
    tabButtons.forEach(btn => {
      const active = btn.dataset.tab === tabName;
      btn.classList.toggle('bg-slate-800', active);
      btn.classList.toggle('text-sky-400', active);
      btn.setAttribute('aria-selected', active ? 'true' : 'false');
    });
    panels.forEach(panel => {
      const show = panel.dataset.tabPanel === tabName;
      panel.classList.toggle('hidden', !show);
      if (show) panel.setAttribute('aria-hidden', 'false');
      else panel.setAttribute('aria-hidden', 'true');
    });
  }

  tabButtons.forEach(btn => {
    btn.addEventListener('click', () => activate(btn.dataset.tab));
  });

  activate(defaultTab || tabButtons[0]?.dataset.tab);
}
