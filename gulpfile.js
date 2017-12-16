/**
 * File: gulpfile.js
 * @desc Gulp configuration
 * @author Vuk Samardžić <samardzic.vuk@gmail.com>
 */

const gulp              = require('gulp');
const browserSync       = require('browser-sync').create();
const sass              = require('gulp-sass');
const watch             = require('gulp-watch');
const postcss           = require('gulp-postcss');
const sourcemaps        = require('gulp-sourcemaps');
const autoprefixer      = require('autoprefixer');
const concat            = require('gulp-concat');
const uglify            = require('gulp-uglify');
const htmlmin           = require('gulp-htmlmin');
const surge             = require('gulp-surge');
const htmlreplace       = require('gulp-html-replace');
const babel             = require('gulp-babel');
const clean             = require('gulp-clean');
const imagemin          = require('gulp-imagemin');


const scripts =
    [
        './node_modules/jquery/dist/jquery.min.js',
        './node_modules/slick-carousel/slick/slick.min.js'
    ];

/**
 * Development setup
 */

gulp.task('serve', ['vendor', 'compile:es6' ,'compile:scss'], function()
{
    browserSync.init({ server: './' });

    gulp.watch('scss/**/*.scss', ['compile:scss']);
    gulp.watch('*.html', browserSync.reload);
    gulp.watch('js/**/*.js', ['compile:es6', browserSync.reload]);
});

gulp.task('compile:scss', function()
{
    return gulp
        .src('scss/**/*.scss')
        .pipe(sourcemaps.init())
        .pipe(sass({errLogToConsole: true, outputStyle: 'expanded'}).on('error', sass.logError))
        .pipe(sourcemaps.write())
        .pipe(postcss([ autoprefixer() ]))
        .pipe(gulp.dest('./dist/css'))
        .pipe(browserSync.stream());
});

function swallowError (error)
{
    console.log(error.toString());
    this.emit('end')
}

gulp.task('compile:es6',  function()
{
    return gulp.src('./js/**/*.js')
        .pipe(babel({presets: ['babel-preset-es2015']}))
        .on('error', swallowError)
        .pipe(concat('main.js'))
        .pipe(gulp.dest('./dist/js'));
});

gulp.task('clean',  function()
{
    return gulp.src('./dist', {read: false})
        .pipe(clean());
});

/**
 * Deploy setup
 */

gulp.task('minify:html', function()
{
    return gulp
        .src('*.html')
        .pipe(htmlreplace({
            'css': './css/main.css',
            'js': ['./js/vendor.js','./js/main.js']
        }))
        .pipe(htmlmin({collapseWhitespace: true, collapseInlineTagWhitespace: true, removeComments: true}))
        .pipe(gulp.dest('./dist'));
});

gulp.task('minify:css', function()
{
    return gulp
        .src('scss/**/*.scss')
        .pipe(sass({errLogToConsole: true, outputStyle: 'compressed'}).on('error', sass.logError))
        .pipe(postcss([ autoprefixer() ]))
        .pipe(gulp.dest('./dist/css'));
});

gulp.task('vendor',  function()
{
    return gulp.src(scripts)
        .pipe(concat('vendor.js'))
        .pipe(gulp.dest('./dist/js'));
});

gulp.task('minify:js',  function()
{
    return gulp.src('./js/**/*.js')
        .pipe(babel({presets: ['babel-preset-es2015']}))
        .pipe(concat('main.js'))
        .pipe(uglify())
        .pipe(gulp.dest('./dist/js'));
});

gulp.task('minify:image', function ()
{
    return gulp.src('./image/*')
        .pipe(imagemin())
        .pipe(gulp.dest('./dist/image'));
});

gulp.task('surge', ['minify:html', 'minify:image', 'minify:css', 'vendor', 'minify:js'], function ()
{
    return surge({
        project: './dist',
        domain: 'my-domain.surge.sh'
    })
});

/**
 * Main tasks
 */

gulp.task('deploy', ['surge']);
gulp.task('default', ['serve']);