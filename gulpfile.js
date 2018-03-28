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

const scripts = [
    './node_modules/jquery/dist/jquery.min.js',
    './node_modules/slick-carousel/slick/slick.min.js'
];

const path = {
    dev: {
        html: 'src/*.html',
        scss: 'src/scss/**/*.scss',
        js: 'src/js/**/*.js',
        img: 'src/img/*'
    },
    dist: {
        html: 'dist',
        css: 'dist/css',
        js: 'dist/js',
        img: 'dist/img'
    }
}

/**
 * Development setup
 */

gulp.task('serve', ['vendor', 'compile:es6', 'compile:scss'], function () {
    browserSync.init({
        server: {
            baseDir: './',
            index: './src/index.html'
        }
    });

    gulp.watch(path.dev.scss, ['compile:scss']);
    gulp.watch(path.dev.html, browserSync.reload);
    gulp.watch(path.dev.js, ['compile:es6', browserSync.reload]);
});

gulp.task('compile:scss', function () {
    return gulp
        .src(path.dev.scss)
        .pipe(sourcemaps.init())
        .pipe(sass({ errLogToConsole: true, outputStyle: 'expanded' }).on('error', sass.logError))
        .pipe(sourcemaps.write())
        .pipe(postcss([autoprefixer()]))
        .pipe(gulp.dest(path.dist.css))
        .pipe(browserSync.stream());
});



gulp.task('compile:es6', function () {
    return gulp.src(path.dev.js)
        .pipe(babel({ presets: ['env'] }))
        .on('error', function (error) {
            console.log(error.toString());
            this.emit('end')
        })
        .pipe(concat('main.js'))
        .pipe(gulp.dest(path.dist.js));
});

gulp.task('clean', function () {
    return gulp.src(path.dist.html, { read: false })
        .pipe(clean());
});

/**
 * Deploy setup
 */

gulp.task('minify:html', function () {
    return gulp
        .src(path.dev.html)
        .pipe(htmlreplace({
            'css': './css/main.css',
            'js': ['./js/vendor.js', './js/main.js']
        }))
        .pipe(htmlmin({ collapseWhitespace: true, collapseInlineTagWhitespace: true, removeComments: true }))
        .pipe(gulp.dest(path.dist.html));
});

gulp.task('minify:css', function () {
    return gulp
        .src(path.scss)
        .pipe(sass({ errLogToConsole: true, outputStyle: 'compressed' }).on('error', sass.logError))
        .pipe(postcss([autoprefixer()]))
        .pipe(gulp.dest(path.dist.css));
});

gulp.task('vendor', function () {
    return gulp.src(scripts)
        .pipe(concat('vendor.js'))
        .pipe(gulp.dest(path.dist.js));
});

gulp.task('minify:js', function () {
    return gulp.src(path.dev.js)
        .pipe(babel({ presets: ['env'] }))
        .pipe(concat('main.js'))
        .pipe(uglify())
        .pipe(gulp.dest(path.dist.js));
});

gulp.task('minify:img', function () {
    return gulp.src(path.dev.img)
        .pipe(imagemin())
        .pipe(gulp.dest(path.dist.img));
});

gulp.task('surge', ['minify:html', 'minify:img', 'minify:css', 'vendor', 'minify:js'], function () {
    return surge({
        project: path.dist.html,
        domain: 'my-domain.surge.sh'
    })
});

/**
 * Main tasks
 */

gulp.task('deploy', ['surge']);
gulp.task('default', ['serve']);
