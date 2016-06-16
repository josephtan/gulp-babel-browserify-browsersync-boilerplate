/**
 * Created by Joseph Tan on 7/06/2016.
 */

var gulp = require("gulp"),
    path = require("path"),
    del = require('del'),
    rename  = require('gulp-rename'),
    concat = require('gulp-concat'),
    uglify = require ('gulp-uglify'),
    plumber = require('gulp-plumber'),
    clean = require('gulp-clean'),
    order = require ('gulp-order'),
    babel = require ('gulp-babel'),
    gulpif = require('gulp-if'),
    files = require('vinyl-source-stream'),
    browserify = require('browserify'),
    babelify = require ('babelify'),
    gutil = require('gulp-util'),
    exorcist = require('exorcist'),
    buffer = require('gulp-buffer'),
    argv = require('yargs').argv;
    browserSync = require('browser-sync').create();

var ENTRY_FILE = path.resolve(paths().source.jssrc) + "\\main.js";
function paths() {
    return require('./config.json').paths;
}


function isProduction() {
    // Easier to modify in the future.
    return argv.production;
}

gulp.task('clean', function (cb) {
    del.sync([path.resolve(paths().compiled.template, '*')], {force: true});
    cb();
});

/**
 ############ COPY TASKS #############
**/

gulp.task('cp:template',function(){
    return gulp.src(
        ['**/*.html'],
        {cwd: path.resolve(paths().source.root)})
        .pipe(gulp.dest(path.resolve(paths().compiled.root)));
});



/**
 *  ############ Copy javascript source files ############
 */

gulp.task('cp:js',function(){
    //gulp.src('**/**/*.js', {cwd: path.resolve(paths().source.jssrc)})

    if (isProduction()) {
        gutil.log(gutil.colors.green('Running production build...'));
    } else {
        gutil.log(gutil.colors.yellow('Running development build...'));
    }

    return browserify({
        entries: ENTRY_FILE,
        debug: true
    })
        .transform("babelify", {presets: ["es2015"]})
        .bundle().on('error', function(error){
            gutil.log(gutil.colors.red('[Build Error]', error.message));
            this.emit('end');
        })
        .pipe(files("main.js"))
        .pipe(buffer())
        .pipe(gulpif(isProduction(), uglify()))
        .pipe(gulp.dest(path.resolve(paths().compiled.jssrc)))

});


/***
 * ##### Copy javascript vendor files #############
 */

gulp.task('cp:jsvendor',function () {
    return gulp.src('**/**/*.js', {cwd: path.resolve(paths().source.jsvendor)})
        .pipe(gulp.dest(path.resolve(paths().compiled.jsvendor)));

});

/**
 *  ############ Copy image files ############
 */

gulp.task('cp:img', function () {
    return gulp.src(
        ['**/*.gif', '**/*.png', '**/*.jpg', '**/*.jpeg','**/*.svg'],
        {cwd: path.resolve(paths().source.images)})
        .pipe(gulp.dest(path.resolve(paths().compiled.images)));
});


gulp.task('compile-pipe', ['compile'], function (cb) {
    cb();
    browserSync.reload();
});


// server and watch tasks
gulp.task('connect', ['compile'], function () {
    browserSync.init({
        server: {
            baseDir:[path.resolve(paths().compiled.template),path.resolve(paths().compiled.root) ]
        }
    });
    gulp.watch(path.resolve(paths().source.template, '**/*.html'), ['cp:template']);
    gulp.watch(path.resolve(paths().source.jssrc, '**/*.js'),['cp:js']);
    gulp.watch(path.resolve(paths().source.json, '**/*.json'),['cp:json']);
    gulp.watch(browserSync.reload());
});

gulp.task('compile-pipe', ['compile'], function (cb) {
    cb();
    browserSync.reload();
});

gulp.task('default', ['compile']);
gulp.task('assets', ['cp:template','cp:jsvendor','cp:js', 'cp:img']);
gulp.task('pre-compile', ['clean', 'assets']);
gulp.task('compile', ['pre-compile'], function (cb) { cb(); });
gulp.task('serve', ['compile', 'connect']);
