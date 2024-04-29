import { directive } from '../directives';
import { saferEval } from '../utils';

directive('for', (el, expression, attribute, x, component) => {
  if (typeof expression !== 'string') {
    return;
  }

  // parse x-for value like "dog in dogs"
  const [, item, index = 'key', items] = expression.match(/^\(?(\w+)(?:,\s*(\w+))?\)?\s+in\s+(\w+)$/) || [];

  const dataItems = saferEval(`${items}`, component.data);

  while (el.nextSibling) {
    el.nextSibling.remove();
  }

  dataItems.forEach((dataItem, key) => {
    const clone = el.cloneNode(true);

    clone.removeAttribute('x-for');

    (async () => {
      clone.__x_for_data = {[item]: dataItem, [index]: key};

      await component.initialize(clone, component.data, clone.__x_for_data);

      el.parentNode.appendChild(clone);
    })();
  });
});
