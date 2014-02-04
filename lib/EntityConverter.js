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
  // Simplified string representation
  return _S((this.origin).split("/").pop()).slugify().s;
};


EntityConverter.prototype.getCategory = function () {
  var i = (this.breadcrumb).length - 2;

  // @TODO: EDGECASE_TO_FIX; find way to define
  //        category differently in that case.
  return this.breadcrumb[i] || 'EDGECASE_TO_FIX';
};


EntityConverter.prototype.convertData = function () {
  var that = this.data;

  _.forEach(that, function(a, ak) {
    _.forEach(a, function(b, bk) {
      // Object with list of browsers and the support
      // level information:
      //
      // { 'Firefox (Gecko)': { normal: '20.0 (20.0)' },
      //   Chrome: { prefix: '21.0' },
      //   'Internet Explorer': { normal: 'Not supported' },
      //   Opera: { normal: '12.10' },
      //   Safari: { normal: 'Not supported' } }
      //
      //console.log(b);

      _.forEach(b, function(c, ck) {
        // Object with multiple keys (array-like):
        //
        // { normal: 'Not supported', prefix: '21.0' }
        //
        //console.log(ck, c);

        // We want only the browser name in a normalized way:
        var browserName = _S(ck),
            posParenthesis = _S(ck).indexOf('('),
            hasParenthesis = (posParenthesis >= 1)?true:false;

        if(hasParenthesis) {
          browserName = browserName.left(posParenthesis).trimRight();
        }

        browserName
          .replaceAll('IE\u00a0Phone', 'IE Phone');

        // Reassing reformatted name
        delete this[ck];
        this[browserName.s] = c;


        _.forEach(c, function(d, dk){
          // One element alone:
          //
          // { normal: 'Not supported' }
          //
          //console.log(c);

          // Some key-value pairs to consider
          //
          // Loosely ordered from common, to edge-cases
          // and sometimes grouped by similitude.
          //
          // dk       | d
          // ===============================
          // "normal" | "13"
          // "normal" | "13.0"
          // "prefix" | "3.0 (522)"
          // "normal" | "1.0 (1.0)"
          // "normal" | "4.0 (2)"
          // "normal" | "?"
          // "normal" | "Nightly build"
          // "normal" | "5.1 ()"
          // "normal" | "29.0 (29.0)"
          // "normal" | "Not\u00a0supported"
          // "normal" | "Not supported()"
          // "normal" | "Not supported"
          // "normal" | "Partial (see below)"
          // "normal" | "(Yes) (Not in Chromium)"
          // "normal" | "(Yes) [1]"
          // "normal" | "12.10 (without prefix)"
          // "normal" | "3.1 (must be installed separately, e.g. )"
          // "normal" | "3.1 (must be installed separately)"
          // "normal" | "9.0 (, e.g. )"
          // "normal" | "3.1 (plays all formats available via QuickTime)"
          // "normal" | "Partial since 11.0, full since 16.0"
          // "normal" | "Removed in 23.0 (23.0)"
          // "normal" | "12.10 (without prefix)"
          // "normal" | "Activated on Nightly only (24)"
          // "normal" | "Chrome OS:"
          // "normal" | "16.0 (16) (without prefix) [2]"
          // "prefix" | "10.0 (10)  [1]"
          // "normal" | "22.0 (22.0) [1]"

          // Some repeatable text replacements
          var unknownVersionKeyName = '(unknown version)';

          // Local variables
          var key,
              value;

          // Normalizing and cleaning up
          delete this[dk];
          key = _S(dk)
                    .collapseWhitespace();
          value   = _S(d)
                    .collapseWhitespace()
                    .replaceAll('?', unknownVersionKeyName)
                    .replaceAll('-', unknownVersionKeyName)
                    .replaceAll('(Yes)', unknownVersionKeyName);

          // Substitutions
          key   = key
                  .replaceAll('normal', 'y');

          value = value
                  .replaceAll('?', unknownVersionKeyName)
                  .replaceAll('-', unknownVersionKeyName)
                  .replaceAll('(Yes)', unknownVersionKeyName);

          // Computations for further rewrites
          var valueSpaceIndex        = value.indexOf(' '),
              valueHasSpace          = (valueSpaceIndex >= 0)?true:false,
              valueFirstCharIsNumber = _S(value.s[0]).isNumeric(),
              valueFirstCharIsLetter = _S(value.s[0]).isNumeric();

          // Replacing all, giving only a number:
          //  - "9.0 (, e.g. )"
          //  - "16.0 (16) (without prefix) [2]"
          if(valueHasSpace == true && valueFirstCharIsNumber) {
            value = value.left(valueSpaceIndex);
            //console.log(value.s, key.s, valueSpaceIndex, valueFirstCharIsNumber);  // DEBUG
          }

          // Because in our use-case, we want
          // the value to be a normalized key
          this[value.s] = key.s;
        }, c);
      }, b);
    }, a);
  }, that);

  return that;
};


module.exports = EntityConverter;