export function extend(...args) {
  args.forEach(arg => {
    if (typeof arg === 'function') {
      arg();
    }
  });
}
