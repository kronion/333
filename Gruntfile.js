var exec = require('child_process').exec;
module.exports = function(grunt) {
  grunt.initConfig({
    jshint: {
      files: ['*.js', 'models/*.js', 'routes/*.js'],
      options: {
      }
    },
    watch: {
      scripts: {
        files: ['<%= jshint.files %>'],
        tasks: ['jshint']
      },
      modules: {
        files: ['node_modules/**/README*'], //'node_modules/*/Readme*'],
        tasks: ['shrinkwrap']
      }
    }
  });

  grunt.registerTask('shrinkwrap', 'Automatically rerun npm shrinkwrap', 
                      function () {
    var done = this.async();
    grunt.log.writeln("Changes detected in node_modules.");
    grunt.log.writeln("Shrinkwrap will occur automatically in 30 seconds.");
    grunt.log.writeln("If package updates have not completed" +
      " by the time I alert that shrinkwrap has initiated,"); 
    grunt.log.writeln("you may have to run 'npm shrinkwrap' manually.");
    setTimeout(function() {
      var child = exec('npm shrinkwrap &> /dev/null',  { cwd: process.cwd() },
                        function (error, stdout, stderr) {
        if (error !== null) {
          grunt.log.writeln('shrinkwrap error: ' + error);
        }
        else {
          grunt.log.writeln('stdout: ' + stdout);
          grunt.log.writeln('stderr: ' + stderr);
        }
      });
      grunt.log.writeln('ALERT: shrinkwrap initialized!');
      done();
    }, 30000);
  });

  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-watch');
};
