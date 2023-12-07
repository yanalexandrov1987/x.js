import { method } from '../methods';

method('fetch', (e, el) => url => {
  let formData = new FormData();

  return new Promise(resolve => {
    let method  = el.getAttribute('method')?.toUpperCase() ?? 'GET',
        request = new XMLHttpRequest();

    request.withCredentials = true;
    request.responseType    = 'json';

    request.open(method, url);
    request.send(formData);

    request.onload = () => {

    }

    request.upload.onprogress = event => {
      console.log(`Progress ${parseInt(event.loaded / event.total * 100)}%`);
    }

    request.onreadystatechange = () => {
      if (request.response) {
        console.log(request.response)
      }
    };
  });
});
