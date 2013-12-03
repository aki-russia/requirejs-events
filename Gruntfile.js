module.exports = function(grunt) {
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-coffee');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-jasmine');
  grunt.loadNpmTasks('grunt-contrib-copy');

  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),

    jasmine: {
      unit: {
        src: "dist/mangra.js",
        options: {
          keepRunner: false,
          specs: 'spec/*_spec.js',
          vendor: ['dist/lib/batch.js', 'dist/lib/ui-guid-generator.js']
          // helpers: ['spec/**/**_fixture.js']
        }
      }
    },

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

    copy: {
      scripts: {
        expand: true,
        flatten: true,
        src: '**/dist/*.js',
        dest: 'dist/lib/',
        cwd: 'components/'
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

  grunt.registerTask('compile', ['clean', 'coffee', 'copy']);
  grunt.registerTask('build', ['compile', 'uglify']);
  grunt.registerTask('test', ['compile', 'jasmine:unit']);

};
