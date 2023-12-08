import { x } from '../scripts/index';

const prefix = '$';

export function method(name, callback) {
  name = `${prefix}${name}`;
  if (!x.methods[name]) {
    x.methods[name] = callback;
  } else {
    console.warn(`X.js: method '${name}' is already exists.`);
  }
}
