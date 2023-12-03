import { directive } from '../directives';
import { getAttributes, saferEval, updateAttribute } from "../utils";
import { domWalk } from "../dom";
import { generateExpressionForProp } from "../props";

directive('for', (el, expression, attribute, x, component) => {
  if (typeof expression !== 'string') {
    return;
  }

  const [item, items] = expression.split(' in ');

  const dataItems = saferEval(`${items}`, component.data);
  dataItems.forEach((dataItem, index) => {
    const clone = el.cloneNode(true);

    clone.removeAttribute('x-for');

    (async function() {
      await domWalk(clone, el => {
        getAttributes(el).forEach(attribute => {
          let {directive, event, expression, modifiers, prop} = attribute;

          // init directives
          if (directive) {
            if (!Object.keys(x.directives).includes(directive)) {
              return;
            }

            let { output } = component.evaluate(expression, {[item]: dataItem});

            x.directives[directive](el, output, attribute, x);
          }
        })
      })
      console.log(clone)

      el.parentNode.appendChild(clone);
    })();
  });
});
