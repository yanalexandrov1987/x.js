let stores = {};

export function getStores() {
  return stores;
}

export function store(name, value) {
  if (value === undefined) {
    return stores[name]
  }

  stores[name] = value

  if (typeof value === 'object' && value !== null && value.hasOwnProperty('load') && typeof value.init === 'function') {
    stores[name].init()
  }

  initInterceptors(stores[name])
}

export function initInterceptors(data) {
  let isObject = val => typeof val === 'object' && !Array.isArray(val) && val !== null

  let recurse = (obj, basePath = '') => {
    Object.entries(Object.getOwnPropertyDescriptors(obj)).forEach(([key, { value, enumerable }]) => {
      // Skip getters.
      if (enumerable === false || value === undefined) return

      let path = basePath === '' ? key : `${basePath}.${key}`

      if (typeof value === 'object' && value !== null && value._x_interceptor) {
        obj[key] = value.initialize(data, path, key)
      } else {
        if (isObject(value) && value !== obj && ! (value instanceof Element)) {
          recurse(value, path)
        }
      }
    })
  }

  return recurse(data)
}
