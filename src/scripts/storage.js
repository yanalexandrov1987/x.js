import { getNextModifier } from './utils';

const storage = {
  get: (name, type) => {
    if (!name) return;

    if (type === 'cookie') {
      let matches = document.cookie.match(new RegExp(
        "(?:^|; )" + name.replace(/([.$?*|{}()\[\]\\\/+^])/g, '\\$1') + "=([^;]*)"
      ));

      if (matches) {
        let res = decodeURIComponent(matches[1]);
        try {
          return JSON.parse(res);
        } catch(e) {
          return res;
        }
      }
    }

    if (type === 'local') {
      return localStorage.getItem(name);
    }
  },
  set: (name, value, type, options = {path: '/'}) => {
    if (!name) return;

    if (value instanceof Object) {
      value = JSON.stringify(value);
    }

    /*
    Sets a cookie with specified name (str), value (str) & options (dict)

    options keys:
      - path (str) - URL, for which this cookie is available (must be absolute!)
      - domain (str) - domain, for which this cookie is available
      - expires (Date object) - expiration date&time of cookie
      - max-age (int) - cookie lifetime in seconds (alternative for expires option)
      - secure (bool) - if true, cookie will be available only for HTTPS.
                        IT CAN'T BE FALSE
      - samesite (str) - XSRF protection setting.
                         Can be strict or lax
                         Read https://web.dev/samesite-cookies-explained/ for details
      - httpOnly (bool) - if true, cookie won't be available for using in JavaScript
                          IT CAN'T BE FALSE
    */
    if (type === 'cookie') {
      options = options || {};

      if (options.expires instanceof Date) {
        options.expires = options.expires.toUTCString();
      }

      let updatedCookie = encodeURIComponent(name) + "=" + encodeURIComponent(value);
      for (let optionKey in options) {
        updatedCookie += "; " + optionKey;
        let optionValue = options[optionKey];
        if (optionValue !== true) {
          updatedCookie += "=" + optionValue;
        }
      }
      document.cookie = updatedCookie;
    }

    if (type === 'local') {
      if (value) {
        localStorage.setItem(name, value);
      } else {
        localStorage.removeItem(name);
      }
    }
  }
}

function computeExpires(str) {
  let lastCh = str.charAt(str.length - 1),
      value  = parseInt(str, 10),
      date   = new Date();

  const methods = {
    y: 'FullYear',
    m: 'Month',
    d: 'Date',
    h: 'Hours',
    i: 'Minutes',
    s: 'Seconds',
  };

  if (methods.hasOwnProperty(lastCh)) {
    const method = methods[lastCh];
    date[`set${method}`](date[`get${method}`]() + value);
  } else {
    date = new Date(str);
  }

  return date;
}

function isStorageModifier(modifiers) {
  return ['cookie', 'local'].some(modifier => modifiers.includes(modifier))
}

document.addEventListener('x:refreshed', ({detail}) => {
  const { modifiers, prop } = detail.attribute;
  if (isStorageModifier(modifiers)) {
    const type   = modifiers.includes('cookie') ? 'cookie' : 'local';
    const expire = getNextModifier(modifiers, type);
    if (detail.output) {
      storage.set(prop, detail.output, type,{
        expires: computeExpires(expire),
        secure: true,
      });
    } else {
      storage.set(prop, null, type, {expires: new Date(), path: '/' })
    }
  }
});

document.addEventListener('x:prop', ({detail}) => {
  const { el, data, attribute: { modifiers, prop } } = detail;

  let tag = el.tagName.toLowerCase();
  if (isStorageModifier(modifiers) && ['input', 'select', 'textarea'].includes(tag)) {
    const type  = modifiers.includes('cookie') ? 'cookie' : 'local';
    const value = storage.get(prop, type);

    // TODO: check by value type
    if (typeof value !== 'undefined') {
      data[prop] = value;
    }
  }
});
