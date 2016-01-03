var gulp = require('gulp');
var sync = require('browser-sync');
var rimraf = require('gulp-rimraf');
var concat = require('gulp-concat');
var minze = require('gulp-jsmin');

gulp.task('clean', function() {
    return gulp.src('www/*').pipe(rimraf());
});

gulp.task('html', function() {
    return gulp.src('app/**/*.html').pipe(gulp.dest('www')).pipe(sync.reload({stream:true}));
});

gulp.task('clean:scripts', function() {
    return gulp.src('www/js/*').pipe(rimraf());
});
gulp.task('scripts', ['clean:scripts'], function() {
    return gulp.src('app/js/**/*').pipe(gulp.dest('www/js')).pipe(sync.reload({stream:true}));
});

gulp.task('clean:images', function() {
    return gulp.src('www/images/*').pipe(rimraf());
});
gulp.task('images', ['clean:images'], function() {
    return gulp.src('app/images/**/*').pipe(gulp.dest('www/images')).pipe(sync.reload({stream:true}));
});

gulp.task('clean:styles', function() {
    return gulp.src('www/css/*').pipe(rimraf());
});
gulp.task('styles', ['clean:styles'], function() {
    return gulp.src('app/css/**/*').pipe(gulp.dest('www/css')).pipe(sync.reload({stream:true}));
});

gulp.task('deploy', ['clean'], function() {
    gulp.src(['app/**/*']).pipe(gulp.dest('www'));
});

gulp.task('jschardet', ['clean'], function() {
    gulp.src([
        'node_modules/jschardet/src/init.js',
        'node_modules/jschardet/src/constants.js',
        'node_modules/jschardet/src/codingstatemachine.js',
        'node_modules/jschardet/src/escsm.js',
        'node_modules/jschardet/src/mbcssm.js',
        'node_modules/jschardet/src/charsetprober.js',
        'node_modules/jschardet/src/mbcharsetprober.js',
        'node_modules/jschardet/src/jisfreq.js',
        'node_modules/jschardet/src/gb2312freq.js',
        'node_modules/jschardet/src/euckrfreq.js',
        'node_modules/jschardet/src/big5freq.js',
        'node_modules/jschardet/src/euctwfreq.js',
        'node_modules/jschardet/src/chardistribution.js',
        'node_modules/jschardet/src/jpcntx.js',
        'node_modules/jschardet/src/sjisprober.js',
        'node_modules/jschardet/src/utf8prober.js',
        'node_modules/jschardet/src/charsetgroupprober.js',
        'node_modules/jschardet/src/eucjpprober.js',
        'node_modules/jschardet/src/gb2312prober.js',
        'node_modules/jschardet/src/euckrprober.js',
        'node_modules/jschardet/src/big5prober.js',
        'node_modules/jschardet/src/euctwprober.js',
        'node_modules/jschardet/src/mbcsgroupprober.js',
        'node_modules/jschardet/src/sbcharsetprober.js',
        'node_modules/jschardet/src/langgreekmodel.js',
        'node_modules/jschardet/src/langthaimodel.js',
        'node_modules/jschardet/src/langbulgarianmodel.js',
        'node_modules/jschardet/src/langcyrillicmodel.js',
        'node_modules/jschardet/src/hebrewprober.js',
        'node_modules/jschardet/src/langhebrewmodel.js',
        'node_modules/jschardet/src/langhungarianmodel.js',
        'node_modules/jschardet/src/sbcsgroupprober.js',
        'node_modules/jschardet/src/latin1prober.js',
        'node_modules/jschardet/src/escprober.js',
        'node_modules/jschardet/src/universaldetector.js'])
        .pipe(concat('jschardet-min.js'))
        //.pipe(minze())
        .pipe(gulp.dest('www/extjs/'));
});

gulp.task('deploymobile', function() {
    gulp.src(['app/**/*']).pipe(gulp.dest('www'));

    gulp.src('platforms/android/assets/www/plugins/**').pipe(gulp.dest('www/android/plugins'));
    gulp.src('platforms/android/assets/www/cordova.js').pipe(gulp.dest('www/android'));
    gulp.src('platforms/android/assets/www/cordova_plugins.js').pipe(gulp.dest('www/android'));

    gulp.src('platforms/ios/www/plugins/**/*').pipe(gulp.dest('www/ios/plugins'));
    gulp.src('platforms/ios/www/cordova.js').pipe(gulp.dest('www/ios'));
    gulp.src('platforms/ios/www/cordova_plugins.js').pipe(gulp.dest('www/ios'));

    gulp.src('app/images/icon.png')
        .pipe(gulp.dest('platforms/android/res/drawable-ldpi'))
        .pipe(gulp.dest('platforms/android/res/drawable-mdpi'))
        .pipe(gulp.dest('platforms/android/res/drawable-hdpi'))
        .pipe(gulp.dest('platforms/android/res/drawable-xhdpi'));
});


gulp.task('serve', ['jschardet'], function(){
    gulp.src(['app/**/*']).pipe(gulp.dest('www'));
    gulp.src(['local/cedict_ts.u8', 'local/demo_ts.u8', 'local/numbers.mp4', 'local/numbers.vtt']).pipe(gulp.dest('www'));

    sync({
        port: 9900,
        open : false,
        ghostMode: false,
        notify: false,
        server: {
            baseDir: ['./www']
        }
    });

    gulp.watch('app/**/*.html', ['html']);
    gulp.watch('app/js/**/*.js', ['scripts']);
    gulp.watch('app/images/**/*', ['images']);
    gulp.watch('app/css/**/*', ['styles']);

    gulp.start();
});

