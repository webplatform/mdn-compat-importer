var fs = require('fs');
var cp = require('child_process');
var rimraf = require('rimraf');
var istanbul = require('istanbul');

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
        src: ['test/**/*.js', '!test/init.js', '!test/_fixtures/**']
      }
    }
  });

  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-mocha-test');

  grunt.registerTask('test', 'Build, generate coverage, run tests.', function() {
    if (fs.existsSync('test-results')) {
      rimraf.sync('test-results');
    }
    fs.mkdirSync('test-results');

    process.env.multi = 'spec=- mocha-slow-reporter=test-results/slow.txt';
    grunt.config.set('mochaTest.lib.options.reporter', 'mocha-multi');

    // needed so that mocha-multi doesn't kill the process
    var program = require('mocha/node_modules/commander');
    program.name = 'mocha';
    program.exit = false;

    grunt.task.run(['build', 'mochaTest', 'covreport']);
    if (process.env.TRAVIS) {
      grunt.config.set('mochaTest.lib.options.reporter', 'mocha-unfunk-reporter');
      if (COVERALLS) {
        grunt.task.run(['coveralls']);
      }
    }
  });

  grunt.registerTask('covreport', 'Generate coverage reports.', function() {
    var collector = new istanbul.Collector();
    collector.add(global.__coverage__);
    var reports = [
      istanbul.Report.create('lcovonly', { dir: 'test-results' })
    ];
    if (process.env.TRAVIS) {
      // show per-file coverage stats in the Travis console
      reports.push(istanbul.Report.create('text'));
    } else {
      // produce HTML when not running under Travis
      reports.push(istanbul.Report.create('html', { dir: 'test-results' }));
    }
    reports.push(istanbul.Report.create('text-summary'));
    reports.forEach(function(report) {
      report.writeReport(collector, true);
    });
  });

  grunt.registerTask('coveralls', 'Push to Coveralls.', function() {
    this.requires('mochaTest');
    var done = this.async();
    cp.exec('cat ./test-results/lcov.info | ./node_modules/.bin/coveralls', { cwd: './' }, function(err, stdout, stderr) {
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
