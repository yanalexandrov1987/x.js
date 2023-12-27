import { method } from '../methods';

method('dispatch', (e, el) => (name, detail = {}) => {
  el.dispatchEvent(
    new CustomEvent(name, {
      detail,
      bubbles: true,
      // Allows events to pass the shadow DOM barrier.
      composed: true,
      cancelable: true,
    })
  )
});
