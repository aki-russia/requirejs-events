module.exports = function(grunt) {
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-coffee');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-jasmine');

  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),

    // jasmine: {
    //   unit: {
    //     src: "dist/mangra.js",
    //     options: {
    //       keepRunner: true,
    //       specs: 'spec/*_spec.js',
    //       // vendor: 'spec/vendor/*.js'
    //       helpers: ['spec/**/**_fixture.js']
    //     }
    //   }
    // },

    clean: {
      tmp: ['_tmp']
    },

    uglify: {
      javascripts: {
        files: {
          'dist/mangra.min.js': [
            'dist/mangra.js'
          ]
        }
      }
    },

    coffee: {
      compile: {
        files: {
          'dist/mangra.js': 'src/mangra.coffee'
        },
        options: {
          bare: true
        }
      }
    },

    watch: {
      scripts: {
        files: ['src/mangra.coffee', 'spec/**/**.js'],
        tasks: ['compile'],
        options: {
          atBegin: true
        }
      }
    },

    jshint: {
      all: 'dist/mangra.js',
      options: {
        reporter: 'jslint',
        reporterOutput: '../javascriptslint.xml'
      }
    }

  });

  grunt.event.on('watch', function(action, filepath, target) {
    grunt.log.writeln(target + ': ' + filepath + ' has ' + action);
  });

  grunt.registerTask('compile', ['clean', 'coffee']);
  grunt.registerTask('build', ['compile', 'uglify']);
  grunt.registerTask('test', ['compile', 'jasmine:unit']);

};
