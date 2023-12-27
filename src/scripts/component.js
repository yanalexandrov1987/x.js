import { debounce, getAttributes, saferEval, updateAttribute, eventCreate, getNextModifier } from './utils';
import { fetchProps, generateExpressionForProp } from './props';
import { domWalk } from './dom';

export default class Component {
  constructor(el) {
    this.el      = el
    this.rawData = saferEval(el.getAttribute('x-data') || '{}', {})
    this.rawData = fetchProps(el, this.rawData)
    this.data    = this.wrapDataInObservable(this.rawData)

    this.initialize(el, this.data)
  }

  evaluate(expression, additionalHelperVariables) {
    let affectedDataKeys = []

    const proxiedData = new Proxy(this.data, {
      get(object, prop) {
        affectedDataKeys.push(prop)

        return object[prop]
      }
    })

    const result = saferEval(expression, proxiedData, additionalHelperVariables)

    return {
      output: result,
      deps: affectedDataKeys
    }
  }

  wrapDataInObservable(data) {
    let self = this

    self.concernedData = []
    return new Proxy(data, {
      set(obj, property, value) {
        const setWasSuccessful = Reflect.set(obj, property, value)

        if (self.concernedData.indexOf(property) === -1) {
          self.concernedData.push(property)
        }

        self.refresh()

        return setWasSuccessful
      }
    })
  }

  initialize(rootElement, data, additionalHelperVariables) {
    const self = this;
    domWalk(rootElement, el => {
      getAttributes(el).forEach(attribute => {
        let {directive, event, expression, modifiers, prop} = attribute;

        // init events
        if (event) {
          self.registerListener(el, event, modifiers, expression);
        }

        // init props
        if (prop) {
          // If the element we are binding to is a select, a radio, or checkbox
          // we'll listen for the change event instead of the "input" event.
          let event = ['select-multiple', 'select', 'checkbox', 'radio'].includes(el.type)
          || modifiers.includes('lazy')
            ? 'change' : 'input';

          self.registerListener(
            el,
            event,
            modifiers,
            generateExpressionForProp(el, data, prop, modifiers)
          );

          let { output } = self.evaluate(prop, additionalHelperVariables)
          updateAttribute(el, 'value', output)
        }

        // init directives
        if (directive in x.directives) {
          let output = expression;
          if (directive !== 'x-for') {
            try {
              ({ output } = self.evaluate(expression, additionalHelperVariables));
            } catch (error) {}
          }
          x.directives[directive](el, output, attribute, x, self);
        }
      })
    })
  }

  refresh() {
    const self = this;
    debounce(() => {
      domWalk(self.el, el => {
        getAttributes(el).forEach(attribute => {
          let {directive, expression, prop} = attribute;

          if (prop) {
            let { output, deps } = self.evaluate(prop)
            if (self.concernedData.filter(i => deps.includes(i)).length > 0) {
              updateAttribute(el, 'value', output);

              document.dispatchEvent(
                eventCreate('x:refreshed', {attribute, output})
              );
            }
          }

          if (directive in x.directives) {
            let output = expression,
              deps   = [];
            if (directive !== 'x-for') {
              try {
                ({ output, deps } = self.evaluate(expression));
              } catch (error) {}
            } else {
              [, deps] = expression.split(' in ');
            }
            if (self.concernedData.filter(i => deps.includes(i)).length > 0) {
              x.directives[directive](el, output, attribute, x, self);
            }
          }
        })
      })

      self.concernedData = []
    }, 0)()
  }

  registerListener(el, event, modifiers, expression) {
    const self      = this;
    const observers = [];

    function removeIntersectionObserver(element) {
      const index = observers.findIndex(item => item.el === element);
      if (index >= 0) {
        const { observer } = observers[index];
        observer.unobserve(element);
        observers.splice(index, 1);
      }
    }

    let target = el;

    if (modifiers.includes('window'))   target = window;
    if (modifiers.includes('document')) target = document;
    if (modifiers.includes('outside'))  target = document;

    function eventHandler(e) {
      if (modifiers.includes('prevent')) {
        e.preventDefault();
      }

      if (modifiers.includes('stop')) {
        e.stopPropagation()
      }

      // delay an event for a certain time
      let wait = 0;
      if (modifiers.includes('delay')) {
        const numericValue = getNextModifier(modifiers, 'delay').split('ms')[0];
        wait = !isNaN(numericValue) ? Number(numericValue) : 250;
      }

      debounce(() => {
        self.runListenerHandler(expression, e)

        // one time run event
        if (modifiers.includes('once')) {
          target.removeEventListener(event, eventHandler)

          if (e instanceof IntersectionObserverEntry) {
            removeIntersectionObserver(e.target)
          }
        }
      }, wait)()
    }

    if (modifiers.includes('outside')) {
      // Listen for this event at the root level.
      target.addEventListener(event, e => {
        // Don't do anything if the click came form the element or within it.
        if (el.contains(e.target)) return

        // Don't do anything if this element isn't currently visible.
        if (el.offsetWidth < 1 && el.offsetHeight < 1) return

        // Now that we are sure the element is visible, AND the click
        // is from outside it, let's run the expression.
        this.runListenerHandler(expression, e)
      })
    } else {
      if (event === 'load') {
        eventHandler(eventCreate('load',{}));
      } else if (event === 'intersect') {
        const observer = new IntersectionObserver(entries => entries.forEach(entry => entry.isIntersecting && eventHandler(entry)))

        observer.observe(el);
        observers.push({el, observer});
      } else {
        target.addEventListener(event, eventHandler)
      }
    }
  }

  runListenerHandler(expression, e) {
    const methods = {};
    Object.keys(x.methods).forEach(key => methods[key] = x.methods[key](e, e.target));

    let data = {}, el = e.target;
    while (el && !(data = el.__x_for_data)) {
      el = el.parentElement;
    }

    saferEval(expression, this.data, {
      ...{
        '$el': e.target,
        '$event': e,
        '$refs': this.getRefsProxy(),
      },
      ...data,
      ...methods
    }, true)
  }

  getRefsProxy() {
    let self = this

    // One of the goals of this project is to not hold elements in memory, but rather re-evaluate
    // the DOM when the system needs something from it. This way, the framework is flexible and
    // friendly to outside DOM changes from libraries like Vue/Livewire.
    // For this reason, I'm using an "on-demand" proxy to fake a "$refs" object.
    return new Proxy({}, {
      get(object, property) {
        let ref

        // We can't just query the DOM because it's hard to filter out refs in nested components.
        domWalk(self.el, el => {
          if (el.hasAttribute('x-ref') && el.getAttribute('x-ref') === property) {
            ref = el
          }
        })

        return ref
      }
    })
  }
}
