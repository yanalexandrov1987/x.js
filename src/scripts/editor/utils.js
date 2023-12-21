export function isIOS() {
  return ['iPhone', 'iPad', 'iPod'].indexOf(window.navigator.platform) !== -1;
}
