'use strict';
exports.TEST_DATABASE_URL = process.env.TEST_DATABASE_URL || 'mongodb://localhost/blogposts';
exports.DATABASE_URL = process.env.DATABASE_URL || 'mongodb://maxemil:abc123@ds121341.mlab.com:21341/blog-challenge-with-ci';
exports.PORT = process.env.PORT || 8080;