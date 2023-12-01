import { directive } from '../directives';

directive('show', (el, expression, attribute, x) => {
  el.style.display = expression ? 'block' : 'none'
});
