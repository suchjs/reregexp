import RegexpParser from '../src/index';
type  Rule = RegExp | string;
const regexpToStr = (rule: Rule): string => {
  if(rule instanceof RegExp) {
    rule.toString().replace(/\\/g, '\\\\');
  }
  return rule as string;
};
const validParser = (rule: Rule) => {
  return () => {
    try {
      // tslint:disable-next-line:no-unused-expression
      new RegexpParser(regexpToStr(rule));
    } catch(e) {
      throw e;
    }
    return true;
  };
};
const validMatch = (rule: RegExp) => {
  return () => {
    rule.test(new RegexpParser(regexpToStr(rule)).build());
  };
};
const validValue = (rule: Rule, conf: {
  namedGroupConf?: {[index: string]: any},
} = {}) => {
  return (new RegexpParser(regexpToStr(rule), conf)).build();
};
describe('test regexp parser', () => {
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
  });
  test('test value exactly', () => {
    const v1: string = validValue('/a{1}b{2}(d{3})\\1(?<namecap>[a-z]{2})/', {
      namedGroupConf: {
        namecap: ['aa', 'bb'],
      },
    });
    expect(['abbddddddaa', 'abbddddddbb'].indexOf(v1) > -1).toBeTruthy();
    const v2: string = validValue('/(?<name>haha)\\k<name>/');
    expect(v2 === 'hahahaha').toBeTruthy();
  });
  test('test regexp set', () => {
    const r1 = /[a-z]/;
    const r2 = /[]/;
    const r3 = /^[^]$/;
    const r4 = /[^\w\W]/;
    const r5 = /[^a-zA-Z0-9_\W]/;
    expect(/^[a-z]$/.test(validValue(r1))).toBeTruthy();
    expect(() => validValue(r2)).toThrow();
    expect(validMatch(r3)).toBeTruthy();
    expect(() => validValue(r4)).toThrow();
    expect(() => validValue(r5)).toThrow();
  });
});
