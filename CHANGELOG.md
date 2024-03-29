# Changelog

The changelog of the reregexp library.

## [1.6.1] - 2023-05-21

### Added

- Add ESM module export support.

## [1.6.0] - 2022-05-09

### Added

- Add `charactersOfAny` config, you can either set a global config with the static property `ReRegExp.charactersOfAny` or with a `ParserConf` for an instance `new ReRegExp(context, { charactersOfAny })`, it let you can define which characters can be generated by a `.` character class.

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
