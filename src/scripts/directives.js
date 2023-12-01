import { x } from '../scripts/index';

const prefix = 'x-';

export function directive(name, callback) {
  name = `${prefix}${name}`;
  if (!x.directives[name]) {
    x.directives[name] = callback;
  } else {
    console.warn(`X.js: You are trying to add a '${name}' directive that already exists.`);
  }
}
