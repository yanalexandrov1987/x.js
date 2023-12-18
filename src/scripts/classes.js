export function setClasses(el, value) {
  if (Array.isArray(value)) {
    value = value.join(' ');
  } else if (typeof value === 'function') {
    value = value();
  } else if (typeof value === 'object' && value !== null) {
    // Use the class object syntax that vue uses to toggle them.
    return setClassesFromObject(el, value);
  }

  // set classes from string
  return setClassesFromString(el, value);
}

function setClassesFromString(el, classString) {
  let missingClasses = classString => classString.split(' ').filter(i => ! el.classList.contains(i)).filter(Boolean)

  let addClassesAndReturnUndo = classes => {
    el.classList.add(...classes)

    return () => el.classList.remove(...classes)
  }

  // This is to allow short-circuit expressions like: :class="show || 'hidden'" && "show && 'block'"
  classString = classString === true ? '' : (classString || '')

  return addClassesAndReturnUndo(missingClasses(classString))
}

function setClassesFromObject(el, classObject) {
  let classes = Object.entries(classObject),
      split   = classString => classString.split(' ').filter(Boolean)

  let forAdd    = classes.flatMap(([classString, bool]) => bool ? split(classString) : false).filter(Boolean)
  let forRemove = classes.flatMap(([classString, bool]) => !bool ? split(classString) : false).filter(Boolean)

  const added   = forAdd.filter(i => !el.classList.contains(i) && (el.classList.add(i), true));
  const removed = forRemove.filter(i => el.classList.contains(i) && (el.classList.remove(i), true));

  return () => {
    removed.forEach(i => el.classList.add(i))
    added.forEach(i => el.classList.remove(i))
  }
}

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
      key = key.replace(/([a-z])([A-Z])/g, "$1-$2").toLowerCase();
    }

    el.style.setProperty(key, value)
  })

  setTimeout(() => el.style.length === 0 && el.removeAttribute('style'))

  return () => setStyles(el, previousStyles);
}
