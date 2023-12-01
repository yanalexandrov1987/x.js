import { saferEval, debounce, getAttributes, updateAttribute } from './utils';
import { fetchProps, generateExpressionForProp } from './props';
import { domWalk }   from './dom';

export default class Component {
    constructor(el) {
        this.el      = el
        this.rawData = saferEval(el.getAttribute('x-data') || '{}', {})
        this.data    = this.wrapDataInObservable(this.rawData)
        this.data    = fetchProps(el, this.data)

        this.initialize(el, this.data)
    }

    evaluate(expression) {
        let affectedDataKeys = []

        const proxiedData = new Proxy(this.data, {
            get(object, prop) {
                affectedDataKeys.push(prop)

                return object[prop]
            }
        })

        const result = saferEval(expression, proxiedData)

        return {
            output: result,
            deps: affectedDataKeys
        }
    }

    wrapDataInObservable(data) {
        this.concernedData = []

        let self = this
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

    initialize(rootElement, data) {
        domWalk(rootElement, el => {
            getAttributes(el).forEach(attribute => {
                let {directive, event, expression, modifiers, name, prop, startsWith} = attribute;

                // init events
                if (event) {
                    this.registerListener(el, event, modifiers, expression);
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

                    this.registerListener(el, event, modifiers, listenerExpression)

                    let { output } = this.evaluate(prop)
                    updateAttribute(el, 'value', output)
                }

                // init directives
                if (directive) {
                    if (!Object.keys(x.directives).includes(directive)) {
                        return;
                    }

                    try {
                        let { output } = this.evaluate(expression);

                        x.directives[directive](el, output, attribute, x);
                    } catch (error) {
                        x.directives[directive](el, expression, attribute, x, this);
                    }
                }
            })
        })
    }

    refresh() {
        let self = this

        const walkThenClearDependencyTracker = (rootEl, callback) => {
            domWalk(rootEl, callback)

            self.concernedData = []
        }

        debounce(walkThenClearDependencyTracker, 5)(this.el, function (el) {
            getAttributes(el).forEach(({prop, attribute, directive, modifiers, expression}) => {
                if (prop) {
                    let { output, deps } = self.evaluate(prop)
                    if (self.concernedData.filter(i => deps.includes(i)).length > 0) {
                        updateAttribute(el, 'value', output)
                    }
                }

                if (directive) {
                    if (!Object.keys(x.directives).includes(directive)) {
                        return;
                    }

                    let { output, deps } = self.evaluate(expression)
                    if (self.concernedData.filter(i => deps.includes(i)).length > 0) {
                        x.directives[directive](el, output, modifiers, x);
                    }
                }
            })
        })
    }

    registerListener(el, event, modifiers, expression) {
        event = event.replace('@', '');
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
            el.addEventListener(event, e => {
                if (modifiers.includes('prevent')) e.preventDefault()
                if (modifiers.includes('stop')) e.stopPropagation()

                this.runListenerHandler(expression, e)
            })
        }
    }

    runListenerHandler(expression, e) {
        saferEval(expression, this.data, {
            '$el': e.target,
            '$event': e,
            '$refs': this.getRefsProxy()
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
