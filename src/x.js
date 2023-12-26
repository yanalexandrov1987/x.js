/**
 * Let's build X together. For starters, we'll import X's core.
 * This is the object that will expose all of X's public API.
 */
import { x } from './scripts/index';

window.x = x;

/**
 * A client-side properties storage system.
 * X.js watch property changes and overwrites them to the repositories.
 */
import './scripts/storage';

/**
 * The Directives
 *
 * Now that the core is all set up, we can register X directives like x-text or
 * x-html that form the basis of how X adds behavior to an app's static markup.
 */
import './scripts/directives/x-for';
import './scripts/directives/x-bind';
import './scripts/directives/x-html';
import './scripts/directives/x-text';
import './scripts/directives/x-show';

/**
 * The Methods
 *
 * These are the methods that are magically available to all the X.js expressions, within your web app.
 */
import './scripts/methods/$fetch';

window.x.start();
