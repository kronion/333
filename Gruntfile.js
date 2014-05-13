var exec = require('child_process').exec;
module.exports = function(grunt) {
  grunt.initConfig({
    concat: {
      options: {
        // Necessary to post-process with minifier
        separator: ';'
      },
      comments: {
        src: ['build/comments/*.js'],
        dest: 'public/js/loader.js'
      },
      front: {
        src: ['build/front/*.js'],
        dest: 'public/js/front.js'
      },
      newsfeed: {
        src: ['build/newsfeed/*.js'],
        dest: 'public/js/newsfeed.js'
      },
      pages: {
        src: ['build/pages/*.js'],
        dest: 'public/js/pages.js'
      },
      signup: {
        src: ['build/signup/*.js'],
        dest: 'public/js/signup.js'
      }
    },
    jshint: {
      options: {
        ignores: ['build/**/0-jquery.1.10.2.min.js', 'build/**/1-react.0.10.min.js', 'build/**/jquery-ui-1.10.4.custom.js']
      },
      files: ['*.js', 'models/*.js', 'build/**/*.js', 'routes/*.js'],
    },
    less: {
      production: {
        options: {
          cleancss: true
        },
        files: {
          'public/css/style.css': 'less/style.less'
        }
      }
    },
    watch: {
      scripts: {
        files: ['<%= jshint.files %>'],
        tasks: ['jshint', 'concat']
      },
      style: {
        files: ['less/style.less'],
        tasks: ['less']
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

  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-less');
  grunt.loadNpmTasks('grunt-contrib-watch');
};
