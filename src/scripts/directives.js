import { x } from '../scripts/index';

const prefix = 'x-';

export function directive(name, callback) {
  name = `${prefix}${name}`;
  if (!x.directives[name]) {
    x.directives[name] = callback;
  } else {
    console.warn(`X.js: directive '${name}' is already exists.`);
  }
}
