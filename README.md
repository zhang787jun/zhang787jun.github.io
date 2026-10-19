# Jim · 知识与实践

Personal homepage: https://zhang787jun.github.io/

The live knowledge collection is generated separately at https://zhang787jun.github.io/Wiki/ from [the Wiki repository](https://github.com/zhang787jun/Wiki). This repository keeps the root homepage and historic root article URLs. Existing article files are preserved.

## Editing

- `index.html`: introduction, four knowledge topics, reading entry points, verified public projects, and contact links.
- `assets/space.css`: shared responsive design tokens and styles, including light/dark, reduced-motion, and print behavior.
- `assets/space.js`, `search-core.js`, `theme.js`: search/reader enhancements and theme preference. Their canonical copies are maintained in `Wiki/themes/simple/static/js/`; keep shared copies in sync.
- `404.html`: recovery link to the searchable Wiki.
- `.nojekyll`: serve the repository as static files without Jekyll transforms.

There is no bundler, package installation, external font service or client framework requirement. Search fetches the Wiki's generated public full-text index on first use. The homepage itself contains no personal/private project records beyond information already on the public GitHub profile and public repository READMEs.

## Deployment

The repository's existing GitHub Pages publishing configuration serves `master`. Check its Pages build/deployment after merging changes. To revert the redesign, revert the associated PR merge rather than deleting the repository or article directories.

Local verification checks homepage assets and cross-repository Wiki entry points against the generated Wiki output. Browser visual QA was unavailable during the initial implementation; do not treat static checks as a screenshot review.
