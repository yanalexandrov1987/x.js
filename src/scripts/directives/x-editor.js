import { directive } from '../directives';
import { splitObject, isPrintableKey } from '../editor/utils';
import { initToolbar } from '../editor/toolbar';
import { initTooltips } from '../editor/tooltips';
import { convertJsonToHtml } from '../editor/json';

let editor, selections, content, tools, formats;

const paragraph = {'tag': 'p'};

directive('editor', (el, expression, attribute, x, component) => {
  if (!el.hasAttribute('contenteditable')) {
    el.setAttribute('contenteditable', 'true');
  }

  editor  = el;
  content = component.data.content;

  setIds(content);

  tools = initToolbar(editor);
  initTooltips(editor);

  Object.entries(tools).forEach(([tool, list]) => {
    if (tool === 'format') {
      formats = list;
    }
  });

  el.innerHTML = convertJsonToHtml(content).innerHTML;

  // disable native events in "contenteditable" element
  ['click', 'focus', 'paste'].forEach(event => {
    el.addEventListener(event, e => e.preventDefault())
  });

  ['click', 'focus', 'keydown', 'blur'].forEach(event => {
    el.addEventListener(event, setSelection);
  });

  el.addEventListener('focus',   handleFocus.bind(null, component));
  el.addEventListener('blur',    handleBlur.bind(null, component));
  el.addEventListener('keydown', handleKeyDown.bind(null, component));

  // generate html
  document.addEventListener('x:refreshed', ({detail: { attribute: { prop } }}) => {
    refreshHtml(component.data[prop])
  });
});

function refreshHtml(data) {
  //editor.innerHTML = convertJsonToHtml(data).innerHTML;

  let range = document.createRange();
  let {caretElementIndex, caretPositionStart, caretPositionEnd, selection} = selections;
  let textNode = editor.querySelector(`[data-id="${caretElementIndex}"]`)?.firstChild;
  if (textNode) {
    range.setStart(textNode, caretPositionStart);
    range.setEnd(textNode, caretPositionEnd);
    selection.removeAllRanges();
    selection.addRange(range);
  }
}

function setSelection() {
  selections = {};

  function findParentByDataId(startContainer) {
    let parent = startContainer.parentNode;

    if (!parent) {
      return null;
    }

    if (parent.getAttribute('data-id')) {
      return parent;
    }

    return findParentByDataId(parent);
  }

  const selection = window.getSelection ? window.getSelection() : null;
  if (selection && selection.rangeCount > 0) {
    const range     = selection.getRangeAt(0),
          container = range.commonAncestorContainer,
          block     = findParentByDataId(range.startContainer);

    if (editor.contains(container)) {
      selections = {
        range,
        selection,
        type: selection.type || '',
        focusText: container.textContent,
        caretElement: block,
        caretElementIndex: block.getAttribute('data-id'),
        caretPositionStart: range.startOffset,
        caretPositionEnd: range.endOffset,
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

  const hotKey   = `${e.ctrlKey ? 'Ctrl + ' : ''}${e.shiftKey ? 'Shift + ' : ''}${e.code.toUpperCase().replace('KEY', '')}`;
  const isHotKey = Object.values(tools.format).find(obj => obj.hotkey === hotKey);
  if (isHotKey) {
    return;
  }

  if (keyCode === 13) {
    return;
  }

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

  function insertTextAtIndex(e, str, index) {
    let {key, keyCode} = e;
    if (index > str.length) {
      return str + key;
    } else if (index < 0) {
      return key + str;
    } else {
      if (keyCode === 46) {
        return str.slice(0, index) + str.slice(index + 1);
      }
      if (keyCode === 8) {
        return str.slice(0, index - 1) + str.slice(index);
      }
      if (keyCode === 13) {
        return str;
      }
      return str.slice(0, index) + key + str.slice(index);
    }
  }

  let content = data.content;
  // enter button
  if (isPrintableKey(keyCode)) {
    console.log(content)
    console.log(selections)
    let focusElement = getItemById(content, selections.caretElementIndex);
    let newText      = insertTextAtIndex(e, focusElement.text, selections.caretPositionEnd);
    if (keyCode === 13) {
      // enter
      splitObject(content, selections.caretElementIndex, selections.caretPositionStart)
      //content = data.content.concat(paragraph);
    } else if (keyCode === 46) {
      // delete
    } else if (keyCode === 8) {
      // backspace
      selections.caretPositionStart = selections.caretPositionEnd = selections.caretPositionStart - 1;
    } else {
      selections.caretPositionStart = selections.caretPositionEnd = selections.caretPositionStart + 1;
    }
    data.content = updateTextById(content, selections.caretElementIndex, newText);
  } else {
    // to left & to right buttons
    if (keyCode === 37) {
      selections.caretPositionStart = selections.caretPositionEnd = selections.caretPositionStart - 1;

      refreshHtml(content);
    }
    if (keyCode === 39) {
      selections.caretPositionStart = selections.caretPositionEnd = selections.caretPositionStart + 1;

      refreshHtml(content);
    }
  }
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
