import { directive } from '../directives';
import { saferEval } from '../utils';

directive('for', (el, expression, attribute, x, component) => {
  if (typeof expression !== 'string') {
    return;
  }

  const [item, items] = expression.split(' in ');

  const dataItems = saferEval(`${items}`, component.data);

  let sibling = el.nextSibling;
  while (sibling) {
    const nextSibling = sibling.nextSibling;
    sibling.parentNode.removeChild(sibling);
    sibling = nextSibling;
  }

  dataItems.forEach(dataItem => {
    const clone = el.cloneNode(true);

    clone.removeAttribute('x-for');

    (async function() {
      await component.initialize(clone, component.data, {[item]: dataItem});

      clone.__x_data = dataItem;
      el.parentNode.appendChild(clone);
    })();
  });
});
