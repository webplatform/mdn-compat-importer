var fs = require('fs');
var cp = require('child_process');
var rimraf = require('rimraf');

var LINT = true;
var COVERALLS = false;

module.exports = function(grunt) {
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    jshint: {
      options: { // see http://www.jshint.com/docs/options/
        node: true,
        esnext: true,
        bitwise: true,
        camelcase: true,
        curly: true,
        eqeqeq: true,
        immed: true,
        indent: 2,
        latedef: true,
        newcap: true,
        noarg: true,
        undef: true,
        trailing: true,
        smarttabs: true
      },
      build: ['Gruntfile.js'],
      lib: ['index.js', 'lib/**/*.js'],
      test: {
        options: {
          '-W030': true, // Expected an assignment or function call and instead saw an expression: ...to.be.true
          globals: {
            describe: true,
            it: true,
            assert: true,
            expect: true,
            before: true,
            after: true,
            beforeEach: true,
            afterEach: true
          }
        },
        files: {
          src: ['test/**/*.js']
        }
      }
    },
    mochaTest: {
      lib: {
        options: {
          ui: 'bdd',
          require: ['test/init.js']
        },
        src: ['test/**/*.js', '!test/init.js']
      }
    },
    replace: {
      results: {
        src: ['test-results/coverage.html', 'test-results/lcov.txt'],
        overwrite: true,
        replacements: [
          {
            // make coverage paths relative
            from: process.cwd().replace(/\\/g, '/') + '/',
            to: ''
          }
        ]
      }
    }
  });

  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-mocha-test');
  grunt.loadNpmTasks('grunt-text-replace');

  grunt.registerTask('test', 'Build, generate coverage, run tests.', function() {
    if (fs.existsSync('test-results')) {
      rimraf.sync('test-results');
    }
    fs.mkdirSync('test-results');

    process.env.multi = 'spec=- mocha-slow-reporter=test-results/slow.txt html-cov=test-results/coverage.html mocha-lcov-reporter=test-results/lcov.txt';
    grunt.config.set('mochaTest.lib.options.reporter', 'mocha-multi');

    // needed so that mocha-multi doesn't kill the process
    var program = require('mocha/node_modules/commander');
    program.name = 'mocha';
    program.exit = false;

    if (process.env.TRAVIS) {
      if (COVERALLS) {
        process.env.multi = 'mocha-unfunk-reporter=- mocha-lcov-reporter=test-results/lcov.txt';
        grunt.task.run(['build', 'mochaTest', 'replace:results', 'coveralls']);
      } else {
        grunt.config.set('mochaTest.lib.options.reporter', 'mocha-unfunk-reporter');
        grunt.task.run(['build', 'mochaTest']);
      }
    } else {
      grunt.task.run(['build', 'mochaTest', 'replace:results']);
    }
  });

  grunt.registerTask('coveralls', 'Push to Coveralls.', function() {
    this.requires('mochaTest');
    var done = this.async();
    cp.exec('cat ./test-results/lcov.txt | ./node_modules/.bin/coveralls', { cwd: './' }, function(err, stdout, stderr) {
      grunt.log.writeln(stdout + stderr);
      done(err);
    });
  });

  grunt.registerTask('build', function() {
    if (LINT) {
      grunt.task.run('jshint');
    }
  });

  grunt.registerTask('default', ['build']);
};
