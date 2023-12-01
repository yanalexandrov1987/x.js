import { directive } from '../directives';

directive('html', (el, expression, modifiers, x) => {
  el.innerHTML = expression;
});
