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
  return () => {
    rule.test(new RegexpParser(rule).build());
  };
};
const validValue = (rule: Rule, conf: ParserConf = {}) => {
  return new RegexpParser(rule, conf).build();
};
const validInput = (rule: Rule): boolean => {
  return (
    new RegexpParser(rule).lastRule ===
    (rule instanceof RegExp ? rule.source : rule)
  );
};
const mustIn = (values: string[], rule: Rule): boolean => {
  for (let i = 0, j = 20; i < j; i++) {
    const value = validValue(rule);
    if (!values.includes(value)) return false;
  }
  return true;
};
describe('Test regexp parser', () => {
  test('test normal patterns', () => {
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
  });
  test('test times valid', () => {
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
  test('test value exactly', () => {
    const v1: string = validValue('/a{1}b{2}(d{3})\\1(?<namecap>[a-z]{2})/', {
      namedGroupConf: {
        namecap: ['aa', 'bb'],
      },
    });
    expect(['abbddddddaa', 'abbddddddbb'].includes(v1)).toBeTruthy();
    const v2: string = validValue('/(?<name>haha)\\k<name>/');
    expect(v2 === 'hahahaha').toBeTruthy();
  });
  test('test regexp set', () => {
    const r1 = /[a-z]/;
    const r2 = /[]/;
    const r3 = /^[^]$/;
    const r4 = /[^\w\W]/;
    const r5 = /[^a-zA-Z0-9_\W]/;
    const r6 = '/[z-a]/';
    const r7 = '/[\\177-\\200]/';
    expect(/^[a-z]$/.test(validValue(r1))).toBeTruthy();
    expect(() => validValue(r2)).toThrow();
    expect(validMatch(r3)).toBeTruthy();
    expect(() => validValue(r4)).toThrow();
    expect(() => validValue(r5)).toThrow();
    expect(validParser(r6)).toThrow();
    expect(validValue(r7)).toBeTruthy();
    // control character
    const r8 = /[\ca]/;
    expect(validValue(r8)).toBeTruthy();
    const r9 = /[\c0]/;
    expect(validValue(r9)).toBeTruthy();
    expect(validParser('/[\\c0]/u')).toThrow();
    // hex
    const r10 = /[\x61-\x99]/;
    expect(validValue(r10)).toBeTruthy();
  });

  test('test unicode', () => {
    const r1 = /\u{0061}/;
    const r2 = /\u{61}/u;
    expect(validMatch(r1)).toBeTruthy();
    expect(validMatch(r2)).toBeTruthy();
  });

  // groups
  test('test groups', () => {
    const r1 = /\1(a)/;
    const r2 = /(?<ga>a)\k<ga>/;
    const r3 = /(?<a_b_c_d>a|b|c|d+)\\k<a_b_c_d>/;
    const r4 = /((a)b)\1\2/;
    const r5 = /((a)b|c)\1\2/;
    const r6 = /(?:a)(b)\1/;
    const r7 = /(:)a|b|c/;
    const r8 = /(:)a|b$|c/;
    const r9 = /($)/;
    const r10 = /(d)(a|b|c|\1)/;
    expect(validMatch(r1)).toBeTruthy();
    expect(validInput(r1)).toBeTruthy();
    expect(validMatch(r2)).toBeTruthy();
    expect(validValue(r2)).toEqual('aa');
    expect(() =>
      validValue(r2, {
        namedGroupConf: {
          ga: ['b'],
        },
      }),
    ).toThrow();
    // special match
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
    expect(validValue(r4)).toEqual('ababa');
    // nested group item
    expect(mustIn(['ababa', 'cc'], r5)).toBeTruthy();
    // no capture group
    expect(validMatch(r6)).toBeTruthy();
    expect(validInput(r6)).toBeTruthy();
    // root group
    expect(mustIn([':a', 'b', 'c'], r7)).toBeTruthy();
    expect(mustIn([':a', 'b', 'c'], r8)).toBeTruthy();
    expect(validValue(r9)).toEqual('');
    expect(validInput(r9)).toBeTruthy();
    // group ref item
    expect(mustIn(['da', 'db', 'dc', 'dd'], r10)).toBeTruthy();
    expect(validInput(r10)).toBeTruthy();
    //
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
    //
    const r16 = /(a)\08/;
    expect(validMatch(r16)).toBeTruthy();
  });

  // build
  test('test not supported', () => {
    const r1 = /^abc$/;
    expect(validMatch(r1)).toBeTruthy();
  });
});
