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
      new RegexpParser(regexpToStr(rule));
    } catch(e) {
      throw e;
    }
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
  test('parse invalid rule', () => {
    expect(validParser('//')).toThrow();
    expect(validParser('/a/ii')).toThrow();
    expect(validParser('/(/')).toThrow();
    expect(validParser('/)/')).toThrow();
    expect(validParser('/[/')).toThrow();
  });
  test('parse string match', () => {
    expect(validMatch(/a/)).toBeTruthy();
    expect(validMatch(/a{3}/)).toBeTruthy();
    expect(validMatch(/a./)).toBeTruthy();
  });
  test('parse value exactly', () => {
    const value: string = validValue('/a{1}b{2}(d{3})\\1(?<namecap>[a-z]{2})/', {
      namedGroupConf: {
        namecap: ['aa', 'bb'],
      },
    });
    expect(['abbddddddaa', 'abbddddddbb'].indexOf(value) > -1).toBeTruthy();
  });
});
