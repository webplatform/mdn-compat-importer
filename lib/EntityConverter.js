var _ = require('lodash-node');
var _S = require('string');

//
// Entity Conversion
//
// NOTES:
//   To visualize:
//     - vim data/compat-mdn.json
//     - :%!python -m json.tool
//

/***

  CONVERSION STEPS

  Step 1. Flip key and values, skim rendering engine parenthesis precision
    - from: "Firefox (Gecko)": { "normal": "4.0 (2.0)", "prefix": "3.5 (1.9.1)"}
    - to: "Firefox": { "4.0": "y", "3.5": "prefix" }

***/


function EntityConverter(data, origin){
  this.data       = data;
  this.origin     = origin;

  // remove this part: https://developer.mozilla.org/en-US/docs/
  // and make it an ordered array
  this.breadcrumb = origin.substr(origin.indexOf('/docs') + 6, origin.length).split("/");
}


EntityConverter.prototype.convert = function () {
  var out = {};

  out.contents   = this.convertData();
  out.origin     = this.origin;
  out.breadcrumb = this.breadcrumb;
  out.slug       = this.getSlug();
  out.category   = this.getCategory();


  return out;
};


EntityConverter.prototype.getSlug = function () {
  return (this.origin).split("/").pop();
};


EntityConverter.prototype.getCategory = function () {
  var i = (this.breadcrumb).length - 2;

  return this.breadcrumb[i] || 'EDGECASE_TO_FIX';
};


EntityConverter.prototype.convertData = function () {
  var that = this.data;

  _.forEach(that, function(a, ak) {
    _.forEach(a, function(b, bk) {
      _.forEach(b, function(c, ck) {
        _.forEach(c, function(d, dk){
          delete this[dk];

          // Some repeatable text replacements
          var unknownVersionKeyName = '(unknown version)';

          // Local variables
          var key,
              value;

          value = _S(dk)
                    .collapseWhitespace()
                    .replaceAll('normal', 'y');

          key   = _S(d)
                    .collapseWhitespace()
                    .replaceAll('?', unknownVersionKeyName)
                    .replaceAll('-', unknownVersionKeyName)
                    .replaceAll('(Yes)', unknownVersionKeyName);

          var keySpaceIndex        = key.indexOf(' '),
              keyHasSpace          = (keySpaceIndex >= 0)?true:false,
              keyFirstCharIsNumber = _S(key.s[0]).isNumeric();

          if(keyHasSpace == true && keyFirstCharIsNumber) {
            key = key.left(keySpaceIndex);
            //console.log(key.s, value.s, keySpaceIndex, keyFirstCharIsNumber);  // DEBUG
          }

          this[key.s] = value.s;
        }, c);
      }, b);
    }, a);
  }, that);

  return that;
};


module.exports = EntityConverter;