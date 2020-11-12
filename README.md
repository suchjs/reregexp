# reregexp

[![npm version](https://badge.fury.io/js/reregexp.svg)](https://badge.fury.io/js/reregexp)&nbsp;&nbsp;[![Build Status](https://travis-ci.org/suchjs/reregexp.svg?branch=master)](https://travis-ci.org/suchjs/reregexp)
[![Coverage Status](https://coveralls.io/repos/github/suchjs/reregexp/badge.svg?branch=master)](https://coveralls.io/github/suchjs/reregexp?branch=master)

Parse a regular expression to rule parts, and build a string match it. You can use it to mock a string with the given regular expression. it strictly abide by the real RegExp rules of the javascript language.Please see the[Special cases](#special-cases)

reregexp 主要用来解析正则表达式，根据正则表达式生成一个相匹配的随机字符串。

## How to use

```bash
npm install --save reregexp
```

```javascript
const RegexpParser = require('reregexp').default;
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
RegexpParser.maxRepeat = 10;
const r7 = new RegexpParser(/a*/); // 'a' will repeated at most 10 times.
// will output: 'aaaaa'
const r8 = new RegexpParser(/a*/, {
  maxRepeat: 20, // 'a' will repeated at most 20 times
});
```

## Supported flags

- `i` ignore case, `/[a-z]/i` is same as `/[a-zA-Z]/`

- `u` unicode flag

- `s` dot all flag

the flags `g` `m` `y` will ignore.

## API

`.build()`

build a string that match the regexp.

`.info()`

get a regexp parsed queues, flags, lastRule after remove named captures.

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

## Special cases

1. `/\1(o)/` the capture group `\1` will match nothing, the `build()` will just output `o`, and `/^\1(o)$/.test('o') === true`

2. `/(o)\1\2/` the capture group `\2` will treated as code point of unicode. so the `build()` will output `oo\u0002`. `/^(o)\1\2$/.test('oo\u0002') === true`

3. `/[]/` empty character class, the `build()` method will throw an error, because no character will match it.

4. `/[^]/` negative empty character class, the `build()` method will output any character.

5. `/[^\w\W]/` for the negative charsets, if all the characters are eliminated, the `build()` will throw an error. the same such as `/[^a-zA-Z0-9_\W]/`、`/[^\s\S]/`...

## Questions & Bugs?

Welcome to report to us with issue if you meet any question or bug. [Issue](https://github.com/suchjs/reregexp/issues)

## License

[MIT License](./LICENSE).
