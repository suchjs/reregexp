# Changelog

The changelog of the reregexp library.

## [1.5.0] - 2021-05-19

### Added

- Support unicode property class syntax, e.g. `\p{Letter}`, more details have shown in README.

## [1.4.0] - 2021-05-16

### Added

- Add `capture` config field, if you care about the result of the regexp group data. Also add tests for this feature.

### Changed

- Optimize some regexp rules of the parser.
- Change the default export library name from 'RegexpParser' to `ReRegExp` in browser.
- Make the readme more clearly.
- Upgrade the typescript and other tools dependencies versions.
