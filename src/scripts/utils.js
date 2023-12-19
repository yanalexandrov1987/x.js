import { setClasses, setStyles } from './classes';

export function debounce(func, wait, immediate) {
  let timeout;
  return function () {
    let context = this, args = arguments;
    let later = function () {
        timeout = null;
        if (!immediate) func.apply(context, args);
    };
    let callNow = immediate && !timeout;
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
      if (callNow) func.apply(context, args);
  }
}

export function saferEval(expression, dataContext, additionalHelperVariables = {}, noReturn = false) {
  expression = noReturn ? `with($data){${expression}}` : `var result;with($data){result=${expression}};return result`;
  return (new Function(['$data', ...Object.keys(additionalHelperVariables)], expression))(
    dataContext, ...Object.values(additionalHelperVariables)
  )
}

export function getAttributes(el) {
  const regexp = /^(x-|x.|@|:)/;
  return [...el.attributes].filter(({ name }) => regexp.test(name)).map(({ name, value }) => {
    const startsWith = name.match(regexp)[0];
    const root       = name.replace(startsWith, '');
    const parts      = root.split('.');
    return {
      name,
      directive: startsWith === 'x-' ? name : (startsWith === ':' ? 'x-bind' : ''),
      event: startsWith === '@' ? parts[0] : '',
      expression: value,
      prop: startsWith === 'x.' ? parts[0] : '',
      modifiers: startsWith === 'x.' ? parts.slice(1) : root.split('.').slice(1)
    }
  });
}

export function updateAttribute(el, name, value) {
  if (name === 'value') {
    if (el.type === 'radio') {
      el.checked = el.value === value
    } else if (el.type === 'checkbox') {
      el.checked = Array.isArray(value) ? value.some(val => val === el.value) : !!value
    } else if (el.tagName === 'SELECT') {
      updateSelect(el, value)
    } else {
      el.value = value
    }
  } else if (name === 'class') {
    bindClasses(el, value)
  } else if (name === 'style') {
    bindStyles(el, value)
  } else if (['disabled', 'readonly', 'required', 'checked', 'autofocus', 'autoplay', 'hidden'].includes(name)) {
    !!value ? el.setAttribute(name, '') : el.removeAttribute(name);
  } else {
    el.setAttribute(name, value)
  }
}

function bindClasses(el, value) {
  if (el._x_undoAddedClasses) {
    el._x_undoAddedClasses()
  }
  el._x_undoAddedClasses = setClasses(el, value)
}

function bindStyles(el, value) {
  if (el._x_undoAddedStyles) {
    el._x_undoAddedStyles()
  }
  el._x_undoAddedStyles = setStyles(el, value)
}

export function updateSelect(el, value) {
  const arrayWrappedValue = [].concat(value).map(value => value + '')

  Array.from(el.options).forEach(option => {
    option.selected = arrayWrappedValue.includes(option.value || option.text)
  })
}

export function eventCreate(eventName, detail = {}) {
  return new CustomEvent(eventName, {
    detail,
    bubbles: true,
    cancelable: true
  })
}

export function getNextModifier(modifiers, modifier, defaultValue = '') {
  return modifiers[modifiers.indexOf(modifier) + 1] || defaultValue;
}

export function isInputField(el) {
  return ['input', 'select', 'textarea'].includes(el.tagName.toLowerCase());
}

export function castToType(a, value) {
  const type = typeof a;
  switch (type) {
    case 'string':
      return String(value);
    case 'number':
      return Number.isInteger(a) ? parseInt(value, 10) : parseFloat(value);
    case 'boolean':
      return Boolean(value);
    case 'object':
      if (a instanceof Date) {
        return new Date(value);
      } else if (Array.isArray(a)) {
        return Array.from(value);
      } else {
        return Object(value);
      }
    case 'undefined':
      if (a === null) {
        return null;
      }
      return value === 'true' ? true : ( value === 'false' ? false : value );
    default:
      return value;
  }
}
