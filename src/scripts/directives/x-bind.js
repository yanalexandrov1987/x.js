import { directive } from '../directives';
import { updateAttribute } from '../utils';

directive('bind', (el, expression, {attribute}, x, component) => {
  if (attribute === ':attributes' && typeof expression === 'object') {
    Object.entries(expression).forEach(([key, value]) => updateAttribute(el, key, value));
  } else {
    updateAttribute(el, attribute.replace(':', ''), expression);
  }
});
