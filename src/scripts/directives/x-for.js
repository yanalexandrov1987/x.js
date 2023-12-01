import { directive } from '../directives';
import { saferEval } from '../utils';

directive('for', (el, expression, modifiers, x, component) => {
  if (typeof expression !== 'string') {
    return;
  }

  const [item, items] = expression.split(' in ');

  const data = saferEval(`${items}`, component.data);
  data.forEach(dataItem => {
    const clone = el.cloneNode(true);

    clone.removeAttribute('x-for');

    console.log(clone)
    console.log(dataItem)
    component.initialize(clone, dataItem);

    el.parentNode.appendChild(clone);
  });
});
