import { debounce, getAttributes, saferEval, updateAttribute, eventCreate } from './utils';
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
                    let event = (el.tagName.toLowerCase() === 'select')
                    || ['checkbox', 'radio'].includes(el.type)
                    || modifiers.includes('lazy')
                      ? 'change' : 'input'

                    const listenerExpression = generateExpressionForProp(el, data, prop, modifiers)

                    self.registerListener(el, event, modifiers, listenerExpression)

                    let { output } = self.evaluate(prop, additionalHelperVariables)
                    updateAttribute(el, 'value', output)
                }

                // init directives
                if (directive) {
                    if (!Object.keys(x.directives).includes(directive)) {
                        return;
                    }

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
        const walkThenClearDependencyTracker = (rootEl, callback) => {
            domWalk(rootEl, callback)

            self.concernedData = []
        }

        debounce(walkThenClearDependencyTracker, 0)(self.el, el => {
            getAttributes(el).forEach(attribute => {
                let {directive, expression, prop} = attribute;

                if (prop) {
                    let { output, deps } = self.evaluate(prop)
                    if (self.concernedData.filter(i => deps.includes(i)).length > 0) {
                        updateAttribute(el, 'value', output);

                        document.dispatchEvent(eventCreate('x:refresh', {attribute, output}));
                    }
                }

                if (directive) {
                    if (!Object.keys(x.directives).includes(directive)) {
                        return;
                    }

                    try {
                        let { output, deps } = self.evaluate(expression)
                        if (self.concernedData.filter(i => deps.includes(i)).length > 0) {
                            x.directives[directive](el, output, attribute, x);
                        }
                    } catch (e) {
                        // TODO: bring out the logic to directives/x-for.js
                        if (/^(\w+)\s+in\s+(\w+)$/.test(expression)) {
                            const [, items] = expression.split(' in ');
                            if (self.concernedData.filter(i => [items].includes(i)).length > 0) {
                                x.directives[directive](el, expression, attribute, x, self);
                            }
                        }
                    }
                }
            })
        })
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

        function eventHandler(e) {
            // delay an event for a certain time
            let wait = 0;
            if (modifiers.includes('delay')) {
                const delayIndex   = modifiers.indexOf('delay');
                const numericValue = (modifiers[delayIndex + 1] || '').split('ms')[0];
                wait = !isNaN(numericValue) ? Number(numericValue) : 250;
            }

            debounce(() => {
                if (modifiers.includes('prevent')) {
                    e.preventDefault();
                }

                if (modifiers.includes('stop')) {
                    e.stopPropagation()
                }

                self.runListenerHandler(expression, e)

                // one time run event
                if (modifiers.includes('once')) {
                    el.removeEventListener(event, eventHandler)

                    if (e instanceof IntersectionObserverEntry) {
                        removeIntersectionObserver(e.target)
                    }
                }
            }, wait)()
        }

        if (modifiers.includes('outside')) {
            // Listen for this event at the root level.
            document.addEventListener(event, e => {
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
                eventHandler(
                    new CustomEvent('load', {
                        detail: {},
                        bubbles: true,
                        cancelable: true
                    })
                );
            } else if (event === 'intersect') {
                const observer = new IntersectionObserver(entries => entries.forEach(entry => entry.isIntersecting && eventHandler(entry)))

                observer.observe(el);
                observers.push({el, observer});
            } else {
                el.addEventListener(event, eventHandler)
            }
        }
    }

    runListenerHandler(expression, e) {
        const methods = {};
        Object.keys(x.methods).forEach(key => methods[key] = x.methods[key](e, e.target));

        saferEval(expression, this.data, {
            ...{
                '$el': e.target,
                '$event': e,
                '$refs': this.getRefsProxy(),
            },
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
