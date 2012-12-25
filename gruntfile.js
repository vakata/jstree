/*global module:false, require:false, __dirname:false*/

module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    concat: {
      dist: {
        src: ['src/vakata.js', 'src/<%= pkg.name %>.js', 'src/<%= pkg.name %>.*.js'],
        dest: 'dist/<%= pkg.name %>.js'
      }
    },
    copy: {
      dist : {
        files : {
          'dist/themes/' : 'src/themes/**'
        }
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
    /*
    exec: {
      docs: {
        cmd : 'NaturalDocs.bat',
        args : "-i " + __dirname + "\\src\\ -o HTML " + __dirname + "\\docs\\ -p D:\\xampp\\_added\\NaturalDocs\\_projects\\jstree -s Default jstree -hl All",
        opts : { cwd: "D:\\xampp\\_added\\NaturalDocs\\" }
      },
      git: {
        cmd: "C:\\Program Files\\TortoiseGit\\bin\\TortoiseProc.exe",
        args: '/command:commit /path:' + __dirname + '\\ /notempfile /closeonend:0',
        opts : { cwd: __dirname }
      }
    },
    */
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
          'browser' : true
        }
      },
      beforeconcat: ['src/**/*.js'],
      afterconcat: ['dist/<%= pkg.name %>.js']
    }
  });

  grunt.registerMultiTask('exec', 'Execute tasks', function () {
    var done = this.async();
    this.data.args = this.data.args.split(' ');
    grunt.utils.spawn(this.data, function (r1,r2) {
      grunt.log.writeln(r2.stdout);
      grunt.log.writeln(r2.stderr);
      done();
    });
  });

  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-qunit');
  // Default task.
  grunt.registerTask('default', ['jshint:beforeconcat','concat','jshint:afterconcat','copy','uglify','qunit']);

};
