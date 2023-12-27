import { method } from '../methods';

/**
 * Copy data to clipboard.
 *
 * @since 1.0
 */
method('copy', (e, el) => subject => {
  window.navigator.clipboard.writeText(subject).then(
    () => {
      let classes = 'ph-copy ph-check'.split(' ');

      classes.forEach(s => el.classList.toggle(s));
      setTimeout( () => classes.forEach(s => el.classList.toggle(s)), 1000 )
    },
    () => {
      console.log( 'Your browser is not support clipboard!' );
    }
  );
});

/**
 * Countdown magic
 *
 * @since 1.0
 */
let seconds = 0, isCountingDown = false;
method('countdown', () => {
  return {
    start: (initialSeconds, processCallback, endCallback) => {
      if (isCountingDown) {
        return;
      }
      seconds = initialSeconds;
      isCountingDown = true;
      function countdown() {
        processCallback && processCallback(true);
        if (seconds === 0) {
          endCallback && endCallback(true);
          isCountingDown = false;
        } else {
          seconds--;
          setTimeout(countdown, 1000);
        }
      }
      countdown();
    },
    second: seconds,
  }
});

/**
 * Selfie
 *
 * @since 1.0
 */
let stream = null;
method('stream', () => {
  return {
    check(refs) {
      let canvas = refs.canvas,
          video  = refs.video,
          image  = refs.image;

      if (!canvas) {
        console.error('Canvas element is undefined');
        return false;
      }

      if (!video) {
        console.error('Video for selfie preview is undefined');
        return false;
      }

      if (!image) {
        console.error('Image for output selfie is undefined');
        return false;
      }
    },
    isVisible(element) {
      const styles = window.getComputedStyle(element);
      if (styles) {
        return !(styles.visibility === 'hidden' || styles.display === 'none' || parseFloat(styles.opacity) === 0);
      }
      return false;
    },
    start(refs) {
      let video = refs.video;
      const observer = new MutationObserver( mutations => {
        for (let mutation of mutations) {
          if (mutation.target === document.body && !stream ) {
            setTimeout(async () => {
              if (this.isVisible(video)) {
                if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
                  video.srcObject = stream = await navigator.mediaDevices.getUserMedia({video: true});
                } else {
                  console.error('The browser does not support the getUserMedia API');
                }
              }
            }, 500);
          }
        }
      });
      observer.observe(document, {childList: true,subtree: true,attributes: true});
    },
    snapshot(refs) {
      this.check(refs);
      this.start(refs);

      let canvas = refs.canvas,
          video  = refs.video,
          image  = refs.image;

      let width  = video.offsetWidth,
          height = video.offsetHeight;

      let imageStyles = window.getComputedStyle(image),
          imageWidth  = parseInt(imageStyles.width, 10),
          imageHeight = parseInt(imageStyles.height, 10);

      canvas.width  = imageWidth;
      canvas.height = imageHeight;

      let offsetTop  = ( height - imageHeight ) / 2,
        offsetLeft = ( width - imageWidth ) / 2;

      let ctx = canvas.getContext('2d');

      ctx.imageSmoothingQuality = 'low';

      let scale = height / imageHeight;
      console.log((offsetTop + offsetLeft) / 2)
      //ctx.drawImage(video, 0, 0, width * 2, height * 2, 0, 0, width, height);
      //ctx.drawImage(video, 0, 0, imageWidth, imageHeight);
      ctx.drawImage(video, offsetLeft * 1.5, offsetTop * 1.5, height * 1.5, height * 1.5, 0, 0, imageWidth, imageHeight);

      let imageData = canvas.toDataURL('image/png');
      if ( imageData ) {
        image.src = imageData;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
      return imageData;
    },
    stop() {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      stream = null;
    }
  }
});

/**
 * Password
 *
 * @since 1.0
 */
method('password', () => {
  return {
    min: {
      lowercase: 2,
      uppercase: 2,
      special: 2,
      digit: 2,
      length: 12
    },
    valid: {
      lowercase: false,
      uppercase: false,
      special: false,
      digit: false,
      length: false
    },
    charsets: {
      lowercase: 'abcdefghijklmnopqrstuvwxyz',
      uppercase: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
      special: '!@#$%^&*(){|}~',
      digit: '0123456789'
    },
    switch(value) {
      return !(!!value);
    },
    check(value) {
      let matchCount = 0;
      let totalCount = 0;

      for (const charset in this.charsets) {
        let requiredCount = this.min[charset],
          charsetRegex  = new RegExp(`[${this.charsets[charset]}]`, 'g'),
          charsetCount  = (value.match(charsetRegex) || []).length;

        matchCount += Math.min(charsetCount, requiredCount);
        totalCount += requiredCount;

        this.valid[charset] = charsetCount >= requiredCount;
      }

      if (value.length >= this.min.length) {
        matchCount += 1;
        totalCount += 1;
        this.valid.length = value.length >= this.min.length;
      }

      return Object.assign(
        {
          progress: totalCount === 0 ? totalCount : (matchCount / totalCount) * 100,
        },
        this.valid
      )
    },
    generate() {
      let password = '',
          types    = Object.keys(this.charsets);

      types.forEach(type => {
        let count   = Math.max(this.min[type], 0),
            charset = this.charsets[type];

        for (let i = 0; i < count; i++) {
          let randomIndex = Math.floor(Math.random() * charset.length);
          password += charset[randomIndex];
        }
      });

      while (password.length < this.min.length) {
        let randomIndex = Math.floor(Math.random() * types.length),
            charType    = types[randomIndex],
            charset     = this.charsets[charType],
          randomCharIndex = Math.floor(Math.random() * charset.length);
        password += charset[randomCharIndex];
      }
      this.check(password);

      return this.shuffle(password);
    },
    shuffle(password) {
      let array = password.split('');
      let currentIndex = array.length;
      let temporaryValue, randomIndex;

      while (currentIndex !== 0) {
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex -= 1;

        temporaryValue = array[currentIndex];
        array[currentIndex] = array[randomIndex];
        array[randomIndex] = temporaryValue;
      }

      return array.join('');
    },
  }
});

/**
 * An accessible dialog window: modal, alert, dialog, popup
 *
 * @since 1.0
 */
method('modal', (e, el) => {
  return {
    open: (id, animation) => {
      setTimeout( () => {
        let modal = document.getElementById(id);
        if( modal ) {
          modal.classList.add( 'is-active', animation || 'fade' );
        }
        document.body.style.overflow = 'hidden';
      }, 25 );
    },
    close: animation => {
      let modal = el.closest( '.modal' );
      if( modal !== null && modal.classList.contains( 'is-active' ) ) {
        modal.classList.remove( 'is-active', animation || 'fade' );
        document.body.style.overflow = '';
      }
    }
  }
});

method('default', (e, el) => (url, options = {}, callback) => {

});
