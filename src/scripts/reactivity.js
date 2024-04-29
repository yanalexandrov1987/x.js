// Central store object
const store = {
  data: {},
  effects: [],
}

/**
 * Apply the specified callback function when dependencies change.
 *
 * @param {Function} callback - The callback function to be executed.
 * @param {Array} dependencies - The dependencies that the callback function depends on.
 * @returns {Object} - An object with an `update` method to update dependencies.
 */
export function effect(callback, dependencies) {
  const effectData = {
    callback,
    dependencies: new Set(dependencies),
  }

  /**
   * Update the dependencies of the effect.
   *
   * @param {Array} newDependencies - The new dependencies to be added.
   */
  function updateDependencies(newDependencies) {
    newDependencies.forEach((dep) => effectData.dependencies.add(dep));
  }

  callback();

  store.effects.push(effectData);

  return {
    update: updateDependencies,
  }
}

/**
 * Create an object with reactive data.
 *
 * @param {Object} data - The initial data object to be made reactive.
 * @returns {Object} - The reactive data object.
 */
export function reactive(data) {
  const reactiveData = new Proxy(data, {
    set(target, key, value) {
      target[key] = value;

      for (const effectData of store.effects) {
        if (effectData.dependencies.has(key)) {
          effectData.callback();
        }
      }

      return true;
    },
  });

  store.data = reactiveData;

  return reactiveData;
}
