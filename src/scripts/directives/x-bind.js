import { directive } from '../directives';
import { updateAttribute } from '../utils';

directive('bind', (el, expression, {attribute}, x, component) => {
  if (attribute === ':attributes' && typeof expression === 'object') {
    Object.entries(expression).forEach(([key, value]) => updateAttribute(el, key, value));
  } else {
    updateAttribute(el, attribute.replace(':', ''), expression);
  }
});

export function setStyles(el, value) {
  if (typeof value === 'object' && value !== null) {
    return setStylesFromObject(el, value)
  }

  return ((el, value) => {
    let cache = el.getAttribute('style', value)

    el.setAttribute('style', value)

    return () => {
      el.setAttribute('style', cache || '')
    }
  })(el, value)
}

function setStylesFromObject(el, value) {
  let previousStyles = {}

  Object.entries(value).forEach(([key, value]) => {
    previousStyles[key] = el.style[key]

    // When we use javascript object, css properties use the camelCase
    // syntax but when we use setProperty, we need the css format
    // so we need to convert camelCase to kebab-case.
    // In case key is a CSS variable, leave it as it is.
    if (! key.startsWith('--')) {
      key = kebabCase(key);
    }

    el.style.setProperty(key, value)
  })

  setTimeout(() => {
    if (el.style.length === 0) {
      el.removeAttribute('style')
    }
  })

  return () => setStyles(el, previousStyles);
}

function kebabCase(subject) {
  return subject.replace(/([a-z])([A-Z])/g, "$1-$2").toLowerCase();
}
