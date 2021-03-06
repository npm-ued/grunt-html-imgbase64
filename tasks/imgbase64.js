/*
 * grunt-inline-base64
 * https://github.com/npm-ued/grunt-inline-base64.git
 *
 * Copyright (c) 2014 npm-ued
 * Licensed under the MIT license.
 */

'use strict';
var path=require('path');
var httpSync = require('sync-request');
var DataUri = require('datauri');
var chalk = require('chalk');
var contentTypes={png:'image/png',gif:'image/gif',jpg:'image/jpeg',jpeg:'image/jpeg'};
var imgUrlReg=/<img.+?src=["']([^"']+?)["'].*?\/?\s*?>/gim;


module.exports = function (grunt) {
    // Please see the Grunt documentation for more information regarding task
    // creation: http://gruntjs.com/creating-tasks
    grunt.registerMultiTask('imgbase64', 'The best Grunt plugin ever.', function () {

        var options=this.options({exts:[],tag:'',maxLength:null}),
            dest = this.data.dest;
        this.files.forEach(function(file){
            var filepath = file.src[0];
            var fileType=path.extname(filepath).replace(/^\./, '');
            var fileContent=grunt.file.read(filepath);

            if(['html','htm','php','tpl','vm'].indexOf(fileType)>-1){
                fileContent=html(filepath,fileContent,options);
            }else if(fileType==='css'){
                fileContent=css(filepath,fileContent,options);
            }else{
                grunt.log.writeln("others type no operate");
            }
            var destFile=file.dest;
            grunt.file.write(destFile,fileContent);
            grunt.log.writeln(chalk.blue('Inline imageUrl with base64 data: ') + chalk.cyan(filepath) + ' → ' +
            chalk.cyan(destFile));
        });

    });

    function isRemotePath( url ){
        return url.match(/^'?https?:\/\//) || url.match(/^\/\//);
    }
    function isBase64Path( url ){
        return url.match(/^'?data.*base64/);
    }
    /**
     *
     * */
    function getPathToDestination(pathToSource, pathToDestinationFile) {
        var isDestinationDirectory = (/\/$/).test(pathToDestinationFile);
        var fileName = path.basename(pathToSource);
        var newPathToDestination;
        if (typeof pathToDestinationFile === 'undefined') {
            newPathToDestination = pathToSource;
        } else {
            newPathToDestination = pathToDestinationFile + (isDestinationDirectory ? fileName : '');
        }
        return newPathToDestination;
    }
    /**
     * 用base64数据编码替换url
     * @matchedWord 匹配的子串
     * @src 匹配串的图片地址
     * @filepath 当前被处理文件的路径
     * @options 配置参数
     * */
    function replaceUrlToBase64(matchedWord,src,filepath,options){
        var ret = matchedWord,fileType=path.extname(src).replace(/^\./, '').replace(/\?.*$/, '');//去除参数

        //验证过滤后缀名
        if(options.exts&&options.exts.indexOf(fileType)===-1){
            return ret;
        }
        //验证过滤tag
        if(options.tag && src.indexOf(options.tag)===-1){
            return ret;
        }
        //已经编码的放弃
        if(isBase64Path(src)){
            return ret;
        }

        if(isRemotePath(src)){
            ret = matchedWord.replace(src, getEncodedImage(src,fileType,options));
        }else {
            var inlineFilePath;
            if(!grunt.file.isPathAbsolute(src)){
                inlineFilePath = path.resolve( path.dirname(filepath), src ).replace(/\?.*$/, '');  // 将参数去掉
            }else{
                inlineFilePath=src;
            }
            if( grunt.file.exists(inlineFilePath) ){
                ret = matchedWord.replace(src, (new DataUri(inlineFilePath)).content);
            }else{
                grunt.log.error("Couldn't find " + inlineFilePath + '!');
            }
        }

        grunt.log.debug('ret = : ' + ret +'\n');

        return ret;
    }

    /**
     * 获取编码后的图片文件内容
     * @url 图片url，支持本地文件相对绝对路径，远程文件
     * @fileType 文件类型
     * @options 配置参数
     * */
    function getEncodedImage(url,fileType,options) {
        var request, response,
            urlParts = /([a-zA-Z]+):\/\/([a-zA-Z0-9._\-]+)(\/.*)/g.exec(url);
        if (!urlParts) {
            console.error('urlParts null!', url);
            return url; // in case of URL mismatch return current URL
        }
        // if(urlParts[1]==='https') {return url;}

        grunt.log.writeln('Downloading started...', url);
        response = httpSync(
            'GET',
            url,
            {headers:{}}
        );
        // request.setTimeout(1000, function () {
        //     //console.error('Request timed out!');
        //     grunt.log.writeln('File downloaded timed out!', url);
        //     return url; // in case of network error return current URL
        // });
        if(response && response.headers && response.body && contentTypes[fileType]===response.headers["content-type"]){
            grunt.log.writeln('File downloaded!', url);
            //response.body_length
            if(options.maxLength && response.body_length>(options.maxLength*1024)){
                grunt.log.writeln('This image size is greater then maxLength', url);
                return url;
            }
            return 'data:' + response.headers["content-type"] + ';base64,' + new Buffer(response.body).toString('base64');
        }else{
            return url;
        }
    }

    /**
     * 处理后缀为html的文件
     * @filepath 文件路径
     * */
    function html(filepath, fileContent, options){
        fileContent = fileContent.replace(imgUrlReg, function(matchedWord, src){
            return replaceUrlToBase64(matchedWord,src,filepath,options);
        });
        return fileContent;
    }
    /**
     * 处理后缀为css的文件
     * @filepath 文件路径
     * */
    function css(filepath, fileContent,  options) {
        fileContent = fileContent.replace(/url\(["']*([^)'"]+)["']*\)/g, function(matchedWord, imgUrl){
            return replaceUrlToBase64(matchedWord,imgUrl,filepath,options);
        });

        return fileContent;
    }
};

