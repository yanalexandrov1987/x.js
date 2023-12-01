import { directive } from '../directives';
import { updateAttribute } from '../utils';

directive('bind', (el, expression, name, x) => {
  updateAttribute(el, name.replace(':', ''), expression);
});
