import { isIOS } from './utils';

const key   = isIOS() ? '&#8984;' : 'Ctrl';
const tools = {
  format: {
    strong: {
      icon: 'M9.5 6.5C11 6 11 4 11 4c0-1.5-1-4-4-4H2v14h6c2.5 0 4-1.5 4-3.9 0-1.9-1-3.1-2.5-3.6zM4 2h3s2 0 2 2-2 2-2 2H4V2zm4 10H4V8h4s2 0 2 2-2 2-2 2z',
      title: 'Bold',
      hotkey: `${key} + B`,
    },
    em: {
      icon: 'M7.5 0L5 14h1.9L9.4 0H7.5z',
      title: 'Italic',
      hotkey: `${key} + I`,
    },
    u: {
      icon: 'M1.8 14h10v-2h-10v2zm0-14v6c0 2 1 5 5 5s5-3 5-5V0h-2v6c0 2-1 3-3 3s-3-1-3-3V0h-2z',
      title: 'Underline',
      hotkey: `${key} + U`,
    },
    strike: {
      icon: 'M4 4s-.3-2.4 2.8-2.4c2.2 0 3.2 1 3.7 1.4h.5V1c-.6-.3-1.4-1-4-1-2 0-5 .5-5 4h2zm10 3H0v1h6.8c1.5 0 3.7 1 2.7 3s-6 .5-7.5-.5v2c3 2.2 8.5 2.3 9.5-1.5.1-.5.2-2-.5-3h3V7z',
      title: 'Strikethrough',
      hotkey: `${key} + Shift + X`,
    },
    mark: {
      icon: 'M0 13.12l2.57.88.91-.97-1.83-1.73L0 13.12zm3.2-6.56a1.06 1.06 0 00-.28 1.04l.35 1.17L2 10l2.5 2.5 1.24-1.1 1.1.37a.9.9 0 00.98-.3l.78-.97-4.7-4.6-.7.66zm10.39-4.4L11.96.45a1.35 1.35 0 00-1.93-.06L4.9 5.02 9.5 9.5l4.15-5.28c.49-.6.46-1.5-.06-2.05z',
      title: 'Marker',
      hotkey: `${key} + M`,
    },
  },
  align: {
    left: {
      icon: 'M1 13H0V0H1V13ZM14 5H3V2H14V5ZM3 11H10V8H3V11Z',
      title: 'Align left',
    },
    center: {
      icon: 'M7 0H6v2H0v3h6v3H2v3h4v2h1v-2h4V8H7V5h6V2H7V0z',
      title: 'Align center',
    },
    right: {
      icon: 'M13 13H14V0H13V13ZM0 5H11V2H0V5ZM11 11H4V8H11V11Z',
      title: 'Align right',
    },
    justify: {
      icon: 'M7 0H6v2H0v3h6v3H0v3h6v2h1v-2h6V8H7V5h6V2H7V0z',
      title: 'Align justify',
    },
  },
};

export function initToolbar(editor) {
  var toolsString = '';
  for (let group in tools) {
    if (!tools[group]) continue;

    toolsString += '<div class="spytext-button-group">';

    for (let tool in tools[group]) {
      let opts = tools[group][tool];
      toolsString += `<button type="button" data-command="${group}" data-option="${tool}" data-title="${opts.title}" data-hotkey="${opts.hotkey}">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 14 14" focusable="false" fill="currentColor">
            <path d="${opts.icon}"></path>
          </svg>
        </button>`;
    }

    toolsString += '</div>';
  }
  editor.closest('[x-data]').insertAdjacentHTML('afterbegin', `<div class="spytext-toolbar" data-toolbar>${toolsString}</div>`);

  return tools;
}
