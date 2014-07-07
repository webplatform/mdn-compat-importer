# Mozilla Developer Network Compatibility data importer

[![Dependency Status](https://david-dm.org/webplatform/mdn-compat-importer.png)](https://david-dm.org/webplatform/mdn-compat-importer)

Reads MDN compatibility info from the site, and converts it from HTML to JSON.

***This tool isn't meant to be run as-is, it will exit with a warning by default!***

## Using data

You can query the data using the terminal and `underscore-cli](https://github.com/ddopson/underscore-cli)`.

    npm install -g underscore-cli

How many features?

    cat data/data.json | underscore select ':root > .slugs' | underscore process 'size(data[0])'
    >> 1115

Finding a feature?

    cat data/data.json | underscore select ':root > .slugs' | underscore process 'indexOf(data[0], "before")'
    >> 29
    cat data/data.json | underscore select ':root > .data' | underscore process 'data[0][29]'
    >> ... JSON object ...

How many duplicates?

  How many are more than two?

      cat data/data.json | underscore select ':root > .slugs' | underscore process 'dups=[]; seen=[]; each(data[0], function(e) { if(_.contains(seen, e)){ dups.push(e); } seen.push(e);  }); uniq(dups).length'
    >> 80

  How many duplicates overall?

      cat data/data.json | underscore select ':root > .slugs' | underscore process 'dups=[]; seen=[]; each(data[0], function(e) { if(_.contains(seen, e)){ dups.push(e); } seen.push(e);  }); dups.length'
    >> 112


      cat data/data.json | underscore select ':root > .slugs' | underscore process 'dups=[]; seen=[]; each(data[0], function(e, index) { if(_.contains(seen, e)){ dups.push({slug: e, index: index}); } seen.push(e);  }); dups.length'

Which are duplicates?

  This is a bit tricky but to see only the duplicates and their array index at the data level by doing this:

      cat data/data.json | underscore select ':root > .slugs' | underscore process 'dups=[]; seen=[]; each(data[0], function(e, index) { if(_.contains(seen, e)){ dups.push({slug: e, index: index}); } seen.push(e);  }); dups'
      >> [{slug: "a", index: 291}, /* ... */ ]

  To list the dupliates of the same slug:

      cat data/data.json | underscore select ':root > .slugs' | underscore process 'dups=[]; seen=[]; each(data[0], function(e, index) { if(_.contains(seen, e)){ dups.push({slug: e, index: index}); } seen.push(e);  }); _.where(dups, {slug: "a"})'
      >> [{ "slug": "a", "index": 291 }, { "slug": "a", "index": 393 }]

  To view the data of a known entity that has duplicates

      cat data/data.json | underscore select ':root > .data' | underscore process '_.where(data[0], {slug: "a"})'

## Running

### Installation

  - Clone this repository (you should fork first, if you want to contribute)
  - Create a branch to create your work
  - Prepare your workspace:
    - Use Vagrant, see `README.vagrant.md`
    - Locally
      - Install [NodeJS](http://nodejs.org/), if you haven't already
      - Run `npm install -g grunt-cli` (you might need sudo/admin for this)
      - Run `npm install` from the directory to install the dependencies
      - Run `node index.js` to run the tool


### Current Issues

  - Need to improve page scraping, see [#3](https://github.com/webplatform/mdn-compat-importer/issues/3)
  - Some pages have compat tables but don't represent a tag or property directly, e.g. [HTML/CORS_Enabled_Image](https://developer.mozilla.org/en-US/docs/HTML/CORS_Enabled_Image)


### Developing

A full cache is bundled, so no requests will be made to MDN. You can start working on the HTML to JS parser or the conversion to WPD format right away! If you have questions, post to the mailing list or catch me (frozenice) on IRC.

To test single pages, uncomment the stuff around line 50 and line 66 in `index.js`.


### Internal Object

Here are some examples of what the internal JS object looks like Before `Converter#extract()` pass through `EntityConverter#convert()`.

#### [HTML/Element/header](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/header#Browser_compatibility) (simple table)

```js
{ 'https://developer.mozilla.org/en-US/docs/Web/HTML/Element/header':
   { desktop:
      { 'Basic support':
         { Chrome: { normal: '5' },
           'Firefox (Gecko)': { normal: '4.0 (2.0)' },
           'Internet Explorer': { normal: '9.0' },
           Opera: { normal: '11.10' },
           Safari: { normal: '4.1' } } },
     mobile:
      { 'Basic support':
         { Android: { normal: '2.2' },
           'Firefox Mobile (Gecko)': { normal: '4.0 (2.0)' },
           'IE Mobile': { normal: '9.0' },
           'Opera Mobile': { normal: '11.0' },
           'Safari Mobile': { normal: '5.0 (iOS 4.2)' } } } } }
```

#### [HTML/Element/video](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/video#Browser_compatibility) (table with several rows)

```js
{ 'https://developer.mozilla.org/en-US/docs/Web/HTML/Element/video':
   { desktop:
      { 'Basic support':
         { Chrome: { normal: '3.0' },
           'Firefox (Gecko)': { normal: '3.5 (1.9.1)' },
           'Internet Explorer': { normal: '9.0' },
           Opera: { normal: '10.5' },
           Safari: { normal: '3.1' } },
        'autoplay attribute':
         { Chrome: { normal: '3.0' },
           'Firefox (Gecko)': { normal: '3.5 (1.9.1)' },
           'Internet Explorer': { normal: '9.0' },
           Opera: { normal: '10.5' },
           Safari: { normal: '3.1' } },
        'buffered attribute':
         { Chrome: { normal: '?' },
           'Firefox (Gecko)': { normal: '4.0 (2.0)' },
           'Internet Explorer': { normal: '?' },
           Opera: { normal: 'Yes' },
           Safari: { normal: '?' } },
        'controls attribute':
         { Chrome: { normal: '3.0' },
           'Firefox (Gecko)': { normal: '3.5 (1.9.1)' },
           'Internet Explorer': { normal: '9.0' },
           Opera: { normal: '10.5' },
           Safari: { normal: '3.1' } },
        'loop attribute':
         { Chrome: { normal: '3.0' },
           'Firefox (Gecko)': { normal: '11.0 (11.0)' },
           'Internet Explorer': { normal: '9.0' },
           Opera: { normal: '10.5' },
           Safari: { normal: '3.1' } },
        'muted attribute':
         { Chrome: { normal: '?' },
           'Firefox (Gecko)': { normal: '11.0 (11.0)' },
           'Internet Explorer': { normal: '?' },
           Opera: { normal: 'Yes' },
           Safari: { normal: '?' } },
        'played property':
         { Chrome: { normal: '?' },
           'Firefox (Gecko)': { normal: '15.0 (15.0)' },
           'Internet Explorer': { normal: '?' },
           Opera: { normal: 'Yes' },
           Safari: { normal: '?' } },
        'poster attribute':
         { Chrome: { normal: '3.0' },
           'Firefox (Gecko)': { normal: '3.6 (1.9.2)' },
           'Internet Explorer': { normal: '9.0' },
           Opera: { normal: '10.5' },
           Safari: { normal: '3.1' } },
        'preload attribute':
         { Chrome: { normal: '3.0' },
           'Firefox (Gecko)': { normal: '4.0 (2.0)' },
           'Internet Explorer': { normal: '9.0' },
           Opera: { normal: 'Yes' },
           Safari: { normal: '3.1' } },
        'src attribute':
         { Chrome: { normal: '3.0' },
           'Firefox (Gecko)': { normal: '3.5 (1.9.1)' },
           'Internet Explorer': { normal: '9.0' },
           Opera: { normal: '10.5' },
           Safari: { normal: '3.1' } },
        'crossorigin attribue':
         { Chrome: { normal: '?' },
           'Firefox (Gecko)': { normal: '12.0 (12.0)' },
           'Internet Explorer': { normal: '?' },
           Opera: { normal: '?' },
           Safari: { normal: '?' } } },
     mobile:
      { 'Basic support':
         { Android: { normal: '?' },
           'Firefox Mobile (Gecko)': { normal: '1.0 (1.0)' },
           'IE Mobile': { normal: '?' },
           'Opera Mobile': { normal: '?' },
           'Safari Mobile': { normal: '?' } },
        'autoplay attribute':
         { Android: { normal: '?' },
           'Firefox Mobile (Gecko)': { normal: '1.0 (1.0)' },
           'IE Mobile': { normal: '?' },
           'Opera Mobile': { normal: '?' },
           'Safari Mobile': { normal: 'iOS 6.0 only' } },
        'buffered attribute':
         { Android: { normal: '?' },
           'Firefox Mobile (Gecko)': { normal: '4.0 (2.0)' },
           'IE Mobile': { normal: '?' },
           'Opera Mobile': { normal: '?' },
           'Safari Mobile': { normal: '?' } },
        'controls attribute':
         { Android: { normal: '?' },
           'Firefox Mobile (Gecko)': { normal: '1.0 (1.0)' },
           'IE Mobile': { normal: '?' },
           'Opera Mobile': { normal: '?' },
           'Safari Mobile': { normal: '?' } },
        'loop attribute':
         { Android: { normal: '?' },
           'Firefox Mobile (Gecko)': { normal: '11.0 (11.0)' },
           'IE Mobile': { normal: '?' },
           'Opera Mobile': { normal: '?' },
           'Safari Mobile': { normal: '?' } },
        'muted attribute':
         { Android: { normal: '?' },
           'Firefox Mobile (Gecko)': { normal: '11.0 (11.0)' },
           'IE Mobile': { normal: '?' },
           'Opera Mobile': { normal: '?' },
           'Safari Mobile': { normal: '?' } },
        'played property':
         { Android: { normal: '?' },
           'Firefox Mobile (Gecko)': { normal: '15.0 (15.0)' },
           'IE Mobile': { normal: '?' },
           'Opera Mobile': { normal: '?' },
           'Safari Mobile': { normal: '?' } },
        'poster attribute':
         { Android: { normal: '?' },
           'Firefox Mobile (Gecko)': { normal: '1.0 (1.0)' },
           'IE Mobile': { normal: '?' },
           'Opera Mobile': { normal: '?' },
           'Safari Mobile': { normal: '?' } },
        'preload attribute':
         { Android: { normal: '?' },
           'Firefox Mobile (Gecko)': { normal: '4.0 (2.0)' },
           'IE Mobile': { normal: '?' },
           'Opera Mobile': { normal: '?' },
           'Safari Mobile': { normal: '?' } },
        'src attribute':
         { Android: { normal: '?' },
           'Firefox Mobile (Gecko)': { normal: '1.0 (1.0)' },
           'IE Mobile': { normal: '?' },
           'Opera Mobile': { normal: '?' },
           'Safari Mobile': { normal: '?' } },
        'crossorigin attribute':
         { Android: { normal: '?' },
           'Firefox Mobile (Gecko)': { normal: '12.0 (12.0)' },
           'IE Mobile': { normal: '?' },
           'Opera Mobile': { normal: '?' },
           'Safari Mobile': { normal: '?' } } } } }
```

#### [CSS/@keyframes](https://developer.mozilla.org/en-US/docs/Web/CSS/@keyframes#Browser_Compatibility) (table with prefixes)

```js
{ 'https://developer.mozilla.org/en-US/docs/Web/CSS/@keyframes':
   { desktop:
      { 'Basic support':
         { Chrome: { prefix: '(Yes)' },
           'Firefox (Gecko)': { prefix: '5.0 (5.0)', normal: '16.0 (16.0)' },
           'Internet Explorer': { normal: '10' },
           Opera: { prefix: '12', normal: '12.10' },
           'Safari (WebKit)': { prefix: '4.0' } } },
     mobile:
      { 'Basic support':
         { Android: { prefix: '(Yes)' },
           'Firefox Mobile (Gecko)': { prefix: '5.0 (5.0)', normal: '16.0 (16.0)' },
           'IE Phone': { normal: '?' },
           'Opera Mobile': { normal: '?' },
           'Safari Mobile': { normal: '?' } } } } }
```

### After `EntityConverter#convert()` data cleanup

After the data cleanup is finished, it currently gets transformed in the
following format.

Also, have a look at the source comments to see the list of [filters and modifications are applied](https://github.com/webplatform/mdn-compat-importer/blob/master/lib/EntityConverter.js#L9). See `Rd01` and other `RdNN` notes.

```js
[
    {
        "breadcrumb": [
            "Web",
            "CSS",
            "image"
        ],
        "category": "css",
        "contents": {
            "desktop": {
                "<gradient>": {
                    "Chrome": { "?": "x" },
                    "Firefox": { "?": "y u x",
                        "notes": {
                            "prefix": "limited to &"
                        }
                    },
                    "Internet Explorer": { "?": "u x",
                        "notes": {
                            "prefix": "IE 10"
                        }
                    },
                    "Opera": { "?": "x" },
                    "Safari": { "?": "x" }
                },
                "<uri>": {
                    "Chrome": { "?": "y" },
                    "Firefox": { "?": "y" },
                    "Internet Explorer": { "?": "y" },
                    "Opera": { "?": "y" },
                    "Safari": { "?": "y" }
                },
                "element()": {
                    "Chrome": { "?": "u" },
                    "Firefox": { "4.0": "x",
                        "notes": {
                            "prefix": "4.0 (2.0) limited to &"
                        }
                    },
                    "Internet Explorer": { "?": "u" },
                    "Opera": { "?": "u" },
                    "Safari": { "?": "u" }
                }
            },
            "mobile": {
                "<gradient>": {
                    "Android": { "?": "u" },
                    "Firefox Mobile": { "?": "y u x",
                        "notes": {
                            "prefix": "limited to &"
                        }
                    },
                    "IE Phone": { "?": "u" },
                    "Opera Mobile": { "?": "u" },
                    "Safari Mobile": { "?": "u" }
                },
                "<uri>": {
                    "Android": { "?": "y" },
                    "Firefox Mobile": { "?": "y" },
                    "IE Phone": { "?": "y" },
                    "Opera Mobile": { "?": "y" },
                    "Safari Mobile": { "?": "y" }
                },
                "element()": {
                    "Android": { "?": "u" },
                    "Firefox Mobile": { "4.0": "x",
                        "notes": {
                            "prefix": "4.0 (2.0) limited to &"
                        }
                    },
                    "IE Phone": { "?": "u" },
                    "Opera Mobile": { "?": "u" },
                    "Safari Mobile": { "?": "u" }
                }
            }
        },
        "origin": "https://developer.mozilla.org/en-US/docs/Web/CSS/image"
    }
]
```

---

This project was generated using [generator-node-adv](https://github.com/webplatform/generator-node-adv), check there for general NodeJS docs and information about the project's structure.
