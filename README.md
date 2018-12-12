# reregexp

[![npm version](https://badge.fury.io/js/reregexp.svg)](https://badge.fury.io/js/reregexp)&nbsp;&nbsp;[![Build Status](https://travis-ci.org/suchjs/reregexp.svg?branch=master)](https://travis-ci.org/suchjs/reregexp)

reverse analysis regexp,parse to ast,get a string match it.

## How to use
```bash
npm install --save reregexp
```
```javascript
import RegexpParser from 'reregexp';
const parser = new RegexpParser('/(a)\\1(?<named>b)\\k<named>(?<override>\\w+)/',{
  namedGroupConf:{
    override: ['cc','dd']
  }
});
parser.build();
// result =>
// "aabbcc" or "aabbdd"

```
## API
`.build()` build a string that match the regexp.

`.info()` get an regexp parse queues,flags,lastRule after remove named captures.
```javascript
{
  rule: '',
  context: '',
  flags: [],
  lastRule: '',
  queues: [],
}
```
## Build precautions,do not use any regexp anchors.
1. `^` `$` the start,end anchors will be ignored.
2. `(?=)` `(?!)` `(?<=)` `(?<!)` the regexp lookhead,lookbehind will throw an error when run `build()`.
3. `\b` `\B` will be ignored.

## Questions & Bugs?
Welcome to report to us with issue if you meet any question or bug. [Issue](https://github.com/suchjs/reregexp/issues)

## License
[MIT License](./LICENSE).