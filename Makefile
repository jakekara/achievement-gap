bundle:
	browserify src/schoolgaps.js -o js/schoolgaps.bundle.js
	uglifyjs js/schoolgaps.bundle.js -o js/schoolgaps.bundle.min.js

