// This is a copy of /test.js that only searches for *.pact.spec.ts files
// This file is required by karma-pact.conf.js and loads recursively all the .pact.spec and framework files
require('zone.js/dist/zone-testing');
const getTestBed = require('@angular/core/testing').getTestBed;
const BrowserDynamicTestingModule = require('@angular/platform-browser-dynamic/testing').BrowserDynamicTestingModule;
const platformBrowserDynamicTesting = require('@angular/platform-browser-dynamic/testing')
  .platformBrowserDynamicTesting;

// Prevent Karma from running prematurely.
__karma__.loaded = function() {};

// First, initialize the Angular testing environment.
getTestBed().initTestEnvironment(BrowserDynamicTestingModule, platformBrowserDynamicTesting());
// Then we find all the tests.
const contextApps = require.context('../../apps', true, /\.pact\.ts$/);
// And load the modules.
contextApps.keys().map(contextApps);

const contextLibs = require.context('../../libs', true, /\.pact\.ts$/);
// And load the modules.
contextLibs.keys().map(contextLibs);

// Finally, start Karma to run the tests.
__karma__.start();
