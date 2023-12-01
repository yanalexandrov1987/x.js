import { directive } from '../directives';

directive('text', (el, expression, modifiers, x) => {
  el.innerText = expression;
});
