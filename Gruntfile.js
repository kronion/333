module.exports = function(grunt) {
  grunt.initConfig({
    jshint: {
      files: ['*.js', 'models/*.js', 'routes/*.js'],
      options: {
      }
    },
    watch: {
      files: ['<%= jshint.files %>'],
      tasks: ['jshint']
    }
  });

  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-watch');
};
