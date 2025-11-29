export function createSearchInput(placeholder, onInput) {
  const wrapper = document.createElement('div');
  wrapper.className = 'w-full';
  const input = document.createElement('input');
  input.type = 'search';
  input.placeholder = placeholder;
  input.className = 'w-full rounded-xl bg-slate-900/60 border border-slate-800 px-3 py-2 text-sm text-white placeholder:text-slate-500';
  input.addEventListener('input', e => onInput(e.target.value));
  wrapper.appendChild(input);
  return wrapper;
}
