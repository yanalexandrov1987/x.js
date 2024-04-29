import { directive } from '../directives';

directive('cloak', (el, expression, attribute, x, component) => {
  el.style.display = 'none';
  el.removeAttribute('x-cloak');
});
