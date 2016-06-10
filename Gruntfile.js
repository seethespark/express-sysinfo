var path = require('path');

module.exports = function (grunt) {

  var commitMessage = grunt.option('m') || 'Grunt commit';
  grunt.initConfig({
    tape: {
      options:  {
        pretty: true,
        output: 'console'
      },
      files: ['test/*.js']
    }
  });
  // Dependencies
  grunt.loadNpmTasks('grunt-tape');

  // Default tasks
  grunt.registerTask('test', ['tape']);
};

