"use strict";

var _ = require('lodash-node');
var _S = require('string');

/**
 * Private method keepNote to add a note to the element
 */
function keepNote(ref, keyContext, valueContext) {
     var note = {};
     note[keyContext] = valueContext;
     return (_.isObject(ref))?_.assign(ref, note):note;
}

/**
 * MDN Feature compatibility entry converter
 *
 * @param object data   JSON object coming from MDN import (scraping)
 * @param string origin URL of the originating content
 */
function EntityConverter(data, origin){
  this.data       = data;
  this.origin     = origin;

  // remove this part: https://developer.mozilla.org/en-US/docs/
  // and make it an ordered array
  this.breadcrumb = origin.substr(origin.indexOf('/docs') + 6, origin.length).split("/");
}

EntityConverter.prototype = {
  constructor: EntityConverter,


  convert: function () {
      var out = {};

      out.contents   = this.convertData();
      out.origin     = this.origin;
      out.breadcrumb = this.breadcrumb;
      out.slug       = this.getSlug();
      out.category   = this.getCategory();

      return out;
  },


  getSlug: function () {
      // Simplified string representation
      var out = (this.origin).split("/").pop();

      out = _S(out)
              .replaceAll('.','-')
              .slugify();

      return out.s;
  },


  getCategory: function() {
      var i = (this.breadcrumb).length - 2,

          // @TODO: edge-case-to-fix; find way to define
          //        category differently in that case.
          out = this.breadcrumb[i] || 'edge-case-to-fix';

      return _S(out).slugify().s;
  }
};


