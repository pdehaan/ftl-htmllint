# ftl-htmllint

A really bad(tm) HTML linter for .ftl files.

## Usage

```sh
$ npx pdehaan/ftl-htmllint './locales/*/app.ftl'
```

### Output

```sh
$ npx pdehaan/ftl-htmllint './locales/*/app.ftl'

./locales/es-AR/app.ftl
  - [E042] tag-close: "featured-breach-results[one] = Tu cuenta apareció en la violación de <span class="bold"> así como en otra violación."
```
