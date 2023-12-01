import { directive } from '../directives';
import { updateAttribute } from '../utils';

directive('bind', (el, expression, attribute, x) => {
  console.log(expression)
  console.log(attribute)
  updateAttribute(el, attribute.attribute.replace(':', ''), expression);
});