EntityConverter.prototype.convertData = function () {
  var data = this.data,
      self = this;

  _.forEach(data, function(a, ak) {
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

      // Reformatting feature name
      var featureName    = _S(bk).collapseWhitespace();
      delete this[bk];
      this[featureName.s] = b;

      _.forEach(b, function(c, ck) {
        // Object with multiple keys (array-like):
        //
        // { normal: 'Not supported', prefix: '21.0' }
        //
        //console.log(ck, c);

        // We want only the browser name in a normalized way:
        var browserName    = _S(ck).collapseWhitespace(),
            posParenthesis = browserName.indexOf('('),
            hasParenthesis = (posParenthesis >= 1)?true:false;

        if(hasParenthesis) {
          browserName = browserName.left(posParenthesis).trim();
        }

        // Reassing reformatted name
        delete this[ck];
        this[browserName.s] = c;



        _.forEach(c, function(d, dk){

          // One element alone:
          //
          // { normal: 'Not supported' }
          //
          //console.log(c);
          //

          // Local variables, normalizing and cleaning up
          var key     = _S(dk).collapseWhitespace(),
              value   = _S(d).collapseWhitespace(),
              matches = [];
          delete this[dk];

          /**
           * Status support level codes
           *
           * y - (Y)es, supported by default
           * a - (A)lmost supported (aka Partial support)
           * n - (N)o support, or disabled by default
           * p - No support, but has (P)olyfill
           * u - Support (u)nknown
           * x - Requires prefi(x) to work
           *
           * Ref: https://github.com/Fyrd/caniuse/blob/master/Contributing.md
           **/

          //
          // Some key-value pairs to consider
          //
          // Loosely ordered from common, to edge-cases
          // and sometimes grouped by similitude.
          //
          // dk       | d
          // ===============================
          // "normal" | "yes"
          // "normal" | "Yes"
          // "normal" | "(Yes)"
          // "prefix" | "yes"
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


          // NOTES
          // Do we cover?:
          // - "normal": "Partial (see below)"
          // - "normal": "Partial since 11.0, full since 16.0"
          // - "normal": "<=11 (?)"
          // - "normal": "7+"
          //
          // Special situations:
          // - Web/CSS/:dir
          // - Web/CSS/box-shadow
          // - Web/API/NavigatorOnLine.onLine

          // Rewrite Rd12
          //
          // If value starts by yes, with or without parenthesis, and
          // has something after it, set to (a)lmost, set unknown (?)
          // browser version, move name value pair into notes
          //
          // Note: Should run after Rd01

          // Rewrite Rd13
          //
          // If it starts by a dash, possibly more than one, set as (u)nsupported
          // and set ? for the version, move name value pair into notes

          // Rewrite Rd14
          //
          // If has "Activated on Nightly only", set as (a)lmost, move
          // name value pair into notes.
          //
          // Matches:
          //   - "Activated on Nightly only (24)"
          //   - "Activated on Nightly only"
          //   - "Nightly build (537.1)"
          //   - "Nightly"
          //   - "nightly"
          //   - "On Nightly, behind the media.webvtt.enabled preference."

          // Rewrite Rd15: (TODO)
          //
          // If starts "Not supported", set as (n)o-support, move name value pair into notes

          // Rewrite Rd16: (TODO)
          //
          // If starts by "Partial", set as (a)lmost, move name value pair into notes

          // Rewrite Rd17: (TODO)
          //
          // If value has "removed" in string, set as (n)o-support, move name value pair into notes

          // Rewrite Rd18: (TODO)
          //
          // If value has "see note" in string, set as (a)lmost, move name value pair into notes

          // Rewrite Rd11:
          //
          // In value, when it is not only a version number; copy to notes
          // whatever value have, then strip the content. Keep key and value
          // as is in notes, it is a stash for possible later-use.
          //
          //
          //  - from:
          //    "Opera": {
          //      "normal": "12.10 (without prefix) sfgfs (forged example but possible) ",
          //      "prefix": "15.0"
          //    }
          //  - to:
          //    "Opera": {
          //      "12.10": "normal",
          //      "15.0": "prefix",
          //      "notes": {
          //        "normal": "12.10 (without prefix) sfgfs (forged example) "
          //      }
          //    }
          if(/^\d[\d\.]{0,}\s/.test(value) == true) {
              this.notes = keepNote(this.notes, key.s, value.s);
              value = value.left(value.indexOf(' '));
          }

          // Rd14
          if(/^(normal|prefix)$/.test(key) == true && /nightly/i.test(value) == true) {
            matches.push('Rd01');
            this.notes = keepNote(this.notes, key.s, value.s);
            key   = _S('a');
            value = _S('?');
            console.log('Rd14', dk, d, value.s, key.s);  // DEBUG
          }

          // Rewrite Rd05:
          //   - description: Harmonizing "normal":"not supported" case
          //   - from: "normal": "Not supported"
          //   - to:   "?": "n"
          //   - see: user-select, or unicode-range
          if(/^normal$/.test(key) == true && /^Not supported$/.test(value) == true) {
            matches.push('Rd05');
            key   = key
                    .replaceAll('normal', 'n');
            value = _S('?');
            //console.log(dk, d, value.s, key.s);  // DEBUG
          }

          // Rewrite Rd01:
          //   - description: Harmonizing yes and unknown version cases
          //   - from:
          //     - "normal": "yes"
          //     - "normal": "Yes"
          //     - "normal": "(Yes)"
          //     - "prefix": "yes"
          //     - "prefix": "Yes"
          //     - "prefix": "(Yes)"
          //   - to:
          //     - "?": "y"
          //     - "?": "x"
          //   - see: "4 values for 4 corners" case
          //   - note: Exact string yes (case insensitive) with or without parenthesis
          if(/^(normal|prefix)$/.test(key) == true && /^\(?yes\)?$/i.test(value) == true) {
            matches.push('Rd01');
            this.notes = keepNote(this.notes, key.s, value.s);
            key   = key
                    .replaceAll('normal', 'y')
                    .replaceAll('prefix', 'x');
            value = _S('?');
            //console.log(dk, d, value.s, key.s);  // DEBUG
          }

          // Rd12
          if(/^\(?yes\)?.*/i.test(value) == true) {
            matches.push('Rd12');
            this.notes = keepNote(this.notes, key.s, value.s);
            key = _S('a');
            value = _S('?');
            //console.log('Rd12', value.s, key.s);  // DEBUG
          }

          // Rewrite Rd04:
          //   - description: Matching specific use case
          //   - from: "normal": "?"
          //   - to:   "?": "u"
          //   - see: "4 values for 4 corners" case
          if(/^normal$/.test(key) == true && /^\?$/.test(value) == true) {
            matches.push('Rd04');
            key   = key
                    .replaceAll('normal', 'u');
            //console.log(dk, d, value.s, key.s);  // DEBUG
          }

          //  Rewrite Rd07:
          //   - description: Matching specific use case
          //   - from: "normal": ""
          //   - to:   "?": "u"
          //   - see: text-align-last
          if(/^normal$/.test(key) == true && value.isEmpty() == true) {
            matches.push('Rd07');
            key   = key
                    .replaceAll('normal', 'u');
            value = _S('?');
            //console.log(dk, d, value.s, key.s);  // DEBUG
          }

          //  Rewrite Rd08:
          //   - description: Matching a version number in the value field, start by number, ends by number, accepts only number and dot cha
          //   - from:
          //     - "prefix": "1.0"
          //     - "normal": "2.0"
          //   - to:
          //     - "1.0": "x"
          //     - "2.0": "y"
          if(/^(normal|prefix)$/.test(key) == true && /^\d[\d\.]{0,}$/.test(value.s) == true) {
            matches.push('Rd08');
            key   = key
                    .replaceAll('normal', 'y')
                    .replaceAll('prefix', 'x');
            //console.log(dk, d, value.s, key.s);  // DEBUG
          }

          // Rd13
          if(/^(normal|prefix)$/.test(key) == true && /^-{1,}$/.test(value.s) == true) {
            matches.push('Rd08');
            this.notes = keepNote(this.notes, key.s, value.s);
            key   = _S('u');
            value = _S('?');
            //console.log('Rd13', dk, d, value.s, key.s);  // DEBUG
          }

          //  Rewrite Rd19: (TODO)
          //   - Rest are anomalies and becomes '?': 'u'.
          //   - Check if value is /^[yp]$/ append with space

          //if(matches.length == 0){
          //  console.log(value.s," : ", key.s);  // DEBUG
          //}
          //if(matches.length > 1){
          //  console.log('Matches more than one:', matches, value.s, key.s);  // DEBUG
          //}

          // Because in our use-case, we want
          // the value to be a normalized key
          this[value.s] = key.s;
        }, c);
      }, b);
    }, a);
  }, data);

  return data;
};

module.exports = EntityConverter