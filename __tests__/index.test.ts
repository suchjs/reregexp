import RegexpParser, { ParserConf } from '../src/index';
type Rule = RegExp | string;
const validParser = (rule: Rule) => {
  return () => {
    try {
      new RegexpParser(rule);
    } catch (e) {
      throw e;
    }
    return true;
  };
};
const validMatch = (rule: RegExp) => {
  return rule.test(new RegexpParser(rule).build());
};
const validValue = (rule: Rule, conf: ParserConf = {}) => {
  const re = new RegexpParser(rule, conf);
  return re.build();
};
const validInput = (rule: Rule): boolean => {
  return (
    new RegexpParser(rule).lastRule ===
    (rule instanceof RegExp
      ? rule.source
      : rule.replace(/^\//, '').replace(/\/[imguys]*$/, ''))
  );
};
const mustIn = (values: string[], rule: Rule): boolean => {
  const runTimes = 50;
  for (let i = 0, j = runTimes; i < j; i++) {
    const value = validValue(rule);
    if (!values.includes(value)) return false;
  }
  return true;
};
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
    expect(validParser('/a{3}+/')).toThrow();
    expect(validParser('/a{3}*/')).toThrow();
    expect(validParser('/a{3}*/')).toThrow();
    expect(validParser('/a{3}??/')).toThrow();
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
    const r2 = /[]/;
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
    // translate char
    expect(validMatch(/[\xza-z]/)).toBeTruthy();
    // mixed reverse set
    expect(validMatch(/[^a-z\d]/)).toBeTruthy();
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
    // wrong unicode range
    expect(validParser('/[\\u{010}-\\u{110000}]/')).toThrow();
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
    // special named group match
    const r3 = /(?<a_b_c_d>a|b|c|d+)\\k<a_b_c_d>/;
    expect(
      r3.test(
        validValue(r3, {
          namedGroupConf: {
            a_b_c_d: {
              a: false,
              b: false,
              c: false,
              d: ['dd'],
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
    expect(validInput(r9)).toBeTruthy();
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
    expect(validMatch(/(^a|b|c$)/)).toBeTruthy();
    // named group with conf
    const v1: string = validValue('/a{1}b{2}(d{3})\\1(?<namecap>[a-z]{2})/', {
      namedGroupConf: {
        namecap: ['aa', 'bb'],
      },
    });
    expect(['abbddddddaa', 'abbddddddbb'].includes(v1)).toBeTruthy();
    // normal named group
    const v2: string = validValue('/(?<name>haha)\\k<name>/');
    expect(v2 === 'hahahaha').toBeTruthy();
  });

  // build
  test('test not supported', () => {
    const r1 = /^abc$/;
    expect(validMatch(r1)).toBeTruthy();
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
});
