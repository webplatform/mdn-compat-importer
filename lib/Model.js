var _ = require('lodash-node');

//
// Some random notes:
//
//   To visualize:
//     - vim data/compat-mdn.json
//     - :%!python -m json.tool
//

function Model(data, origin){
  this.data       = data;
  this.origin     = origin;

  // remove this part: https://developer.mozilla.org/en-US/docs/
  // and make it an ordered array
  this.breadcrumb = origin.substr(origin.indexOf('/docs') + 6, origin.length).split("/");
}

/**
 * How it currently looks like:
 *
 * [{},{}]
 *
<sample>
  [
    {
        "breadcrumb": [
            "Web",
            "CSS",
            ":indeterminate"
        ],
        "category": "CSS",
        "origin": "https://developer.mozilla.org/en-US/docs/Web/CSS/:indeterminate",
        "slug": ":indeterminate",
        "stats": {
            "desktop": {
                "<progress>": {
                    "Chrome": {
                        "normal": "6.0"
                    },
                    "Firefox (Gecko)": {
                        "normal": "6.0 (6.0)"
                    },
                    "Internet Explorer": {
                        "normal": "10"
                    },
                    "Opera": {
                        "normal": "?"
                    },
                    "Safari": {
                        "normal": "5.2"
                    }
                },
                "type=\"checkbox\"": {
                    "Chrome": {
                        "normal": "(Yes)"
                    },
                    "Firefox (Gecko)": {
                        "normal": "3.6 (1.9.2)"
                    },
                    "Internet Explorer": {
                        "normal": "9.0"
                    },
                    "Opera": {
                        "normal": "10.60 (2.6)"
                    },
                    "Safari": {
                        "normal": "3.0"
                    }
                }
            },
            "mobile": {
                "<progress>": {
                    "Android": {
                        "normal": "?"
                    },
                    "Firefox Mobile (Gecko)": {
                        "normal": "6.0 (6.0)"
                    },
                    "IE Mobile": {
                        "normal": "?"
                    },
                    "Opera Mobile": {
                        "normal": "?"
                    },
                    "Safari Mobile": {
                        "normal": "?"
                    }
                },
                "type=\"checkbox\"": {
                    "Android": {
                        "normal": "?"
                    },
                    "Firefox Mobile (Gecko)": {
                        "normal": "1.0 (1.9.2)"
                    },
                    "IE Mobile": {
                        "normal": "?"
                    },
                    "Opera Mobile": {
                        "normal": "?"
                    },
                    "Safari Mobile": {
                        "normal": "?"
                    }
                }
            }
        }
      }
    ]
</sample>
 */
Model.prototype.convert = function () {
  var out = {};

  out.breadcrumb = this.breadcrumb;
  out.slug       = this.getSlug();
  out.origin     = this.origin;
  out.category   = this.getCategory();

  // Put the rest here for a while we figure out
  // organization
  //
  out.stats = this.data;

  return out;
};

Model.prototype.getSlug = function () {
  return (this.origin).split("/").pop();
};

Model.prototype.getCategory = function () {
  var i = (this.breadcrumb).length - 2;

  return this.breadcrumb[i] || 'EDGECASE_TO_FIX';
};

module.exports = Model;