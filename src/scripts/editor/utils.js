export function isIOS() {
  return ['iPhone', 'iPad', 'iPod'].indexOf(window.navigator.platform) !== -1;
}

/**
 * Returns true if passed key code is printable (a-Z, 0-9, etc) character.
 *
 * @param {number} keyCode - key code
 * @returns {boolean}
 */
export function isPrintableKey(keyCode) {
  return keyCode === 8 ||                   // backspace key
    keyCode === 46  ||                      // delete
    keyCode === 32  || keyCode === 13 ||    // Space bar & return key(s)
    keyCode === 229 ||                      // processing key input for certain languages — Chinese, Japanese, etc.
    (keyCode > 47  && keyCode < 58)  ||     // number keys
    (keyCode > 64  && keyCode < 91)  ||     // letter keys
    (keyCode > 95  && keyCode < 112) ||     // Numpad keys
    (keyCode > 185 && keyCode < 193) ||     // ;=,-./` (in order)
    (keyCode > 218 && keyCode < 223);       // [\]' (in order)
}

/**
 * Split object with 'Enter' key
 *
 * @param data
 * @param caretElementId
 * @param caretElementIndex
 * @returns {*[]}
 */
export function splitObject(data, caretElementId, caretElementIndex) {

  function prepareDuplicateElement(data, caretElementId, caretElementIndex) {
    if (data.id === caretElementId) {
      return { ...data };
    }

    const updatedData = { ...data };

    if (updatedData.hasOwnProperty('text') && updatedData.text === '' && (!updatedData.child || updatedData.child.length === 0)) {
      // Удаляем элемент, если text === '' и child пустой массив или неопределен
      return null;
    }

    if (updatedData.hasOwnProperty('text')) {
      updatedData.text = '';
    }

    if (updatedData.hasOwnProperty('child')) {
      let foundElement = false;

      updatedData.child = updatedData.child.map((child) => {
        if (foundElement) return child;

        const updatedChild = prepareDuplicateElement(child, caretElementId);

        if (updatedChild !== null && updatedChild.id === caretElementId) {
          foundElement = true;
        }

        return updatedChild;
      });

      // Удаляем пустые элементы из массива child
      updatedData.child = updatedData.child.filter((child) => child !== null);
    }

    return updatedData;
  }

  function prepareOriginalElement(data, caretElementId) {
    if (data.id === caretElementId) {
      // Если текущий элемент является элементом, после которого нужно удалить остальные элементы, возвращаем его без дочерних элементов
      return { ...data, child: [] };
    }

    if (data.child && data.child.length > 0) {
      // Если у текущего элемента есть дочерние элементы, рекурсивно обрабатываем каждый из них
      const updatedChild = data.child.map(child => prepareOriginalElement(child, caretElementId));

      // Удаляем все элементы после указанного caretElementId
      const caretIndex = updatedChild.findIndex(child => child.id === caretElementId);
      if (caretIndex >= 0) {
        updatedChild.splice(caretIndex + 1);
      }

      // Возвращаем обновленный текущий элемент с обновленными дочерними элементами
      return { ...data, child: updatedChild };
    }

    // Если у текущего элемента нет дочерних элементов, возвращаем его без изменений
    return data;
  }

  function findParentElement(data, caretElementId) {
    for (const item of data) {
      if (item.id === caretElementId) {
        return item;
      }
      if (item.child) {
        const parent = findParentElement(item.child, caretElementId);
        if (parent) {
          return item;
        }
      }
    }
    return null;
  }

  let original = findParentElement(data, caretElementId);
  if (original) {
    const newData      = data.slice(),
          originalIdx  = newData.indexOf(original),
          duplicateIdx = originalIdx + 1;

    const originalData  = JSON.parse(JSON.stringify(original));
    const duplicateData = JSON.parse(JSON.stringify(original));

    const duplicate = prepareDuplicateElement(duplicateData, caretElementId, caretElementIndex);
    console.log(JSON.stringify(duplicate))
    console.log(newData)
    // insert duplicate after original
    data.splice(originalIdx + 1, 0, duplicate);
  }
}
