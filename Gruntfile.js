/*
 * grunt-inline-imgbase64
 * https://github.com/junlonghuo/grunt-inline-imgbase64
 *
 * Copyright (c) 2014 junlonghuo
 * Licensed under the MIT license.
 */

'use strict';

module.exports = function (grunt) {
  // load all npm grunt tasks
  require('load-grunt-tasks')(grunt);

  // Project configuration.
  grunt.initConfig({
    // Before generating any new files, remove any previously-created files.
    clean: {
      tests: ['tmp']
    },
    // Configuration to be run (and then tested).
    imgbase64: {
        options:{
            exts:['jpg','jpeg','png','gif'],
            tag:'__inline',
            maxLength:800 //设置编码远程图片的最大尺寸，超过maxLength时不转换，单位KB
        },
        dist: {
            // options:{
            //     removeComments:true,
            //     collapseWhitespace: true
            // },
            files:[{
                expand: true,
                cwd:"test",
                src:["**/*.*"],
                dest:"page"
            }]
            // src: ['test/**/**/*.html'],
            // dest: ['page/']
        }
        
    }  
});

  // Actually load this plugin's task(s).
  grunt.loadTasks('tasks');


  // Whenever the "test" task is run, first clean the "tmp" dir, then run this
  // plugin's task(s), then test the result.
  grunt.registerTask('test',["imgbase64"])
  // grunt.registerTask('test', ['clean', 'imgbase64'/*, 'nodeunit'*/]);

  // By default, lint and run all tests.
  grunt.registerTask('default', ['jshint', 'test']);

};
