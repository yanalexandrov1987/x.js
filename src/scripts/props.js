import { castToType, eventCreate, getAttributes, isInputField, saferEval } from "./utils";
import { domWalk } from './dom';

export function fetchProps(rootElement, data) {
  const checkboxes = {};
  domWalk(rootElement, el => {
    getAttributes(el).forEach(attribute => {
      let {modifiers, prop, expression} = attribute;
      if (prop) {
        let keys;

        // try fetch multiple checkboxes with same prop
        if (el.type === 'checkbox') {
          checkboxes[prop] = checkboxes[prop] || {};
          checkboxes[prop][el.value] = el.checked;
          keys = Object.keys(checkboxes[prop]);
          data[prop] = keys.length > 1 ? keys.filter(key => checkboxes[prop][key]) : '';
        }

        // just for input form fields
        if (isInputField(el)) {
          let modelExpression = generateExpressionForProp(el, data, prop, modifiers)
          if (!Array.isArray(keys) || keys.length === 1) {
            data[prop] = saferEval(modelExpression, data, {'$el': el})
          }
        }
        // TODO: what we do for none input fields, like "div" etc?

        document.dispatchEvent(eventCreate('x:fetched', {el, data, attribute}))
      }
    })
  })
  return data;
}

export function generateExpressionForProp(el, data, prop, modifiers) {
  let rightSideOfExpression, tag = el.tagName.toLowerCase();
  if (el.type === 'checkbox') {
    // If the data we are binding to is an array, toggle it's value inside the array.
    if (Array.isArray(data[prop])) {
      rightSideOfExpression = `$el.checked ? ${prop}.concat([$el.value]) : [...${prop}.splice(0, ${prop}.indexOf($el.value)), ...${prop}.splice(${prop}.indexOf($el.value)+1)]`
    } else {
      rightSideOfExpression = `$el.checked`
    }
  } else if (tag === 'select' && el.multiple) {
    rightSideOfExpression = `Array.from($el.selectedOptions).map(option => ${modifiers.includes('number')
      ? 'parseFloat(option.value || option.text)'
      : 'option.value || option.text'})`
  } else {
    rightSideOfExpression = modifiers.includes('number')
      ? 'parseFloat($el.value)'
      : (modifiers.includes('trim') ? '$el.value.trim()' : '$el.value')
  }

  // People might assume we take care of that for them, because they already set a shared "x.[prop]" attribute.
  if (!el.hasAttribute('name')) {
    el.setAttribute('name', prop)
  }

  return `${prop} = ${rightSideOfExpression}`
}
