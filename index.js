const readFile = require("fs").readFileSync;

const flSyn = require("fluent-syntax");
const glob = require("glob").sync;
const lint = require("htmllint");

/**
 * Lint a glob of files.
 * @param {string} g A glob of file(s) to lint.
 */
async function lintLocales(g) {
  try {
    if (!g) {
      throw new Error("Usage: $ npx pdehaan/fluent-html-lint './locales/*/app.ftl'");
    }
    const locales = glob(g);
    for (const locale of locales) {
      await lintLocale(locale);
    }
  } catch (err) {
    console.error(err.message);
    // eslint-disable-next-line no-process-exit
    process.exit(1);
  }
}

/**
 * Load a specific *.ftl file, convert it to JSON, then run each name/value pair through the HTML linter.
 * @param {string} locale A path to a *.ftl file to parse.
 */
async function lintLocale(locale) {
  const entries = ftlToJson(locale);

  // console.log(JSON.stringify(entries, null, 2));

  for (const entry of entries) {
    await lintHtml(locale, entry);
  }
}

/**
 * Convert an *.ftl file to JSON.
 * @param {string} ftlPath
 * @returns {array}
 */
function ftlToJson(ftlPath) {
  const ftl = readFile(ftlPath).toString();
  const body = flSyn.parse(ftl, {withSpans:false}).body;

  return body.map(entry => extract(entry))
    .filter(entry => !!entry);
}

/**
 * ??
 * @param {object} entry
 */
function extract(entry) {
  switch (entry.type) {
    case "GroupComment":
      // Ignore
      break;
    case "Message":
    case "Term":
      return _getString(entry);
    default:
      console.log("Unknown entry type:", entry.type);
      return {};
  }
}

/**
 * Loop over translations and make sure each name/value pair passes the HTML linter.
 * @param {string} locale Path to the *.ftl file we're currently linting.
 * @param {object} data Object w/ name/value pairs to lint. Note that in some cases .value may be an array of variations.
 */
async function lintHtml(locale, data) {
  if (Array.isArray(data.value)) {
    data.value.forEach(v => {
      // Recursive magic...
      lintHtml(locale, {name: `${v.name}[${v.variant || v.attribute}]`, value: v.value});
    });
  } else {
    const results = await lint(data.value + "\n", {
      "id-class-style": "dash",
      "spec-char-escape": false,
      "tag-bans": ["style", "i"]
    });
    if (results.length) {
      console.log(locale);
      results.forEach(err => {
        console.error(`  - [${err.code}] ${err.rule}: "${data.name} = ${data.value}"`);
      });
    }
  }
}

function _getPattern(name, value) {
  const variants = [];
  const str = value.elements.reduce((elements, element) => {
    switch (element.type) {
      case "Placeable": {
        const res = _getPlaceable(name, element.expression);
        if (Array.isArray(res)) {
          res.forEach(v => variants.push(v));
        } else {
          elements.push(res);
        }
        break;
      }
      case "TextElement":
        elements.push(element.value);
        break;
      default:
        console.error("Unknown value element type:", element.type);
    }
    return elements;
  }, []).join("").trim();
  if (variants.length) {
    return variants;
  }
  return str;
}

function _getPlaceable(name, expression) {
  switch (expression.type) {
    case "CallExpression":
      return ` { ${expression.callee.name}(...) } `;
    case "MessageReference":
      return ` $${expression.id.name} `;
    case "SelectExpression":
      return _getVariants(name, expression.variants);
    case "TermReference":
    case "VariableReference":
      return expression.id.name;
    case "VariantExpression":
      return expression.ref.id.name;
    default:
      console.error("Unknown element expression type:", expression.type);
      // console.log(expression);
  }
}

function _getString(data) {
  return {
    name: data.id.name,
    value: _getValue(data)
  };
}

function _getValue(data) {
  if (data.value) {
    switch (data.value.type) {
      case "Pattern":
        return _getPattern(data.id && data.id.name, data.value);
      case "VariantList":
        return _getVariants(data.id.name, data.value.variants);
      default:
        console.error("Unknown value type:", data.value.type);
    }
  }
  if (data.attributes) {
    return _getAttributes(data.id.name, data.attributes);
  }
}

function _getAttributes(name, attributes) {
  return attributes.map(attribute => {
    return {
      name,
      attribute: attribute.id.name,
      value: _getValue(attribute)
    };
  });
}

function _getVariants(name, variants) {
  return variants.map(variant => {
    return {
      name,
      variant: variant.key.name || variant.key.value,
      value: _getValue(variant)
    };
  });
}

module.exports = {
  ftlToJson,
  lintLocale,
  lintLocales
};
