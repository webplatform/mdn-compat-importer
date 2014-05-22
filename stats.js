var pages = require('./data/cache/pages.json');
var keys = Object.keys(pages);
var success = [], fail = [];
keys.forEach(function(key) {
  (pages[key] ? success : fail).push(key);
});
console.log('== with compat table ==');
console.log(success.sort().join('\n'));
console.log('\n\n');
console.log('== without compat table ==');
console.log(fail.sort().join('\n'));
