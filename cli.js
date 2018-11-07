"use strict";

const {lintLocales} = require("./lib");

const [, , ...argv] = process.argv;

// Usage: $ npx pdehaan/ftl-htmllint './locales/*/app.ftl'
lintLocales(argv);
