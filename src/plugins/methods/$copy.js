import { method } from '../../scripts/methods';

export default function (X) {

  /**
   * Copy any string data to clipboard.
   *
   * Usage example: @click="$copy('Some text', ['is-copied', 'is-'])"
   *
   * @since 1.0
   */
  X.extend(
    () => method('copy', (e, el) => (subject, classes) => {
      window.navigator.clipboard.writeText(subject).then(() => {
        const classes       = classes || ['ph-copy', 'ph-check'];
        const classesToggle = () => classes.forEach(s => el.classList.toggle(s));

        classesToggle();
        setTimeout(classesToggle, 1000);
      });
    })
  );
}