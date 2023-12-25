export function convertJsonToHtml(json) {
  let html = document.createElement('body');

  Object.keys(json).forEach(tag_name => {
    const { tag, id, ..._element } = json[tag_name];
    let tag_root = tag ? document.createElement(tag) : document.createTextNode(_element.text);

    if (tag) {
      id && tag_root.setAttribute('data-id', id);
      for(let attr_name in _element){
        let attr_value = _element[attr_name];
        if ( attr_name === 'text') {
          tag_root.insertAdjacentHTML('beforeend', attr_value);
        } else if (attr_name === 'child'){
          let child = convertJsonToHtml(attr_value);
          tag_root.appendChild(child);
        } else {
          tag_root.setAttribute(attr_name, attr_value);
        }
      }
    }

    html.appendChild(tag_root);
  })

  return html;
}

export function cropJson(content) {
  const startIndex = 1;
  const startPoint = 12;
  const endIndex   = 4;
  const endPoint   = 4;

  //content.splice(startIndex + 1, endIndex - startIndex - 1);

  return content;
}
