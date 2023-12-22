export function initTooltips(editor) {
  let interval;

  const btns = document.querySelectorAll('button[data-command]');
  btns && btns.forEach(btn => {
    btn.addEventListener('mouseenter', ({target}) => {
      interval = setTimeout(() => {
        let btn = target.getBoundingClientRect(),
            bar = target.closest('[data-toolbar]');

        editor.closest('[x-data]').insertAdjacentHTML( 'beforeend', `<div class="spytext-tooltip">
          <div class="spytext-tooltip-box">
            <div class="spytext-tooltip-title">${target.getAttribute('data-title')}</div>
            <div class="spytext-tooltip-hotkey">${target.getAttribute('data-hotkey')}</div>
          </div>
        </div>` )

        var tip = document.querySelector('.spytext-tooltip');

        tip.style.left = btn.left + ( btn.width / 2 ) + 'px';
        if ( bar.getBoundingClientRect()['top'] < 32 ) {
          tip.classList.add( 'top' );
          tip.style.bottom = '-6px';
        } else {
          tip.style.top = ( btn.height + 6 ) * -1 + 'px';
        }
        bar.appendChild( tip );

        setTimeout(() => tip.classList.add( 'active' ), 10);

      }, 750);
    });

    btn.addEventListener('mouseleave', () => {
      clearInterval( interval );
      document.querySelector('.spytext-tooltip')?.remove();
    });
  });
}
