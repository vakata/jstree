/*global module:false, require:false, __dirname:false*/

module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    concat: {
      dist: {
        src: ['src/<%= pkg.name %>.js', 'src/<%= pkg.name %>.*.js'],
        dest: 'dist/<%= pkg.name %>.js'
      }
    },
    copy: {
      dist : {
        files : [
          { expand: true, cwd : 'src/themes/default/', src: ['*'], dest: 'dist/themes/default/' }
        ]
      }
    },
    uglify: {
      options: {
        banner: '/*! <%= pkg.title || pkg.name %> - v<%= pkg.version %> - <%= grunt.template.today("yyyy-mm-dd") %> - (<%= _.pluck(pkg.licenses, "type").join(", ") %>) */\n'
      },
      dist: {
        src: ['<%= concat.dist.dest %>'],
        dest: 'dist/<%= pkg.name %>.min.js'
      }
    },
    qunit: {
      files: ['test/**/*.html']
    },
    watch: {
      files: '<config:lint.files>',
      tasks: 'jshint qunit'
    },
    jshint: {
      options: {
        'curly' : true,
        'eqeqeq' : true,
        'latedef' : true,
        'newcap' : true,
        'noarg' : true,
        'sub' : true,
        'undef' : true,
        'boss' : true,
        'eqnull' : true,
        'browser' : true,
        'trailing' : true,
        'globals' : {
          'console' : true,
          'jQuery' : true,
          'browser' : true,
          'XSLTProcessor' : true,
          'ActiveXObject' : true
        }
      },
      beforeconcat: ['src/**/*.js'],
      afterconcat: ['dist/<%= pkg.name %>.js']
    },
    dox: {
      files: {
        src: ['src/*.js'],
        dest: 'docs'
      }
    }
  });

  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  //grunt.loadNpmTasks('grunt-contrib-qunit');


  grunt.registerMultiTask('dox', 'Generate dox output ', function() {
    
    var exec = require('child_process').exec,
        path = require('path'),
        done = this.async(),
        doxPath = path.resolve(__dirname),
        formatter = [doxPath, 'node_modules', '.bin', 'dox'].join(path.sep),
        str = grunt.file.read('dist/jstree.js');

    str = str.replace(/^\s+\*/mg,'*');
    str = str.replace(/^\s+\/\/ .*$/mg,'');
    grunt.file.write('dist/jstree.dox.js', str);

    exec(formatter + ' < "dist/jstree.dox.js" > "docs/jstree.json"', {maxBuffer: 5000*1024}, function(error, stout, sterr){
      if (error) {
        grunt.log.error(formatter);
        grunt.log.error("WARN: "+ error);
        grunt.file.delete('dist/jstree.dox.js');
      }
      if (!error) {
        grunt.log.writeln('dist/jstree.js doxxed.');
        grunt.file.delete('dist/jstree.dox.js');
        done();
      }
    });
  });

  // Default task.
  grunt.registerTask('default', ['jshint:beforeconcat','concat','jshint:afterconcat','copy','uglify',/*'qunit',*/'dox']);

};
