const gulp = require('gulp');
const ts = require('gulp-typescript');
const { spawn } = require('child_process');
const mocha = require('gulp-mocha');
const process = require('process');
const fs = require('fs');

const tsProject = ts.createProject('tsconfig.json');

var node;

gulp.task('server', ['build'], function() {
    if (node) node.kill()
    let serverParams = ['dist/app/index.js'];
    
    node = spawn('node', serverParams, {stdio: 'inherit'})
    node.on('close', function (code) {
        if (code === 8) {
            gulp.log('Error detected, waiting for changes...');
        }
    });
});

gulp.task('build', () => {
    return gulp.src(['./src/**/*.ts']) 
        .pipe(tsProject())
        .js.pipe(gulp.dest('dist'));
});

gulp.task('test', ['build'], () => {
    return gulp.src('dist/test/**/*.js', { read: false })
        .pipe(mocha({ reporter: 'spec' }));
});

gulp.task('watch', ['server'], () => {
    return gulp.watch('src/**/*', ['test', 'server']);
});

gulp.task('default', ['build']);
