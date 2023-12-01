import { directive } from '../directives';

directive('html', (el, expression, attribute, x) => {
  el.innerHTML = expression;
});
