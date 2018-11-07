#!/usr/bin/env node

const {lintLocales} = require("./index");

const [, , ...argv] = process.argv;

// Usage: $ npx pdehaan/ftl-htmllint './locales/*/app.ftl'
lintLocales(argv);
