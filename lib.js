const readFileSync = require("fs").readFileSync;
const promisify = require("util").promisify;

const {parse} = require("fluent-syntax");
const _glob = require("glob");
const lint = require("htmllint");

const glob = promisify(_glob);

/**
 * Converts an .ftl file into a JSON object.
 * @param {string} p A path to an .ftl file to load and parse into a JSON blob.
 * @returns {object}
 */
function ftlToJson(p) {
  const str = readFileSync(p, "utf-8");
  return parse(str).body;
}

/**
 * Converts the specified .ftl file into JSON and runs the htmllint linter against each string.
 * @param {string} p A path to an .ftl file to lint.
 * @returns {null}
 */
async function lintLocale(p) {
  const strings = ftlToJson(p);
  for (const item of strings) {
    if (item.type === "GroupComment") return;

    // The "ru" translation has a non-standard `-brand-HIBP` which was causing
    // `item.value.elements` to be null and throw errors when calling `.map()`.
    if (!Array.isArray(item.value.elements)) return;

    // If there was no simple text `el.value` it seems to be some ftl variable, so
    // just replace it with a silly "{?}" placeholder because what does life matter.
    const str = item.value.elements.map(el => el.value || "{?}").join("");
    const errors = await lint(str + "\n");
    if (errors.length) {
      console.log(p);
      errors.forEach(err => {
        console.error(`  - [${err.code}] ${err.rule}: "${item.id.name} = ${str}"`);
      });
    }
  }
}

/**
 * Loop over a glob of files to run the htmllint linter against.
 * @param {string} g A glob of .ftl files to lint.
 * @returns {null}
 */
async function lintLocales(globs) {
  if (!globs.length) {
    console.info("\n\nUSAGE: `$ npx pdehaan/ftl-htmllint './locales/*/app.ftl'`\n\n");
    return;
  }
  for (const g of globs) {
    try {
      const locales = await glob(g);
      for (const locale of locales) {
        await lintLocale(locale);
      }
    } catch (err) {
      console.error(err);
      process.exitCode = 1;
    }
  }
}

module.exports = {
  ftlToJson,
  lintLocale,
  lintLocales
};
