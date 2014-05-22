var fs = require('fs');
var request = require('superagent');
var Q = require('q');
var _ = require('lodash-node');

function Reader() {
  this.links = {}; // url -> 'Browser_compatibility'
  this.pages = {}; // url -> compat section as HTML

  // try to load a cache file
  this.cachePath = 'data/cache/pages.json';
  this.cache = {};
  if (fs.existsSync(this.cachePath)) {
    this.cache = JSON.parse(fs.readFileSync(this.cachePath, {
      encoding: 'utf8'
    }));
    console.log('using cache file containing ' + _.size(this.cache) + ' pages');
  }
}

/**
 * fetches a feed either from cache or from the web
 * @param  {String}   tag the tag to fetch
 * @param  {Function} cb  a callback to notify when finished
 */
Reader.prototype.getFeed = function(tag, cb) {
  // use the cached version, if present
  var cachePath = 'data/cache/tag-' + tag.toLowerCase() + '.json';
  if (fs.existsSync(cachePath)) {
    var content = fs.readFileSync(cachePath, {
      encoding: 'utf8'
    });
    var obj = JSON.parse(content);
    console.log('using cached feed containing ' + obj.length + ' links for tag: ' + tag);
    cb(null, obj);
    return;
  }

  // else fetch a fresh copy
  var url = 'https://developer.mozilla.org/en-US/docs/feeds/json/tag/' + tag;
  console.log('fetching live feed for tag: ' + tag);
  request.get(url).end(function(err, res) {
    // check for errors
    if (err) {
      console.log('error requesting feed for tag: ' + tag);
      cb(err);
      return;
    } else if (res.error) {
      console.log('unexpected feed response for tag: ' + tag);
      cb(res.error);
      return;
    }

    // everything ok!
    console.log(res.body.length + ' pages for tag: ' + tag);
    fs.writeFileSync(cachePath, JSON.stringify(res.body));
    cb(null, res.body);
  });
};

/**
 * extracts the page links from a feed
 * @param  {Object} feed a feed
 */
Reader.prototype.parseFeed = function(feed) {
  // feed will be an array of:
  // {
  //   pubdate: "2014-01-11T00:45:36-08:00"
  //   author_link: "https://developer.mozilla.org/en-US/profiles/teoli"
  //   title: "text-decoration-style"
  //   author_name: "teoli"
  //   author_avatar: "https://secure.gravatar.com/avatar/5217c19185715da9fc4e43afa63eeb8a?s=220&r=pg&d=https%3A%2F%2Fdeveloper.cdn.mozilla.net%2Fmedia%2F%2Fimg%2Favatar.png"
  //   link: "https://developer.mozilla.org/en-US/docs/Web/CSS/text-decoration-style"
  //   categories: {
  //     CSS3: "https://developer.mozilla.org/en-US/docs/tag/CSS3"
  //     Web: "https://developer.mozilla.org/en-US/docs/tag/Web"
  //     CSS Property: "https://developer.mozilla.org/en-US/docs/tag/CSS%20Property"
  //     Reference: "https://developer.mozilla.org/en-US/docs/tag/Reference"
  //     Référence: "https://developer.mozilla.org/en-US/docs/tag/R%C3%A9f%C3%A9rence"
  //     NeedsLiveSample: "https://developer.mozilla.org/en-US/docs/tag/NeedsLiveSample"
  //     css3-text: "https://developer.mozilla.org/en-US/docs/tag/css3-text"
  //     Layout: "https://developer.mozilla.org/en-US/docs/tag/Layout"
  //     CSS: "https://developer.mozilla.org/en-US/docs/tag/CSS"
  //   }
  // }
  feed.forEach(function(item) {
    // avoid duplicates when fetching multiple feeds
    this.links[item.link] = null;
  }.bind(this));
};

/**
 * fetch and parse a feed
 * @param  {String}   tag the tag to fetch and process
 * @return {Promise}      a promise which will be resolved when finished
 */
Reader.prototype.processFeed = function(tag, cb) {
  var defer = Q.defer();
  this.getFeed(tag, function(err, feed) {
    if (err) {
      defer.reject(err);
    } else {
      this.parseFeed(feed);
      defer.resolve(this.links);
    }
  }.bind(this));
  return defer.promise;
};

/**
 * reads a page's metadata and figures out how exactly the compat section is named
 * this step is needed, because sometimes it's 'Browser_Compatibility' and sometimes it's 'Browser_compatibility'
 */
Reader.prototype.getSectionNames = function() {
  var sleepInterval = 1000; // how many ms to wait between requests
  var defer = Q.defer();
  var todo = _.clone(this.links);

  // create the worker
  var processSingleLink = function() {
    var size = _.size(todo);
    if (size > 0) {
      // there is more work
      if (size % 50 === 0) {
        console.log(size + ' section ids left...');
      }

      // grab the first item from the queue
      var url = _.keys(todo)[0];
      delete todo[url];

      // check the cache
      if (_(this.cache).has(url)) {
        // we can start the next work item immediately, because no request occured
        setImmediate(processSingleLink);
      } else {
        // fetch it from the web
        request.get(url + '$json').end(function(res) {
          var compatSection = _.find(res.body.sections, function(section) {
            return section.id.toLowerCase() === 'browser_compatibility' || section.title.toLowerCase() === 'browser compatibility';
          });
          if (compatSection) {
            this.links[url] = compatSection.id;
          }

          // schedule the next work item
          setTimeout(processSingleLink, sleepInterval);
        }.bind(this));
      }
    } else {
      // finish when everything is done
      defer.resolve(_.pluck(this.links));
    }
  }.bind(this);

  // start the worker
  setImmediate(processSingleLink);

  return defer.promise;
};

/**
 * goes through all links and fetches the compat section for each
 * @return {Promise} a promise which will be resolved when finished
 */
Reader.prototype.fetchSections = function() {
  var sleepInterval = 1000; // how many ms to wait between requests
  var defer = Q.defer();
  var todo = _.clone(this.links);

  // create the worker
  var processSinglePage = function() {
    var size = _.size(todo);
    if (size > 0) {
      // there is more work
      if (size % 50 === 0) {
        console.log(size + ' pages left...');
      }

      // grab the first item from the queue
      var url = _.keys(todo)[0];
      var section = todo[url];
      delete todo[url];

      // check the cache
      if (_(this.cache).has(url)) {
        this.pages[url] = this.cache[url];
        // we can start the next work item immediately, because no request occured
        setImmediate(processSinglePage);
      } else if (!section) {
        // there is no compat section, mark it as null for the cache
        this.pages[url] = null;
        // ignore pages without compat sections
        setImmediate(processSinglePage);
      } else {
        // fetch it from the web
        request.get(url + '?raw&macros&section=' + section).end(function(res) {
          // this will also cache pages without a compat section, so they won't be requested again
          this.pages[url] = res.text;

          // schedule the next work item
          setTimeout(processSinglePage, sleepInterval);
        }.bind(this));
      }
    } else {
      // finish when everything is done
      _.assign(this.cache, this.pages); // put new pages into the cache
      fs.writeFileSync(this.cachePath, JSON.stringify(this.cache));
      defer.resolve(this.pages);
    }
  }.bind(this);

  // start the worker
  setImmediate(processSinglePage);

  return defer.promise;
};

module.exports = Reader;
