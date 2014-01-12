var cwd = process.cwd().replace(/\\/g, '/');
require('blanket')({
  pattern: cwd,
  'data-cover-never': ['node_modules', cwd + '/test'],
  'data-cover-reporter-options': {
    shortnames: false // this currently breaks relative require(), so we post-process in Gruntfile
  }
});
var chai = require('chai');

global.assert = chai.assert;
global.expect = chai.expect;
chai.should();
