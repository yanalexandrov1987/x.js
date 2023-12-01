import { directive } from '../directives';

directive('show', (el, expression, modifiers, x) => {
  el.style.display = expression ? 'block' : 'none'
});
