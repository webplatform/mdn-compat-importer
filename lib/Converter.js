var $ = require('cheerio');
var _ = require('lodash-node');
var EntityConverter = require('./EntityConverter.js');


function Converter() {
}

/**
 * extracts an JS object from a HTML representation, it will be in the following format
 * version values can also be '?', 'Yes', '(Yes)' 'iOS 6.0 only', '5.0 (iOS 4.2)', '---', 'Not supported' etc.
 * desktop and mobile can be missing
 * normal and prefix can be missing
 * {
 *   desktop: {
 *     'Basic support': {
 *       Chrome: {
 *         normal: '3.0',
 *         prefix: '(Yes)'
 *       },
 *       'Firefox (Gecko)': {
 *         normal: '16.0 (16.0)',
 *         prefix: '5.0 (5.0)'
 *       },
 *       // ...
 *     },
 *     'autoplay attribute': {
 *       // see above
 *     },
 *     // ...
 *   },
 *   mobile: {
 *     // see above
 *   }
 * }
 * @param  {String} html the HTML to parse
 * @return {Object}      the compatibility info
 */
Converter.prototype.extract = function(html) {
  // see here for help with cheerio:
  // https://github.com/MatthewMueller/cheerio
  var table = {};

  function parseTable($ele) {
    var table = {};
    var browsers = $('th', $ele).toArray().map(function(th) {
      return $(th).text();
    }).slice(1);
    $('tr:not(:first-child)', $ele).toArray().forEach(function(tr) {
      var feature = $('td:first-child', $(tr)).text();
      var versions = $('td:not(:first-child)', $(tr)).toArray().map(function(td) {
        var version = {};

        var html = $(td).html();
        // for prefixes td will be something like this:
        // 5.0 (5.0)<span class="inlineIndicator prefixBox prefixBoxInline" title="prefix">-moz</span><br>16.0 (16.0)
        // or:
        // <span style="color: #888;" title="Please...">(Yes)</span><span class="inlineIndicator prefixBox prefixBoxInline" title="prefix">-webkit</span>
        // so we always split by <br>
        var parts = html.split('<br>');
        parts.forEach(function(part) {
          var $part = $.load('<div>' + part + '</div>'); // wrap into a <div>, because part can be text-only

          // clean the text
          var $copy = $.load($part.html());
          $copy('a').remove();
          $copy('.prefixBox').remove();
          $copy('.unimplemented').remove();
          var cleanedText = $copy(':root').text().trim();

          // check if there is a span with class prefixBox in the part
          if ($part('.prefixBox').length > 0) {
            // looks like a prefixed version!
            version.prefix = cleanedText;
          } else {
            // probably normal version
            version.normal = cleanedText;
          }
        });

        return version;
      });
      table[feature] = _.zipObject(browsers, versions);
    });
    return table;
  }

  var desktop = $('#compat-desktop', html);
  if (desktop) {
    table.desktop = parseTable(desktop);
  }

  var mobile = $('#compat-mobile', html);
  if (mobile) {
    table.mobile = parseTable(mobile);
  }

  return table;
};

/**
 * converts an object from {@link Converter#extract} to WPD's format
 *
 * See {@link EntityConverter} for suggested representation
 *
 * @param  {Object} table object from {@link Converter#extract}
 * @param  {String} url   where this data comes from
 * @return {Object}       compatibility info in WPD format
 */
Converter.prototype.convert = function(tableData) {
    var wpd = [];

    // Loop with the JSON tree and cleanup
    // all elements to have one array of
    // every compat data we got so far
    _.each(tableData, function(data, url) {
        var m = new EntityConverter(data, url);
        wpd.push(m.convert());
    });

    return wpd;
};

module.exports = Converter;
