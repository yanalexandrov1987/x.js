import { x } from '../scripts/index';

const prefix = '$';

export function method(name, callback) {
  name = `${prefix}${name}`;
  if (!x.methods[name]) {
    x.methods[name] = callback;
  } else {
    console.warn(`X.js: You are trying to add a '${name}' method that already exists.`);
  }
}
