import ReRegExp, {
  ParserConf,
  CharsetHelper,
  UnicodeCategoryData,
} from '../src/index';
type Rule = RegExp | string;
const validParser = (rule: Rule) => {
  return () => {
    try {
      new ReRegExp(rule);
    } catch (e) {
      throw e;
    }
    return true;
  };
};
const validMatch = (rule: RegExp) => {
  return rule.test(new ReRegExp(rule).build());
};
const validValue = (rule: Rule, conf: ParserConf = {}) => {
  const re = new ReRegExp(rule, conf);
  return re.build();
};
const validInput = (rule: Rule): boolean => {
  return (
    new ReRegExp(rule).lastRule ===
    (rule instanceof RegExp
      ? rule.source
      : rule.replace(/^\//, '').replace(/\/[imguys]*$/, ''))
  );
};
const mustIn = (
  values: string[],
  rule: Rule,
  conf: ParserConf = {},
): boolean => {
  for (let i = 0; i < RUNTIMES; i++) {
    const value = validValue(rule, conf);
    if (!values.includes(value)) return false;
  }
  return true;
};
const RUNTIMES = 1e3;
const run = (() => {
  let matchedTimes: number;
  let i: number;
  return (fn: () => boolean): number => {
    matchedTimes = 0;
    for (i = 0; i < RUNTIMES; i++) {
      if (fn()) {
        matchedTimes++;
      }
    }
    return matchedTimes;
  };
})();
describe('Test regexp parser', () => {
  // patterns
  test('test patterns', () => {
    expect(validParser('//')).toThrow();
    expect(validParser('/a/ii')).toThrow();
    expect(validParser('/(/')).toThrow();
    expect(validParser('/)/')).toThrow();
    expect(validParser('/[/')).toThrow();
    expect(validParser('/]/')).toBeTruthy();
    expect(validParser('/?/')).toThrow();
    expect(validParser('/(?)/')).toThrow();
    expect(validParser('/(|?)/')).toThrow();
    expect(validParser('/^?/')).toThrow();
    expect(validParser('/[/]/')).toBeTruthy();
    expect(validParser('/a//')).toThrow();
    expect(validParser('/(?<name>abc)\\k<n>/')).toThrow();
    expect(validParser('/a(?=b)/')).toBeTruthy();
    expect(validInput('/a(?=b)/')).toBeTruthy();
    expect(validParser('/(abc()()))/')).toThrow();
    expect(validParser('/\\u{fg}/u')).toThrow();
    expect(validParser('/\\xfg/u')).toThrow();
    expect(validMatch(/\\ufg/)).toBeTruthy();
    expect(validMatch(/\\xfg/)).toBeTruthy();
    expect(validInput(/\xff\u{00aa}/u)).toBeTruthy();
  });

  // valid times
  test('test times quantifier', () => {
    expect(validParser('/a*+/')).toThrow();
    expect(validParser('/a**/')).toThrow();
    expect(validParser('/a++/')).toThrow();
    expect(validParser('/a+*/')).toThrow();
    expect(validParser('/a?*/')).toThrow();
    expect(validParser('/a?+/')).toThrow();
    expect(validParser('/a*?/')).toBeTruthy();
    expect(validParser('/a*?*/')).toThrow();
    expect(validParser('/a+?/')).toBeTruthy();
    expect(validParser('/a+?+/')).toThrow();
    expect(validParser('/a??/')).toBeTruthy();
    expect(validParser('/a???/')).toThrow();
    expect(validParser('/a{3}?/')).toBeTruthy();
    expect(validParser('/a{3,}?/')).toBeTruthy();
    expect(validParser('/a{3}+/')).toThrow();
    expect(validParser('/a{3}*/')).toThrow();
    expect(validParser('/a{3}*/')).toThrow();
    expect(validParser('/a{3}??/')).toThrow();
    expect(validMatch(/a{3,5}/)).toBeTruthy();
    expect(validMatch(/a*/)).toBeTruthy();
    expect(validMatch(/a+/)).toBeTruthy();
    expect(validMatch(/a*?/)).toBeTruthy();
    expect(validMatch(/a+?/)).toBeTruthy();
    expect(validMatch(/a??/)).toBeTruthy();
    // wrong quantifer
    expect(validValue(/a{ 3}/) === 'a{ 3}').toBeTruthy();
    expect(validValue(/a{3, }/) === 'a{3, }').toBeTruthy();
    expect(validValue(/a{3, 5}/) === 'a{3, 5}').toBeTruthy();
    expect(validParser('/a{5,3}/')).toThrow();
  });
  // normal regexp rules
  test('test string match', () => {
    expect(validMatch(/a/)).toBeTruthy();
    expect(validMatch(/a{3}/)).toBeTruthy();
    expect(validMatch(/a./)).toBeTruthy();
    expect(validMatch(/[abc]/)).toBeTruthy();
    expect(validMatch(/[\w]/)).toBeTruthy();
    expect(validMatch(/[^\w]/)).toBeTruthy();
    expect(validMatch(/(a|b|cc|\d+)/)).toBeTruthy();
    expect(validMatch(/a(zz)|b(dd)|c(ef)|d(gg)/)).toBeTruthy();
    expect(validMatch(/(a)\89/)).toBeTruthy();
    expect(validMatch(/\1(a)/)).toBeTruthy();
    expect(validMatch(/\12(a)/)).toBeTruthy();
    expect(validMatch(/\377(a)/)).toBeTruthy();
    expect(validMatch(/\8(a)(b)(c)(d)(e)(f)(g)(h)(i)/)).toBeTruthy();
  });
  // regexp set
  test('test regexp set', () => {
    // normal set
    const r1 = /[a-z]/;
    expect(validMatch(r1)).toBeTruthy();
    // empty set,match nothing
    const r2 = /a([])b\1/;
    expect(() => validValue(r2)).toThrow();
    // match everything
    const r3 = /^[^]$/;
    expect(validMatch(r3)).toBeTruthy();
    // match nothing
    const r4 = /[^\w\W]/;
    expect(() => validValue(r4)).toThrow();
    // match nothing,same to r4
    const r5 = /[^a-zA-Z0-9_\W]/;
    expect(() => validValue(r5)).toThrow();
    // invalid set range
    const r6 = '/[z-a]/';
    expect(validParser(r6)).toThrow();
    // octal
    const r7 = '/[\\177-\\200]/';
    expect(validValue(r7)).toBeTruthy();
    expect(validValue(/[\8]/)).toBeTruthy();
    // control character
    const r8 = /[\ca]/;
    expect(validValue(r8)).toBeTruthy();
    const r9 = /[\c0]/;
    expect(validValue(r9)).toBeTruthy();
    expect(validParser('/[\\c0]/u')).toThrow();
    // hex
    const r10 = /[\x61-\x99]/;
    expect(validValue(r10)).toBeTruthy();
    // backspace
    expect(validValue(/[\b]/)).toEqual('\u{0008}');
    // null
    expect(() => validValue(/a[]b/)).toThrow();
    // set with charset
    expect(validMatch(/[a-\s]/)).toBeTruthy();
    expect(validMatch(/[^-a]/)).toBeTruthy();
    expect(validMatch(/[a-]/)).toBeTruthy();
    expect(validMatch(/[a-z]]/)).toBeTruthy();
    // translate char
    expect(validMatch(/[\xza-z]/)).toBeTruthy();
    // mixed reverse set
    expect(validMatch(/[^a-z\d]/)).toBeTruthy();
    // character class
    expect(/[\w]/.test(validValue(/[\w]/))).toBeTruthy();
    // special set
    expect(validMatch(/[[abc]/)).toBeTruthy();
    // special range
    expect(validMatch(/[{-}]/)).toBeTruthy();
    // ignore \b\B
    expect(validMatch(/[^a\bc]/)).toBeTruthy();
  });

  // test u flag
  test('test unicode flag', () => {
    const r1 = /\u{0061}/;
    const r2 = /\u{61}/u;
    expect(validMatch(r1)).toBeTruthy();
    expect(mustIn(['a', '\\u{61}'], r2)).toBeTruthy();
    // unicode set
    const r3 = /[\u{0061}-\u{0099}]/u;
    expect(validMatch(r3)).toBeTruthy();
    // unicode any
    const r4 = /./u;
    expect(validMatch(r4)).toBeTruthy();
    // wrong unicode range
    expect(validParser('/[\\u{010}-\\u{110000}]/u')).toThrow();
    // invalid control character
    expect(validParser('/\\c1/u')).toThrow();
    // valid control character
    expect(validMatch(/\ca/u)).toBeTruthy();
    expect(validMatch(/\c1/)).toBeTruthy();
    expect(validParser('/\\u{110000}/u')).toThrow();
    expect(run(() => validMatch(/[^a-z01\W]/u)) === RUNTIMES).toBeTruthy();
    expect(validMatch(/[^a-z01\W]/)).toBeTruthy();
  });
  // test i flag
  test('test ignore case', () => {
    const r1 = /[a-z]/i;
    expect(
      Array.from({
        length: 30,
      }).some(() => /[A-Z]/.test(validValue(r1))),
    ).toBeTruthy();
  });
  // groups
  test('test groups', () => {
    // group capture null
    const r1 = /\1(a)/;
    expect(validMatch(r1)).toBeTruthy();
    expect(validInput(r1)).toBeTruthy();
    expect(validValue(r1)).toEqual('a');
    // named group capture
    const r2 = /(?<ga>a)\k<ga>/;
    expect(validMatch(r2)).toBeTruthy();
    expect(validValue(r2)).toEqual('aa');
    expect(() =>
      validValue(r2, {
        namedGroupConf: {
          ga: ['b'],
        },
      }),
    ).toThrow();
    expect(
      validValue(r2, {
        namedGroupConf: {
          ga: undefined,
        },
      }),
    ).toEqual('aa');
    // special named group match
    const r3 = /(ef)(?<a_b_c_d>a|b|c|d+\1?)\\k<a_b_c_d>/;
    expect(
      r3.test(
        validValue(r3, {
          namedGroupConf: {
            a_b_c_d: {
              a: false,
              b: false,
              c: false,
              d: ['ddef', 'ddd'],
            },
          },
        }),
      ),
    ).toBeTruthy();
    // take as normal
    expect(
      r3.test(
        validValue(r3, {
          namedGroupConf: {
            a_b_c_d: ['a', 'b'],
          },
        }),
      ),
    ).toBeTruthy();
    // validate the override
    expect(() =>
      validValue(r3, {
        namedGroupConf: {
          a_b_c_d: {
            a: false,
            b: false,
            c: false,
            d: ['ee'], // 'ee' is not matched 'd+(ef)?'
          },
        },
      }),
    ).toThrow();
    // not match
    const rr3 = /(?<a_b_c>a|b|c|d+)\\k<a_b_c>/;
    expect(
      rr3.test(
        validValue(rr3, {
          namedGroupConf: {
            a_b_c: {
              a: false,
              b: false,
              c: true,
            },
          },
        }),
      ),
    ).toBeTruthy();
    // no group will match
    expect(() =>
      validValue(r3, {
        namedGroupConf: {
          a_b_c_d: {
            a: false,
            b: false,
            c: false,
            d: false,
          },
        },
      }),
    ).toThrow();
    // nested
    const r4 = /((a)b)\1\2/;
    expect(validValue(r4)).toEqual('ababa');
    expect(validInput(r4)).toBeTruthy();
    // nested group item
    const r5 = /((a)b|c)\1\2/;
    expect(mustIn(['ababa', 'cc'], r5)).toBeTruthy();
    // no capture group
    const r6 = /(?:a)(b)\1/;
    expect(validMatch(r6)).toBeTruthy();
    expect(validInput(r6)).toBeTruthy();
    // root group
    const r7 = /(:)a|b|c/;
    const r8 = /(:)a|b$|c/;
    const r9 = /($)/;
    expect(mustIn([':a', 'b', 'c'], r7)).toBeTruthy();
    expect(mustIn([':a', 'b', 'c'], r8)).toBeTruthy();
    expect(validValue(r9)).toEqual('');
    expect(validInput(r9)).toBeFalsy();
    // group ref item
    const r10 = /(d)(a|b|c|\1)/;
    expect(mustIn(['da', 'db', 'dc', 'dd'], r10)).toBeTruthy();
    expect(validInput(r10)).toBeTruthy();
    // with null
    const r11 = /abc\0/;
    expect(validValue(r11)).toBeTruthy();
    // test references and octal、numbers
    // \012 is an octal, match \n
    const r12 = /(a)(b)(c)(d)(e)(f)(g)(h)(i)(j)(k)(l)\012/;
    expect(validMatch(r12)).toBeTruthy();
    expect(validValue(r12)).toEqual(`abcdefghijkl\n`);
    // \12 is a reference, match the group 'l'
    const r13 = /(a)(b)(c)(d)(e)(f)(g)(h)(i)(j)(k)(l)\12/;
    expect(validMatch(r13)).toBeTruthy();
    // \12 is an octal code point, match \n
    const r14 = /(a)(b)(c)(d)(e)(f)(g)(h)(i)(j)(k)\12/;
    expect(validMatch(r14)).toBeTruthy();
    // \12 is a reference,but match nothing
    const r15 = /(a)(b)(c)(d)(e)(f)(g)(h)(i)(j)(k)\12(l)/;
    expect(validMatch(r15)).toBeTruthy();
    // not octal
    const r16 = /(a)\08/;
    expect(validMatch(r16)).toBeTruthy();
    // with point
    expect(validMatch(/(^a|b$|c$)/)).toBeTruthy();
    // named group with conf
    const v1 = new ReRegExp('/a{1}b{2}(d{3})\\1(?<namecap>[a-z]{2})/', {
      namedGroupConf: {
        namecap: ['aa', 'bb'],
      },
    });
    const v1values = ['abbddddddaa', 'abbddddddbb'];
    for (let i = 0, j = 10; i < j; i++) {
      expect(v1values.includes(v1.build())).toBeTruthy();
    }
    // normal named group
    const v2: string = validValue('/(?<name>haha)\\k<name>/');
    expect(v2 === 'hahahaha').toBeTruthy();
    // reference
    expect(validMatch(/(abc\1)/)).toBeTruthy();
    expect(validMatch(/(?<name>abc\k<name>)/)).toBeTruthy();
    //
    expect(() => validMatch(/(abc(?=def))/)).toThrow();
    // special reference
    expect(validValue(/(a)bc\81/) === 'abc81').toBeTruthy();
    // octal
    expect(validValue(/(a)bc\051/) === 'abc\u{29}').toBeTruthy();
    expect(validMatch(/(a)(bc|\81)/)).toBeTruthy();
  });

  // build
  test('test not supported', () => {
    const r1 = /^abc$/;
    expect(validMatch(r1)).toBeTruthy();
    const r2 = /^a|b$/;
    expect(validMatch(r2)).toBeTruthy();
    const r3 = /a$|^b/;
    expect(validMatch(r3)).toBeTruthy();
  });

  // flags
  test('test flags', () => {
    const r1 = /a/i;
    expect(mustIn(['a', 'A'], r1)).toBeTruthy();
    const r2 = /a/gimsuy;
    expect(mustIn(['a', 'A'], r2)).toBeTruthy();
    expect(validParser('/a/imguysi')).toThrow();
  });

  // special
  test('test special', () => {
    // .
    expect(validMatch(/./)).toBeTruthy();
    expect(/./s.test(validValue(/./s))).toBeTruthy();
    // \b
    expect(validValue(/a\bb/)).toEqual('ab');
    // range
    expect(validValue(/a-z]/)).toEqual('a-z]');
    // \w \d
    expect(validMatch(/\w/)).toBeTruthy();
    expect(validMatch(/./u)).toBeTruthy();
    expect(validMatch(/\W/)).toBeTruthy();
    expect(validMatch(/\d/)).toBeTruthy();
    expect(validMatch(/\D/)).toBeTruthy();
    expect(validMatch(/\s/)).toBeTruthy();
    expect(validMatch(/\S/)).toBeTruthy();
    // expect(validMatch(/\t/)).toBeTruthy();
    expect(validMatch(/\r/)).toBeTruthy();
    expect(validMatch(/\n/)).toBeTruthy();
    expect(validMatch(/\f/)).toBeTruthy();
    expect(validMatch(/\v/)).toBeTruthy();
  });
  // test max repeat times
  test('test max repeat', () => {
    ReRegExp.maxRepeat = 10;
    expect(
      Array.from({
        length: 10,
      }).every(() => {
        return validValue(/a*/).length <= 10;
      }),
    ).toBeTruthy();
    expect(
      Array.from({
        length: 10,
      }).every(() => {
        return (
          validValue(/a*/, {
            maxRepeat: 20,
          }).length <= 20
        );
      }),
    ).toBeTruthy();
  });
  // test capture
  test('test capture config', () => {
    // use capture
    const r1 = new ReRegExp(/(aa?)b(?<num>\d)/, {
      capture: true,
    });
    for (let i = 0; i < 100; i++) {
      const value = r1.build();
      let index = 2;
      if (value.startsWith('aa')) {
        index = 3;
        expect(r1.$1).toEqual('aa');
      } else {
        expect(r1.$1).toEqual('a');
      }
      expect(r1.groups).not.toBeUndefined();
      expect(r1.groups.num).toEqual(value.charAt(index));
    }
    // no capture
    const r2 = new ReRegExp(/(aa?)b(?<num>\d)/);
    r2.build();
    expect(r2.$1).toBeUndefined();
    expect(r2.groups).toBeUndefined();
  });
  // test unicode category
  test('test unicode category', () => {
    // without u flag
    const r1 = new ReRegExp('/\\p{Letter}{2}/');
    expect(r1.build()).toEqual('p{Letter}}');
    // with u flag, but no factory setted
    expect(() => {
      const _r2 = new ReRegExp('/\\p{Letter}{2}/u');
    }).toThrowError();
    // set the factory
    expect(() => {
      ReRegExp.unicodeCategoryFactory = function (data: UnicodeCategoryData) {
        if (data.reverse) {
          return {
            generate() {
              return '_';
            },
          };
        }
        if (data.value === 'Letter' || data.value === 'L') {
          return {
            generate() {
              return 'a';
            },
          };
        }
        return {
          generate() {
            return '1';
          },
        };
      };
      // Letter
      const r2 = new ReRegExp('/\\p{Letter}{2}/u');
      expect(r2.build()).toEqual('aa');
      // 'L' with short syntax
      const r3 = new ReRegExp('/\\pLl{2}/u');
      expect(r3.build()).toEqual('all');
      // value is 'Ll', so should return '11'
      const r4 = new ReRegExp('/\\p{Ll}{2}/u');
      expect(r4.build()).toEqual('11');
      // reverse
      const r5 = new ReRegExp('/\\P{Letter}{2}/u');
      expect(r5.build()).toEqual('__');
      // delete the factory
      delete ReRegExp.unicodeCategoryFactory;
    }).not.toThrowError();
  });
  // test last info
  test('test parser info', () => {
    const r1 = new ReRegExp(/a(b(c))d/i);
    const info = r1.info();
    expect(info.lastRule).toEqual('a(b(c))d');
    expect(info.flags.includes('i')).toBeTruthy();
    expect(r1.info().lastRule === info.lastRule).toBeTruthy();
  });
  // test extractSetAverage
  test('test average', () => {
    // r1
    const r1 = new ReRegExp(/[\Wa]/, {
      extractSetAverage: true,
    });
    expect(run(() => /\W/.test(r1.build())) > (RUNTIMES * 2) / 3).toBeTruthy();
    // r2
    const r2 = new ReRegExp(/[\Wa]/);
    expect(run(() => /\W/.test(r2.build())) < (RUNTIMES * 2) / 3).toBeTruthy();
    // r3
    const r3 = new ReRegExp(/[a-z,]/, {
      extractSetAverage: true,
    });
    expect(
      run(() => /[a-z]/.test(r3.build())) > (RUNTIMES * 2) / 3,
    ).toBeTruthy();
  });
  // test others
  test('other conditions', () => {
    //
    expect(
      run(() => /^.$/.test(CharsetHelper.make('.'))) === RUNTIMES,
    ).toBeTruthy();
    expect(
      run(() =>
        /^.$/s.test(
          CharsetHelper.make('.', {
            s: true,
          }),
        ),
      ) === RUNTIMES,
    ).toBeTruthy();
    expect(
      run(() =>
        /^.$/u.test(
          CharsetHelper.make('.', {
            u: true,
          }),
        ),
      ) === RUNTIMES,
    ).toBeTruthy();
    expect(
      run(() =>
        /^.$/su.test(
          CharsetHelper.make('.', {
            s: true,
            u: true,
          }),
        ),
      ) === RUNTIMES,
    ).toBeTruthy();
  });
});
