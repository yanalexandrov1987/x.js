import { directive } from '../directives';

directive('text', (el, expression, attribute, x) => {
  el.innerText = expression;
});
