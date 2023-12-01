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
    return {
      name,
      attribute: name,
      event: startsWith === '@' ? name.replace('@', '').split('.')[0] : '',
      directive: startsWith === 'x-' ? name : (startsWith === ':' ? 'x-bind' : ''),
      startsWith: startsWith,
      modifiers: name.replace('x.', '').split('.').slice(1),
      expression: value,
      prop: startsWith === 'x.' ? name.replace('x.', '') : ''
    }
  });
}

export function updateAttribute(el, name, value) {
  if (name === 'value') {
    if (el.type === 'radio') {
      el.checked = el.value === value
    } else if (el.type === 'checkbox') {
      if (Array.isArray(value)) {
        // I'm purposely not using Array.includes here because it's
        // strict, and because of Numeric/String mis-casting, I
        // want the "includes" to be "fuzzy".
        let valueFound = false
        value.forEach(val => {
          if (val === el.value) {
            valueFound = true
          }
        })
        el.checked = valueFound
      } else {
        el.checked = !! value
      }
    } else if (el.tagName === 'SELECT') {
      updateSelect(el, value)
    } else {
      el.value = value
    }
  } else if (name === 'class') {
    if (Array.isArray(value)) {
      el.setAttribute('class', value.join(' '))
    } else {
      // Use the class object syntax that vue uses to toggle them.
      Object.keys(value).forEach(className => value[className] ? el.classList.add(className) : el.classList.remove(className))
    }
  } else if (['disabled', 'readonly', 'required', 'checked'].includes(name)) {
    // Boolean attributes have to be explicitly added and removed, not just set.
    if (!! value) {
      el.setAttribute(name, '')
    } else {
      el.removeAttribute(name)
    }
  } else {
    el.setAttribute(name, value)
  }
}

export function updateSelect(el, value) {
  const arrayWrappedValue = [].concat(value).map(value => { return value + '' })

  Array.from(el.options).forEach(option => {
    option.selected = arrayWrappedValue.includes(option.value || option.text)
  })
}
