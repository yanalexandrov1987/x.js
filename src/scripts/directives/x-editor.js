import { directive } from '../directives';

let editor, selections, content;

const paragraph = {'tag': 'p'};

directive('editor', (el, expression, attribute, x, component) => {
  if (!el.hasAttribute('contenteditable')) {
    el.setAttribute('contenteditable', 'true');
  }

  editor  = el;
  content = component.data.content;

  setIds(content);

  el.innerHTML = convertJsonToHtml(content).innerHTML;
  //console.log(cropJson(content));

  // disable native events in "contenteditable" element
  ['click', 'focus', 'keydown', 'paste'].forEach(event => {
    el.addEventListener(event, e => e.preventDefault())
  });

  ['click', 'focus', 'keydown', 'blur'].forEach(event => {
    el.addEventListener(event, setSelection);
  });

  el.addEventListener('focus',   handleFocus.bind(null, component));
  el.addEventListener('blur',    handleBlur.bind(null, component));
  el.addEventListener('keydown', handleKeyDown.bind(null, component));
  el.addEventListener('mouseup', handleMouseUp.bind(null, component));

  // generate html
  document.addEventListener('x:refreshed', ({detail: { attribute: { prop } }}) => {
    el.innerHTML = convertJsonToHtml(component.data[prop]).innerHTML;

    let range = document.createRange();
    let {caretElementIndex, caretPositionStart, caretPositionEnd, selection} = selections;
    let textNode = editor.querySelector(`[data-id="${caretElementIndex}"]`)?.firstChild;
    if (textNode) {
      range.setStart(textNode, caretPositionStart);
      range.setEnd(textNode, caretPositionEnd);
      selection.removeAllRanges();
      selection.addRange(range);
    }
  });
});

function cropJson(content) {
  const startIndex = 1;
  const startPoint = 12;
  const endIndex   = 4;
  const endPoint   = 4;

  //content.splice(startIndex + 1, endIndex - startIndex - 1);

  return content;
}

function setSelection() {
  selections = {};

  const selection = window.getSelection ? window.getSelection() : null;
  if (selection && selection.rangeCount > 0) {
    const range     = selection.getRangeAt(0),
          container = range.commonAncestorContainer;

    if (editor.contains(container)) {
      selections = {
        range,
        selection,
        type: selection.type || '',
        focusText: container.textContent,
        caretElement: range.startContainer.parentNode,
        caretElementIndex: range.startContainer.parentNode?.getAttribute('data-id'),
        caretPositionStart: range.startOffset,
        caretPositionEnd: range.endOffset,
        hasSelection: !!selection.toString(),
        selectedText: selection.toString() || ''
      }
    }
  }
}

function handleFocus({ data }, e) {
  if (e.target.innerHTML === '') {
    data.content = [paragraph];
  }
}

function handleBlur({ data }, e) {
  if (JSON.stringify(data.content) === JSON.stringify([paragraph])) {
    data.content = [];
  }
}

function handleKeyDown({ data }, e) {
  const keyCode = e.keyCode || e.which;

  function updateTextById(data, id, newText) {
    return data.map(item => {
      if (item.id === id) {
        return { ...item, text: newText };
      } else if (item.child) {
        return { ...item, child: updateTextById(item.child, id, newText) };
      }
      return item;
    });
  }

  function insertTextAtIndex(str, index, text) {
    if (index > str.length) {
      return str + text;
    } else if (index < 0) {
      return text + str;
    } else {
      return str.slice(0, index) + text + str.slice(index);
    }
  }

  let content = data.content;
  // enter button
  if (isPrintableKey(keyCode)) {
    let focusElement = getItemById(content, selections.caretElementIndex);
    let newText      = insertTextAtIndex(focusElement.text, selections.caretPositionEnd, e.key);
    if (keyCode === 13) {
      // enter
      content = data.content.concat(paragraph);
    } else if (keyCode === 46) {
      // delete
      // TODO: delete key
    } else if (keyCode === 8) {
      // backspace
      content[0].text = data.content[0].text.substring(0, data.content[0].text.length - 1);
    } else {
      selections.caretPositionStart = selections.caretPositionEnd = selections.caretPositionStart + 1;

      content = updateTextById(content, selections.caretElementIndex, newText);
    }
    data.content = content;
  }
}

function handleMouseUp({ data }, e) {
  //console.log(selection);
}

function getItemById(json, id) {
  if (json.id === id) {
    return json;
  }

  if (Array.isArray(json)) {
    for (const item of json) {
      const result = getItemById(item, id);
      if (result) {
        return result;
      }
    }
  } else if (typeof json === 'object') {
    for (const value of Object.values(json)) {
      const result = getItemById(value, id);
      if (result) {
        return result;
      }
    }
  }

  return null;
}

function setIds(json) {
  const generateIndex = (length = 6) => [...Array(length)].map(() => String.fromCharCode(~~(Math.random()*26)+97)).join('');

  if (Array.isArray(json)) {
    json.forEach(item => (item.id = generateIndex(), setIds(item)));
  } else if (typeof json === 'object' && json !== null) {
    json.id = generateIndex();
    Object.values(json).forEach(value => setIds(value));
  }
}

function convertJsonToHtml(json) {
  let html = document.createElement('body');

  Object.keys(json).forEach(tag_name => {
    const { tag, id, ..._element } = json[tag_name];
    let tag_root = document.createElement(tag);

    id && tag_root.setAttribute('data-id', id);
    for(let attr_name in _element){
      let attr_value = _element[attr_name];
      if ( attr_name === 'text') {
        tag_root.appendChild(document.createTextNode(attr_value));
      } else if (attr_name === 'child'){
        let child = convertJsonToHtml(attr_value);
        tag_root.appendChild(child);
      } else {
        tag_root.setAttribute(attr_name, attr_value);
      }
    }

    html.appendChild(tag_root);
  })

  return html;
}

/**
 * Returns true if passed key code is printable (a-Z, 0-9, etc) character.
 *
 * @param {number} keyCode - key code
 * @returns {boolean}
 */
function isPrintableKey(keyCode) {
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
