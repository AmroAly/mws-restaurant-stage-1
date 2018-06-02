
var gulp = require('gulp');
var concat = require('gulp-concat');
var uglify = require('gulp-uglify');
var pump = require('pump');
var babel = require('gulp-babel');

gulp.task('concat', function() {
    gulp.src('js/*js')
    .pipe(babel({
        presets: ['env', 'stage-3']
    }))
    .pipe(concat('main.js'))
    .pipe(gulp.dest('./dest'))
});

gulp.task('compress', function (cb) {
    pump([
          gulp.src('dest/*.js'),
          uglify(),
          gulp.dest('build')
      ],
      cb
   );
});
  