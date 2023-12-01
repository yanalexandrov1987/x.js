import { directive } from '../directives';
import { updateAttribute } from '../utils';

directive('bind', (el, expression, attribute, x) => {
  updateAttribute(el, attribute.attribute.replace(':', ''), expression);
});
