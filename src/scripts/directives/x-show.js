import { directive } from '../directives';

directive('show', (el, expression, attribute, x, component) => {
  console.log(expression)

  el.style.display = expression ? 'block' : 'none'
});
