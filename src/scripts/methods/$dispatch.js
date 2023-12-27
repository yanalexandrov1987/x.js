import { method } from '../methods';
import { eventCreate } from '../utils';

method('dispatch', (e, el) => (name, detail = {}) => {
  el.dispatchEvent(eventCreate(name, detail));
});
