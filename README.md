# reregexp

[![npm version](https://badge.fury.io/js/reregexp.svg)](https://badge.fury.io/js/reregexp)&nbsp;&nbsp;[![Build Status](https://travis-ci.org/suchjs/reregexp.svg?branch=master)](https://travis-ci.org/suchjs/reregexp)
[![Coverage Status](https://coveralls.io/repos/github/suchjs/reregexp/badge.svg?branch=master)](https://coveralls.io/github/suchjs/reregexp?branch=master)

Parse a regular expression to rule parts, and build a string match it.You can use it to mock a string with the given regular expression.

reregexp 主要用来解析正则表达式，根据正则表达式生成一个相匹配的随机字符串。

## How to use

```bash
npm install --save reregexp
```

```javascript
import RegexpParser from 'reregexp';
const r1 = new RegexpParser(/([a-z0-9]{3})_\1/);
r1.build();
// will ouput random string like this: 'a2z_a2z', '13d_13d'
const r2 = new RegexpParser(/(?<named>\w{1,2})_\1_\k<named>/);
r2.build();
// will output random string like this: 'b5_b5_b5', '9_9_9'
const r3 = new RegexpParser('/(a)\\1(?<named>b)\\k<named>(?<override>\\w+)/', {
  namedGroupConf: {
    override: ['cc', 'dd'],
  },
});
r3.build();
// will output random string "aabbcc" or "aabbdd"
const r4 = new RegexpParser(/[^\w\W]+/);
r4.build();
// will throw error, because the [^\w\W] will match nothing.
const r5 = new RegexpParser(/[^a-zA-Z0-9_\W]/);
r5.build();
// will throw error, this is the same as [^\w\W]
const r6 = new RegexpParser(/[a-z]{3}/i);
r6.build();
// will output random string like this: 'bZD' 'Poe'
```

## API

`.build()` build a string that match the regexp.

`.info()` get a regexp parsed queues, flags, lastRule after remove named captures.

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
