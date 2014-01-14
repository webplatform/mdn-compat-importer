var path = require('path');
var chai = require('chai');
var istanbul = require('istanbul'),
  hook = istanbul.hook,
  Instrumenter = istanbul.Instrumenter,
  instrumenter = new Instrumenter();
var cwd = process.cwd();
var cwdNodeModules = path.resolve(cwd, 'node_modules');
var cwdTest = path.resolve(cwd, 'test');
var matcher = function(file) {
  if (file.indexOf(cwd) !== 0 || file.indexOf(cwdNodeModules) === 0 || file.indexOf(cwdTest) === 0) {
    return false;
  }
  return true;
};
var transformer = instrumenter.instrumentSync.bind(instrumenter);
hook.hookRequire(matcher, transformer);

global.assert = chai.assert;
global.expect = chai.expect;
chai.should();
