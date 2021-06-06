/* global require */
var gulp = require("gulp");
var replace = require("gulp-replace");
var concat = require("gulp-concat");
// var uglify = require("gulp-uglify-es").default;
var minifycss = require("gulp-clean-css");
var header = require("gulp-header");
var pkg = require("./package.json");
var banner = [
    "/**",
    " * <%= pkg.name %> - <%= pkg.description %>",
    " * @version v<%= pkg.version %>",
    " * @link <%= pkg.homepage %>",
    " * @license <%= pkg.license %>",
    " */",
    ""
].join("\n");

gulp.task("js", function () {
    return gulp.src(["src/render/**/*.js","src/model/TreeNode.js","src/model/Tree.js","src/jstree.js","src/jstree.*.js","src/plugin/checkbox.js"])
        .pipe(concat("jstree.js"))
        .pipe(replace(/(import|export) [^;]*;/g, ""))
        //.pipe(uglify())
        .pipe(header(banner, { pkg : pkg } ))
        .pipe(gulp.dest("dist"));
});
gulp.task("css", function () {
    return gulp.src(["src/*.css","src/plugin/*.css"])
        .pipe(concat("jstree.css"))
        .pipe(gulp.dest("dist"));
});
gulp.task("minifyjs", gulp.series('js', function () {
    return gulp.src(["dist/jstree.js"])
        .pipe(concat("jstree.min.js"))
        // .pipe(uglify())
        .pipe(header(banner, { pkg : pkg } ))
        .pipe(gulp.dest("dist"));
}));
gulp.task("minifycss", gulp.series('css', function () {
    return gulp.src(["dist/jstree.css"])
        .pipe(concat("jstree.min.css"))
        .pipe(minifycss())
        .pipe(header(banner, { pkg : pkg } ))
        .pipe(gulp.dest("dist"));
}));

gulp.watch(["src/**/*.js", "src/**/*.css"], gulp.series("minifyjs", "minifycss"));

gulp.task("default", gulp.series("minifyjs", "minifycss"));
