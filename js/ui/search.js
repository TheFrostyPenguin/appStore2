export function createSearchInput(placeholder, onInput) {
  const wrapper = document.createElement('div');
  wrapper.className = 'w-full';
  const input = document.createElement('input');
  input.type = 'search';
  input.placeholder = placeholder;
  input.className = 'app-input';
  input.addEventListener('input', e => onInput(e.target.value));
  wrapper.appendChild(input);
  return wrapper;
}
