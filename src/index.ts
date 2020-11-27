// get a random flag 'true' or 'false'
const isOptional = (): boolean => {
  return Math.random() >= 0.5;
};
// make a random number between min to max
const makeRandom = (min: number, max: number): number => {
  if (min === max) {
    return min;
  } else {
    return min + Math.floor(Math.random() * (max + 1 - min));
  }
};
// make a random from totals array
const getRandomTotalIndex = (
  totals: number[],
): {
  rand: number;
  index: number;
} => {
  const total = getLastItem(totals);
  const rand = makeRandom(1, total);
  let nums = totals.length;
  let index = 0;
  while (nums > 1) {
    const avg = Math.floor(nums / 2);
    const prev = totals[index + avg - 1];
    const next = totals[index + avg];
    if (rand >= prev && rand <= next) {
      // find
      index += avg - (rand === prev ? 1 : 0);
      break;
    } else {
      if (rand > next) {
        // in the right side
        index += avg + 1;
        nums -= avg + 1;
      } else {
        // in the left side,keep the index
        nums -= avg;
      }
    }
  }
  return {
    rand,
    index,
  };
};
// get an array's last item
const getLastItem = <T>(arr: T[]) => {
  return arr[arr.length - 1];
};
// normal object
export interface NormalObject<T = unknown> {
  [index: string]: T;
}
// regular expression flags
export type Flag = 'i' | 'm' | 'g' | 'u' | 'y' | 's';
export type FlagsHash = {
  [key in Flag]?: boolean;
};
export type FlagsBinary = {
  [key in Flag]: number;
};
export type NamedGroupConf<T = never> = NormalObject<string[] | T>;
export interface ParserConf {
  maxRepeat?: number;
  namedGroupConf?: NamedGroupConf<NamedGroupConf<string[] | boolean>>;
  extractSetAverage?: boolean;
}
export interface BuildConfData extends ParserConf {
  flags: FlagsHash;
  namedGroupData: NormalObject<string>;
  captureGroupData: NormalObject<string>;
  beginWiths: string[];
  endWiths: string[];
}

export type Result = Pick<Parser, 'rule' | 'lastRule' | 'context' | 'flags'> & {
  queues: RegexpPart[];
};

export class CharsetHelper {
  public static readonly points: CodePointData<CodePointRanges> = {
    d: [[48, 57]], // character 0-9
    w: [[48, 57], [65, 90], [95], [97, 122]], // 0-9, A-Z, _, a-z
    // whitespaces, see the wiki below:
    // https://en.wikipedia.org/wiki/Whitespace_character
    // https://github.com/microsoft/ChakraCore/issues/2120  [0x18e0] not in \s
    s: [
      [0x0009, 0x000d],
      [0x0020],
      [0x00a0],
      [0x1680],
      [0x2000, 0x200a],
      [0x2028, 0x2029],
      [0x202f],
      [0x205f],
      [0x3000],
      [0xfeff],
    ],
  };
  // the total length of the code point ranges,should match the 'points' field.
  public static readonly lens: CodePointData<number[]> = {
    d: [10],
    w: [10, 36, 37, 63],
    s: [5, 6, 7, 8, 18, 20, 21, 22, 23, 24],
  };
  // big code point character
  public static readonly bigCharPoint: number[] = [0x10000, 0x10ffff];
  public static readonly bigCharTotal: number = 0x10ffff - 0x10000 + 1;
  // match '.'
  public static charsetOfAll(): CodePointResult {
    return CharsetHelper.charsetOfNegated('ALL');
  }
  // match '.' with s flag
  public static charsetOfDotall(): CodePointResult {
    return CharsetHelper.charsetOfNegated('DOTALL');
  }
  // get negated charset
  public static charsetOfNegated(type: CharsetCacheType): CodePointResult {
    const { points, cache } = CharsetHelper;
    if (cache[type]) {
      return cache[type];
    } else {
      let start = 0x0000;
      const max = 0xdbff;
      const nextStart = 0xe000;
      const nextMax = 0xffff;
      const ranges: CodePointRanges = [];
      const totals: number[] = [];
      let total = 0;
      const add = (begin: number, end: number) => {
        const num = end - begin + 1;
        if (num <= 0) {
          return;
        } else {
          ranges.push(num > 1 ? [begin, end] : [begin]);
        }
        total += num;
        totals.push(total);
      };
      if (type === 'DOTALL') {
        add(start, max);
        add(nextStart, nextMax);
      } else {
        // should exclude
        const excepts =
          type === 'ALL'
            ? [[0x000a], [0x000d], [0x2028, 0x2029]]
            : points[type.toLowerCase() as CharsetType];
        const isNegaWhitespace = type === 'S';
        const count = excepts.length - (isNegaWhitespace ? 1 : 0);
        let looped = 0;
        while (start <= max && count > looped) {
          const [begin, end] = excepts[looped++];
          add(start, begin - 1);
          start = (end || begin) + 1;
        }
        if (start < max) {
          add(start, max);
        }
        if (isNegaWhitespace) {
          // 0xfeff
          const last = getLastItem(excepts)[0];
          add(nextStart, last - 1);
          add(last + 1, nextMax);
        } else {
          add(nextStart, nextMax);
        }
      }
      return (cache[type] = {
        ranges,
        totals,
      });
    }
  }
  // charset of type 's'|'d'|'w'
  public static charsetOf(type: CharsetType): CodePointResult {
    const { lens, points } = CharsetHelper;
    return {
      ranges: points[type],
      totals: lens[type],
    };
  }
  // get charset ranges
  public static getCharsetInfo(
    type: CharsetType | CharsetNegatedType | '.',
    flags: FlagsHash = {},
  ): CodePointResult {
    let last: CodePointResult;
    const helper = CharsetHelper;
    if (['w', 'd', 's'].includes(type)) {
      last = helper.charsetOf(type as CharsetType);
    } else {
      if (type === '.') {
        if (flags.s) {
          last = helper.charsetOfDotall();
        } else {
          last = helper.charsetOfAll();
        }
      } else {
        last = helper.charsetOfNegated(type as CharsetNegatedType);
      }
      if (flags.u) {
        last = {
          ranges: last.ranges.concat([helper.bigCharPoint]),
          totals: last.totals.concat(helper.bigCharTotal),
        };
      }
    }
    return last;
  }
  // make the type
  public static make(
    type: CharsetType | CharsetNegatedType | '.',
    flags: FlagsHash = {},
  ): string {
    return CharsetHelper.makeOne(CharsetHelper.getCharsetInfo(type, flags));
  }
  // make one character
  public static makeOne(info: CodePointResult): string {
    const { totals, ranges } = info;
    const { rand, index } = getRandomTotalIndex(totals);
    const codePoint = ranges[index][0] + (rand - (totals[index - 1] || 0)) - 1;
    return String.fromCodePoint(codePoint);
  }
  protected static readonly cache: CharsetCache = {};
  // contructor
  protected constructor() {
    // do nothing, no methods, no properties
  }
}
const charH = CharsetHelper;
const symbols: NormalObject<string> = {
  beginWith: '^',
  endWith: '$',
  matchAny: '.',
  groupBegin: '(',
  groupEnd: ')',
  uncapture: '?:',
  lookahead: '?=',
  lookaheadNot: '?!',
  groupSplitor: '|',
  setBegin: '[',
  setEnd: ']',
  rangeSplitor: '-',
  multipleBegin: '{',
  multipleEnd: '}',
  multipleSplitor: ',',
  translate: '\\',
  leastOne: '+',
  multiple: '*',
  optional: '?',
  setNotIn: '^',
  delimiter: '/',
};
const flagsBinary: FlagsBinary = {
  i: 0b000001,
  u: 0b000010,
  s: 0b000100,
  g: 0b001000,
  m: 0b010000,
  y: 0b100000,
};
const flagItems = Object.keys(flagsBinary).join('');
export const parserRule = new RegExp(
  `^\\/(?:\\\\.|\\[[^\\]]*\\]|[^\\/])+?\/[${flagItems}]*`,
);
const regexpRuleContext = `((?:\\\\.|\\[[^\\]]*\\]|[^\\/])+?)`;
export const regexpRule = new RegExp(
  `^\\/${regexpRuleContext}\\/([${flagItems}]*)$`,
);
const regexpNoFlagsRule = new RegExp(`^${regexpRuleContext}$`);
const octalRule = /^(0[0-7]{0,2}|[1-3][0-7]{0,2}|[4-7][0-7]?)/;
/**
 *
 *
 * @export
 * @class Parser
 */
export default class Parser {
  public static maxRepeat = 5;
  public readonly context: string = '';
  public readonly flags: Flag[] = [];
  public readonly lastRule: string = '';
  private queues: RegexpPart[] = [];
  private ruleInput = '';
  private flagsHash: FlagsHash = {};
  private totalFlagBinary = 0;
  private rootQueues: RegexpPart[] = [];
  private hasLookaround = false;
  private hasNullRoot: boolean = null;
  constructor(
    public readonly rule: string | RegExp,
    private config: ParserConf = {},
  ) {
    if (rule instanceof RegExp) {
      this.rule = rule.toString();
      this.context = rule.source;
      this.flags = rule.flags.split('') as Flag[];
    } else {
      if (regexpRule.test(rule) || regexpNoFlagsRule.test(rule)) {
        this.rule = rule;
        this.context = RegExp.$1;
        this.flags = RegExp.$2 ? (RegExp.$2.split('') as Flag[]) : [];
      } else {
        throw new Error(`wrong regexp:${rule}`);
      }
    }
    this.checkFlags();
    this.parse();
    this.lastRule = this.ruleInput;
  }

  // build
  public build(): string | never {
    if (this.hasLookaround) {
      throw new Error('the build method does not support lookarounds.');
    }
    const { rootQueues } = this;
    let result = '';
    const conf: BuildConfData = {
      ...this.config,
      flags: this.flagsHash,
      namedGroupData: {},
      captureGroupData: {},
      beginWiths: [],
      endWiths: [],
    };
    const nullRootErr = 'the regexp has null expression, will match nothing';
    if (this.hasNullRoot === true) {
      throw new Error(nullRootErr);
    } else {
      this.hasNullRoot = rootQueues.some((queue) => {
        // make sure detect 'isMatchNothing' before 'build()'
        if (queue.isMatchNothing) {
          return true;
        }
        result += queue.build(conf);
        return false;
      });
      if (this.hasNullRoot) throw new Error(nullRootErr);
    }
    return result;
  }
  // get all info
  public info(): Result {
    const { rule, context, lastRule, flags, queues } = this;
    return {
      rule,
      context,
      lastRule,
      flags,
      queues,
    };
  }
  // parse
  private parse() {
    const { context } = this;
    const s = symbols;
    let i = 0;
    const j: number = context.length;
    const queues: RegexpPart[] = [new RegexpBegin()];
    const groups: RegexpGroup[] = [];
    const lookarounds: RegexpLookaround[] = [];
    const captureGroups: RegexpGroup[] = [];
    const namedCaptures: { [index: string]: RegexpGroup } = {};
    const refGroups: { [index: string]: RegexpGroup | null } = {};
    const captureRule = /^(\?(?:<(.+?)>|:))/;
    const lookaroundRule = /^(\?(?:<=|<!|=|!))/;
    const hasFlagU = this.hasFlag('u');
    const nestQueues: RegexpPart[] = [];
    const refOrNumbers: RegexpPart[] = [];
    const addToQueue = (...args: RegexpPart[]): void => {
      args.forEach((queue: RegexpPart) => (queue.parser = this));
      queues.push(...args);
    };
    let groupCaptureIndex = 0;
    let curSet: RegexpSet = null;
    let curRange: RegexpRange = null;
    const addToGroupOrLookaround = (cur: RegexpPart) => {
      const curQueue =
        getLastItem(nestQueues) ||
        getLastItem(groups) ||
        getLastItem(lookarounds);
      if (['group', 'lookaround'].includes(cur.type)) {
        const lists = cur.type === 'group' ? groups : lookarounds;
        (lists as RegexpPart[]).push(cur);
        nestQueues.push(cur);
      }
      if (curQueue) {
        if (curQueue.type === 'group') {
          (curQueue as RegexpGroup).addItem(cur);
        } else {
          cur.parent = curQueue;
        }
      }
    };
    const isWrongRepeat = (type: string, prev: RegexpCharset): boolean => {
      const denyTypes = [
        'groupBegin',
        'groupSplitor',
        'times',
        'begin',
        'anchor',
      ];
      return (
        denyTypes.includes(type) ||
        (type === 'charset' && prev.charset.toLowerCase() === 'b')
      );
    };
    // /()/
    while (i < j) {
      // current character
      const char: string = context.charAt(i++);
      // when in set,ignore these special chars
      if (
        (curRange || curSet) &&
        [
          '[',
          '(',
          ')',
          '|',
          '*',
          '?',
          '+',
          '{',
          '.',
          '}',
          '^',
          '$',
          '/',
        ].includes(char)
      ) {
        const newChar = new RegexpChar(char);
        if (curRange) {
          newChar.parent = curRange;
          curRange = null;
        } else {
          newChar.parent = curSet;
        }
        addToQueue(newChar);
        continue;
      }
      // match more
      const nextAll: string = context.slice(i);
      const lastGroup = getLastItem(groups);
      const lastQueue = getLastItem(queues);
      let target = null;
      let special: RegexpPart = null;
      switch (char) {
        // match translate first,match "\*"
        case s.translate:
          // move one char
          const next = context.charAt(i++);
          const input = char + next;
          if (next === 'u' || next === 'x') {
            // unicode,ascii,if has u flag,can also match ${x{4}|x{6}}
            target =
              next === 'x'
                ? new RegexpASCII()
                : hasFlagU
                ? new RegexpUnicodeAll()
                : new RegexpUnicode();
            const matchedNum: number = target.untilEnd(context.slice(i));
            if (matchedNum === 0) {
              if (hasFlagU) {
                throw new Error(`invalid unicode code point:${context}`);
              }
              // not regular unicode,"\uzyaa"
              target = new RegexpTranslateChar(`\\${next}`);
            } else {
              // is unicode,move matchedNum steps
              i += matchedNum;
            }
          } else if (next === 'c') {
            // control char
            // https://github.com/tc39/ecma262/pull/864
            // https://github.com/Microsoft/ChakraCore/commit/4374e4407b12fa18e9795ce1ca0869affccb85fe
            const code = context.charAt(i);
            if (hasFlagU) {
              if (/[a-zA-Z]/.test(code)) {
                target = new RegexpControl(code);
                i++;
              } else {
                throw new Error(
                  `invalid unicode escape,unexpect control character[${i}]:\\c${code}`,
                );
              }
            } else {
              if (/[A-Za-z]/.test(code)) {
                target = new RegexpControl(code);
                i++;
              } else {
                // treat it with \ and character c
                target = new RegexpChar('\\');
                i--;
              }
            }
          } else if (['d', 'D', 'w', 'W', 's', 'S', 'b', 'B'].includes(next)) {
            // charsets
            target = new RegexpCharset(input);
          } else if (['t', 'r', 'n', 'f', 'v'].includes(next)) {
            // print chars
            target = new RegexpPrint(input);
          } else if (/^(\d+)/.test(nextAll)) {
            const no = RegExp.$1;
            if (curSet) {
              // in set, "\" + \d will parse as octal,max 0377
              if (octalRule.test(no)) {
                const octal = RegExp.$1;
                target = new RegexpOctal(`\\${octal}`);
                i += octal.length - 1;
              } else {
                target = new RegexpTranslateChar(`\\${no.charAt(0)}`);
              }
            } else {
              // reference
              if (no.charAt(0) === '0') {
                if (no.length === 1) {
                  // \0
                  target = new RegexpNull();
                } else {
                  if (+no.charAt(1) > 7) {
                    // \08 \09
                    target = new RegexpNull();
                  } else {
                    // \01
                    const octal =
                      no.length >= 3 && +no.charAt(2) <= 7
                        ? no.slice(1, 3)
                        : no.charAt(1);
                    target = new RegexpOctal(`\\0${octal}`);
                    i += octal.length;
                  }
                }
              } else {
                i += no.length - 1;
                if (+no <= captureGroups.length) {
                  target = new RegexpReference(`\\${no}`);
                  const refGroup = captureGroups[+no - 1];
                  refGroups[no] = refGroup;
                  if (refGroup.isAncestorOf(lastGroup)) {
                    target.ref = null;
                  } else {
                    target.ref = refGroup;
                  }
                } else {
                  // may be reference, or octal number, or digits
                  target = new RegexpRefOrNumber(`\\${no}`);
                  refOrNumbers.push(target);
                }
              }
            }
          } else if (next === 'k' && /^<([^>]+?)>/.test(context.slice(i))) {
            const name = RegExp.$1;
            if (!namedCaptures[name]) {
              throw new Error(`Invalid named capture referenced:${name}`);
            } else {
              i += name.length + 2;
              const refGroup = namedCaptures[name];
              target = new RegexpReference(`\\${refGroup.captureIndex}`, name);
              if (refGroup.isAncestorOf(lastGroup)) {
                target.ref = null;
              } else {
                target.ref = refGroup;
              }
            }
          } else {
            // charsets
            target = new RegexpTranslateChar(input);
          }
          break;
        // match group begin "("
        case s.groupBegin:
          const isLookaround = lookaroundRule.test(nextAll);
          if (isLookaround) {
            const lookType = RegExp.$1;
            target = new RegexpLookaround(lookType);
            special = new RegexpSpecial('lookaroundBegin');
            this.hasLookaround = true;
            i += lookType.length;
          } else {
            target = new RegexpGroup();
            special = new RegexpSpecial('groupBegin');
          }
          if (!isLookaround) {
            target = target as RegexpGroup;
            // get capture info
            if (captureRule.test(nextAll)) {
              const { $1: all, $2: captureName } = RegExp;
              if (all === '?:') {
                // do nothing, captureIndex = 0 by default
              } else {
                // named group
                target.captureIndex = ++groupCaptureIndex;
                target.captureName = captureName;
                namedCaptures[captureName] = target;
              }
              i += all.length;
            } else {
              target.captureIndex = ++groupCaptureIndex;
            }
            if (target.captureIndex > 0) {
              captureGroups.push(target);
            }
          }
          break;
        // match group end ")"
        case s.groupEnd:
          if (nestQueues.length) {
            const curNest = nestQueues.pop();
            const last = (curNest.type === 'group'
              ? groups
              : lookarounds
            ).pop();
            last.isComplete = true;
            special = new RegexpSpecial(`${curNest.type}End`);
            special.parent = last;
          } else {
            throw new Error(`unmatched ${char},you mean "\\${char}"?`);
          }
          break;
        // match group splitor "|"
        case s.groupSplitor:
          const group = getLastItem(groups);
          if (!group) {
            const rootGroup = new RegexpGroup();
            rootGroup.isRoot = true;
            rootGroup.addRootItem(queues.slice(1));
            queues.splice(1, 0, rootGroup);
            groups.push(rootGroup);
          } else {
            group.addNewGroup();
          }
          special = new RegexpSpecial('groupSplitor');
          break;
        // match set begin "["
        case s.setBegin:
          if (/^\\b]/.test(nextAll)) {
            target = new RegexpBackspace();
            i += 3;
          } else {
            curSet = new RegexpSet();
            if (nextAll.charAt(0) === '^') {
              curSet.reverse = true;
              i += 1;
            }
            addToQueue(curSet);
            addToGroupOrLookaround(curSet);
            special = new RegexpSpecial('setBegin');
            special.parent = curSet;
          }
          break;
        // match set end "]"
        case s.setEnd:
          if (curSet) {
            curSet.isComplete = true;
            special = new RegexpSpecial('setEnd');
            special.parent = curSet;
            curSet = null;
          } else {
            target = new RegexpChar(char);
          }
          break;
        // match range splitor "-"
        case s.rangeSplitor:
          if (curSet) {
            if (lastQueue.codePoint < 0) {
              // such as [-aaa] [^-a] [\s-a]
              target = new RegexpChar(char);
            } else {
              const nextChar = nextAll.charAt(0);
              if (nextChar === s.setEnd) {
                curSet.isComplete = true;
                curSet = null;
                i += 1;
              } else {
                curSet.pop();
                curRange = new RegexpRange();
                curRange.parent = curSet;
                queues.pop().parent = curRange;
                addToQueue(curRange, lastQueue);
                special = new RegexpSpecial('rangeSplitor');
                special.parent = curRange;
              }
            }
          } else {
            target = new RegexpChar(char);
          }
          break;
        // match times
        case s.multipleBegin:
        case s.optional:
        case s.multiple:
        case s.leastOne:
          target =
            char === s.multipleBegin
              ? new RegexpTimesMulti()
              : new RegexpTimesQuantifiers(
                  ...(this.config.maxRepeat ? [this.config.maxRepeat] : []),
                );
          const num = target.untilEnd(context.slice(i - 1));
          if (num > 0) {
            const type =
              lastQueue instanceof RegexpSpecial
                ? lastQueue.special
                : lastQueue.type;
            const error = `[${
              lastQueue.input
            }]nothing to repeat[index:${i}]:${context.slice(
              i - 1,
              i - 1 + num,
            )}`;
            if (isWrongRepeat(type, lastQueue as RegexpCharset)) {
              throw new Error(error);
            } else {
              i += num - 1;
              if (type === 'groupEnd' || type === 'setEnd') {
                target.target = lastQueue.parent;
              } else {
                target.target = lastQueue;
              }
            }
          } else {
            target = new RegexpChar(char);
          }
          break;
        // match any .
        case s.matchAny:
          target = new RegexpAny();
          break;
        // match ^$
        case s.beginWith:
        case s.endWith:
          target = new RegexpAnchor(char);
          break;
        // match /
        case s.delimiter:
          throw new Error(`unexpected pattern end delimiter:"/${nextAll}"`);
        // default
        default:
          target = new RegexpChar(char);
      }
      // push target to queues
      if (target) {
        const cur = target as RegexpPart;
        addToQueue(cur);
        if (curRange) {
          if (target.codePoint < 0) {
            // not char,translateChar,control char,or octal
            const [, first, , second] = queues.splice(-4, 4);
            const middle = new RegexpChar('-');
            curSet.pop();
            [first, middle, second].map((item: RegexpPart) => {
              item.parent = curSet;
              addToQueue(item);
              return item;
            });
          } else {
            target.parent = curRange;
          }
          curRange = null;
        } else if (curSet) {
          cur.parent = curSet;
        } else {
          addToGroupOrLookaround(cur);
        }
      }
      // add special
      if (special) {
        if (target) {
          special.parent = target;
        }
        addToQueue(special);
      }
    }
    // parse reference or number
    if (refOrNumbers.length) {
      const replace = (
        lists: RegexpPart[],
        search: RegexpPart,
        rep: RegexpPart[],
      ) => {
        let idx = 0;
        let finded = false;
        for (const len = lists.length; idx < len; idx++) {
          if (search === lists[idx]) {
            finded = true;
            break;
          }
        }
        if (finded) {
          lists.splice(idx, 1, ...rep);
        }
      };
      const refLen = captureGroups.length;
      refOrNumbers.map((item: RegexpRefOrNumber) => {
        const strNum = item.input.slice(1);
        const total = strNum.length;
        let matchLen = 0;
        let instance: RegexpPart;
        if (strNum.charAt(0) !== '0' && +strNum <= refLen) {
          instance = new RegexpReference(item.input);
          (instance as RegexpReference).ref = null;
          matchLen = total;
        } else {
          if (/^([1-3][0-7]{0,2}|[4-7][0-7]?)/.test(strNum)) {
            const octal = RegExp.$1;
            instance = new RegexpOctal(`\\${octal}`);
            matchLen += octal.length;
          } else {
            instance = new RegexpTranslateChar(`\\${strNum.charAt(0)}`);
            matchLen += 1;
          }
        }
        instance.linkParent = item.parent;
        const res: RegexpPart[] = [instance];
        while (matchLen < total) {
          const curChar = new RegexpChar(strNum.charAt(matchLen++));
          curChar.linkParent = item.parent;
          res.push(curChar);
        }
        if (item.parent) {
          replace(item.parent.queues, item, res);
        }
        replace(queues, item, res);
      });
    }
    // if root group,set completed when parse end
    if (
      queues.length > 1 &&
      queues[1].type === 'group' &&
      (queues[1] as RegexpGroup).isRoot === true
    ) {
      queues[1].isComplete = true;
    }
    // check the queues whether if completed and saved the root queues
    const rootQueues: RegexpPart[] = [];
    let ruleInput = '';
    queues.every((queue) => {
      if (!queue.isComplete) {
        throw new Error(
          `the regexp segment ${queue.type} is not completed:${queue.input}`,
        );
      }
      if (queue.parent === null) {
        rootQueues.push(queue);
        ruleInput += queue.getRuleInput();
      }
      return true;
    });
    this.ruleInput = ruleInput;
    this.rootQueues = rootQueues;
    this.queues = queues;
  }
  // check if has repeat flags
  private checkFlags(): void | never {
    const { flags } = this;
    const len = flags.length;
    if (len === 0) {
      return;
    }
    if (len > Object.keys(flagsBinary).length) {
      throw new Error(
        `The rule may has repeated or unrecognized flags<got '${flags.join(
          '',
        )}'>, please check.`,
      );
    }
    const first = flags[0];
    let totalFlagBinary = flagsBinary[first];
    const flagsHash: FlagsHash = {
      [first]: true,
    };
    for (let i = 1, j = flags.length; i < j; i++) {
      const flag = flags[i];
      const binary = flagsBinary[flag];
      if ((totalFlagBinary & binary) === 0) {
        totalFlagBinary += binary;
        flagsHash[flag] = true;
      } else {
        throw new Error(`wrong flag[${i}]:${flag}`);
      }
    }
    this.flagsHash = flagsHash;
    this.totalFlagBinary = totalFlagBinary;
    if (flagsHash.y || flagsHash.m || flagsHash.g) {
      // eslint-disable-next-line no-console
      console.warn(
        `the flags of 'g','m','y' will ignore,but you can set flags such as 'i','u','s'`,
      );
    }
  }
  // check if has the flag
  private hasFlag(flag: Flag) {
    const { totalFlagBinary } = this;
    const binary = flagsBinary[flag];
    return binary && (binary & totalFlagBinary) !== 0;
  }
  // flags hash
  public getFlagsHash(): FlagsHash {
    return this.flagsHash;
  }
}
// make charset
export type CharsetType = 'd' | 'w' | 's';
export type CharsetNegatedType = 'D' | 'W' | 'S';
export type CharsetWordType = 'b' | 'B';
export type CharsetAllType = CharsetType | CharsetNegatedType | CharsetWordType;
export type CharsetCacheType = CharsetNegatedType | 'DOTALL' | 'ALL';
export type CharsetCache = {
  [key in CharsetCacheType]?: CodePointResult;
};
export type CodePointRanges = number[][];
export type CodePointData<T> = {
  [key in CharsetType]: T;
};
export interface CodePointResult {
  ranges: CodePointRanges;
  totals: number[];
}
export interface NumberRange {
  min: number;
  max: number;
}

/**
 *
 *
 * @export
 * @abstract
 * @class RegexpPart
 */

export abstract class RegexpPart {
  public queues: RegexpPart[] = [];
  public codePoint = -1;
  public abstract readonly type: string;
  protected parserInstance: Parser;
  protected min = 1;
  protected max = 1;
  protected dataConf: Partial<BuildConfData> = {};
  protected buildForTimes = false;
  protected curParent: RegexpPart = null;
  protected matchNothing = false;
  protected completed = true;
  constructor(public input: string = '') {}
  // set/get the ref parser
  get parser(): Parser {
    return this.parserInstance;
  }
  set parser(parser: Parser) {
    this.parserInstance = parser;
  }
  // get all possible count
  get count(): number {
    // if (this.isMatchNothing) {
    //   return 0;
    // }
    return this.getCodePointCount();
  }
  // parent getter and setter
  get parent(): RegexpPart {
    return this.curParent;
  }
  set parent(value: RegexpPart) {
    this.curParent = value;
    // ignore special chars
    if (this.type !== 'special') {
      value.add(this);
    }
  }
  // set linked parent
  set linkParent(value: RegexpPart) {
    this.curParent = value;
  }
  // isComplete getter and setter
  get isComplete(): boolean {
    return this.completed;
  }
  set isComplete(value: boolean) {
    this.completed = value;
  }
  // isMatchNothing getter and setter
  get isMatchNothing(): boolean {
    return this.matchNothing;
  }
  set isMatchNothing(value: boolean) {
    this.matchNothing = value;
    if (this.parent) {
      this.parent.isMatchNothing = value;
    }
  }
  public setRange(options: NumberRange): void {
    Object.keys(options).forEach((key: keyof NumberRange) => {
      this[key] = options[key];
    });
  }
  public add(target: RegexpPart | RegexpPart[]): void {
    this.queues = this.queues.concat(target);
  }
  //
  public pop(): RegexpPart {
    return this.queues.pop();
  }
  public build(conf: BuildConfData): string | never {
    const { min, max } = this;
    let result = '';
    if (min === 0 && max === 0) {
      // do nothing
    } else {
      let total = min + Math.floor(Math.random() * (max - min + 1));
      if (total !== 0) {
        const makeOnce = () => {
          let cur = this.prebuild(conf);
          if (conf.flags && conf.flags.i) {
            cur = isOptional()
              ? isOptional()
                ? cur.toLowerCase()
                : cur.toUpperCase()
              : cur;
          }
          return cur;
        };
        if (!this.buildForTimes) {
          result = makeOnce().repeat(total);
        } else {
          while (total--) {
            result += makeOnce();
          }
        }
      }
    }
    this.dataConf = conf;
    this.setDataConf(conf, result);
    return result;
  }
  // parse until end
  public untilEnd(_context: string): number | void {
    // will override by sub class
  }
  // set data conf
  public setDataConf(_conf: BuildConfData, _result: string): void {
    // will override by sub class
  }

  // check if this is the ancestor of the target
  public isAncestorOf(target: RegexpPart): boolean {
    do {
      if (target === this) {
        return true;
      }
    } while ((target = target?.parent));
    return false;
  }
  // get last input, remove named group's name.e.g
  public getRuleInput(_parseReference?: boolean): string {
    if (this.queues.length) {
      return this.buildRuleInputFromQueues();
    } else {
      return this.input;
    }
  }
  // build rule input from queues.
  protected buildRuleInputFromQueues(): string {
    return this.queues.reduce((result: string, next: RegexpPart) => {
      return result + next.getRuleInput();
    }, '');
  }
  // build from regex part
  protected prebuild(conf: BuildConfData): string | never {
    if (this.queues.length) {
      return this.queues.reduce((res, cur: RegexpPart) => {
        return res + cur.build(conf);
      }, '');
    } else {
      return '';
    }
  }

  // codePointCount
  protected getCodePointCount(): number {
    return 1;
  }
}

export abstract class RegexpEmpty extends RegexpPart {
  constructor(input?: string) {
    super(input);
    this.min = 0;
    this.max = 0;
  }
}

export abstract class RegexpOrigin extends RegexpPart {
  protected prebuild(): string {
    return this.input;
  }
}

export class RegexpReference extends RegexpPart {
  public readonly type = 'reference';
  public ref: RegexpGroup | null = null;
  public index: number;
  constructor(input: string, public name: string = '') {
    super(input);
    this.index = Number(`${input.slice(1)}`);
  }
  protected prebuild(conf: BuildConfData): string {
    const { ref } = this;
    if (ref === null) {
      return '';
    } else {
      const { captureIndex } = ref as RegexpGroup;
      const { captureGroupData } = conf;
      return captureGroupData.hasOwnProperty(captureIndex)
        ? captureGroupData[captureIndex]
        : '';
    }
  }
}

export class RegexpSpecial extends RegexpEmpty {
  public readonly type = 'special';
  constructor(public readonly special: string) {
    super();
  }
}

export class RegexpLookaround extends RegexpEmpty {
  public readonly type = 'lookaround';
  public readonly looktype: string;
  constructor(input: string) {
    super();
    this.looktype = input;
    this.isComplete = false;
  }
  public getRuleInput(): string {
    return '(' + this.looktype + this.buildRuleInputFromQueues() + ')';
  }
}

export class RegexpAny extends RegexpPart {
  public readonly type = 'any';
  constructor() {
    super('.');
    this.buildForTimes = true;
  }
  protected prebuild(conf: BuildConfData): string {
    return charH.make('.', conf.flags);
  }
}

export class RegexpNull extends RegexpPart {
  public readonly type = 'null';
  constructor() {
    super('\\0');
  }
  protected prebuild(): string {
    return '\x00';
  }
}

export class RegexpBackspace extends RegexpPart {
  public readonly type = 'backspace';
  constructor() {
    super('[\\b]');
  }
  protected prebuild(): string {
    return '\u0008';
  }
}

export class RegexpBegin extends RegexpEmpty {
  public readonly type = 'begin';
}

export class RegexpControl extends RegexpPart {
  public readonly type = 'control';
  constructor(input: string) {
    super(`\\c${input}`);
    this.codePoint = parseInt(input.charCodeAt(0).toString(2).slice(-5), 2);
  }
  protected prebuild(): string {
    return String.fromCharCode(this.codePoint);
  }
}

export class RegexpCharset extends RegexpPart {
  public readonly type = 'charset';
  public readonly charset: CharsetAllType;
  constructor(input: string) {
    super(input);
    this.charset = this.input.slice(-1) as CharsetAllType;
    this.buildForTimes = true;
  }
  protected prebuild(conf: BuildConfData): string {
    const { charset } = this;
    if (charset === 'b' || charset === 'B') {
      // eslint-disable-next-line no-console
      console.warn('please do not use \\b or \\B');
      return '';
    } else {
      // make the charset
      return charH.make(
        charset as CharsetType | CharsetNegatedType,
        conf.flags,
      );
    }
  }
  // charset's maybe character count
  protected getCodePointCount(): number {
    const { parser, charset } = this;
    const { totals } = charH.getCharsetInfo(
      charset as CharsetType | CharsetNegatedType,
      parser.getFlagsHash(),
    );
    return getLastItem(totals);
  }
}

export class RegexpPrint extends RegexpPart {
  public readonly type = 'print';
  protected prebuild(): string {
    return new Function('', `return '${this.input}'`)();
  }
}

export class RegexpAnchor extends RegexpEmpty {
  public readonly type = 'anchor';
  public anchor: string;
  constructor(input: string) {
    super(input);
    this.anchor = input;
    // eslint-disable-next-line no-console
    console.warn(`the anchor of "${this.input}" will ignore.`);
  }
}

export class RegexpChar extends RegexpOrigin {
  public readonly type = 'char';
  constructor(input: string) {
    super(input);
    this.codePoint = input.codePointAt(0);
  }
}

export class RegexpTranslateChar extends RegexpOrigin {
  public readonly type = 'translate';
  constructor(input: string) {
    super(input);
    this.codePoint = input.slice(-1).codePointAt(0);
  }
  protected prebuild(): string {
    return this.input.slice(-1);
  }
}

export class RegexpOctal extends RegexpPart {
  public readonly type = 'octal';
  constructor(input: string) {
    super(input);
    this.codePoint = Number(`0o${input.slice(1)}`);
  }
  protected prebuild(): string {
    return String.fromCodePoint(this.codePoint);
  }
}

export class RegexpRefOrNumber extends RegexpPart {
  public readonly type = 'refornumber';
  constructor(input: string) {
    super(input);
  }
  protected prebuild(): never {
    throw new Error(
      `the "${this.input}" must parse again,either reference or number`,
    );
  }
}

export abstract class RegexpTimes extends RegexpPart {
  public readonly type = 'times';
  protected readonly maxNum: number = Parser.maxRepeat;
  protected greedy = true;
  protected abstract readonly rule: RegExp;
  protected minRepeat = 0;
  protected maxRepeat = 0;
  constructor() {
    super();
    this.isComplete = false;
  }
  set target(target: RegexpPart) {
    target.setRange({
      min: this.minRepeat,
      max: this.maxRepeat,
    });
  }
  public untilEnd(context: string): number {
    if (this.rule.test(context)) {
      const all = RegExp.$1;
      this.isComplete = true;
      this.input = all;
      this.parse();
      return all.length;
    }
    return 0;
  }
  public abstract parse(): void;
}

export class RegexpTimesMulti extends RegexpTimes {
  protected rule = /^(\{(\d+)(,|,(\d*))?}(\??))/;
  public parse(): void {
    const { $2: min, $3: code, $4: max, $5: optional } = RegExp;
    this.greedy = optional !== '?';
    this.minRepeat = parseInt(min, 10);
    this.maxRepeat = Number(max)
      ? parseInt(max, 10)
      : code
      ? this.minRepeat + this.maxNum * 2
      : this.minRepeat;
    if (this.maxRepeat < this.minRepeat) {
      throw new Error(
        `wrong quantifier: {${this.minRepeat}, ${this.maxRepeat}}`,
      );
    }
  }
}

export class RegexpTimesQuantifiers extends RegexpTimes {
  protected rule = /^(\*\?|\+\?|\?\?|\*|\+|\?)/;
  constructor(protected readonly maxNum: number = Parser.maxRepeat) {
    super();
  }
  public parse(): void {
    const all = RegExp.$1;
    this.greedy = all.length === 1;
    switch (all.charAt(0)) {
      case '*':
        this.maxRepeat = this.maxNum;
        break;
      case '+':
        this.minRepeat = 1;
        this.maxRepeat = this.maxNum;
        break;
      case '?':
        this.maxRepeat = 1;
        break;
    }
  }
}

export class RegexpSet extends RegexpPart {
  public readonly type = 'set';
  public reverse = false;
  private isMatchAnything = false;
  private codePointResult: CodePointResult = null;
  constructor() {
    super();
    this.isComplete = false;
    this.buildForTimes = true;
  }
  // override set parser
  set parser(parser: Parser) {
    this.parserInstance = parser;
    this.makeCodePointResult();
  }
  get parser(): Parser {
    return this.parserInstance;
  }
  //
  get isComplete(): boolean {
    return this.completed;
  }
  set isComplete(value: boolean) {
    this.completed = value;
    if (value === true) {
      const isEmptyQueue = this.queues.length === 0;
      if (isEmptyQueue) {
        if (this.reverse) {
          this.isMatchAnything = true;
        } else {
          this.isMatchNothing = true;
        }
      } else {
        this.makeCodePointResult();
      }
    }
  }
  public getRuleInput(): string {
    return (
      '[' + (this.reverse ? '^' : '') + this.buildRuleInputFromQueues() + ']'
    );
  }
  protected prebuild(conf: BuildConfData): string {
    if (this.isMatchAnything) {
      return new RegexpAny().build(conf);
    }
    const { queues } = this;
    if (this.reverse) {
      return charH.makeOne(this.codePointResult);
    }
    let index: number;
    if (conf.extractSetAverage) {
      let total = 0;
      const totals = queues.map((queue) => (total = total + queue.count));
      index = getRandomTotalIndex(totals).index;
    } else {
      index = makeRandom(0, queues.length - 1);
    }
    return this.queues[index].build(conf) as string;
  }
  // set code point result
  protected makeCodePointResult(): void {
    if (!this.reverse || !this.parser || !this.isComplete) return;
    // with begin ^, reverse the sets
    if (!this.codePointResult) {
      const { queues, parser } = this;
      const flags = parser.getFlagsHash();
      if (
        queues.length === 1 &&
        queues[0].type === 'charset' &&
        ['w', 's', 'd'].includes(
          (queues[0] as RegexpCharset).charset.toLowerCase(),
        )
      ) {
        const charCode =
          (queues[0] as RegexpCharset).charset.charCodeAt(0) ^ 0b100000;
        const charset = String.fromCharCode(charCode) as
          | CharsetType
          | CharsetNegatedType;
        this.codePointResult = charH.getCharsetInfo(charset, flags);
      } else {
        const ranges = queues.reduce(
          (res: CodePointRanges, item: RegexpPart) => {
            const { type } = item;
            let cur: CodePointRanges;
            if (type === 'charset') {
              const charset = (item as RegexpCharset).charset as CharsetAllType;
              if (charset === 'b' || charset === 'B') {
                // eslint-disable-next-line no-console
                console.warn('the charset \\b or \\B will ignore');
                cur = [];
              } else {
                cur = charH.getCharsetInfo(charset, flags).ranges.slice(0);
              }
            } else if (type === 'range') {
              cur = [
                (item as RegexpRange).queues.map((e: RegexpPart) => {
                  return e.codePoint;
                }),
              ];
            } else {
              cur = [[item.codePoint]];
            }
            return res.concat(cur);
          },
          [],
        );
        ranges.push([0xd800, 0xdfff], flags.u ? [0x110000] : [0x10000]);
        ranges.sort((a: number[], b: number[]) => {
          return b[0] > a[0] ? -1 : b[0] === a[0] ? (b[1] > a[1] ? 1 : -1) : 1;
        });
        const negated = [];
        let point = 0;
        for (let i = 0, j = ranges.length; i < j; i++) {
          const cur = ranges[i];
          const [start] = cur;
          const end = cur[1] || start;
          if (point < start) {
            negated.push(point + 1 === start ? [point] : [point, start - 1]);
          }
          point = Math.max(end + 1, point);
        }
        if (negated.length === 0) {
          this.isMatchNothing = true;
        } else {
          let total = 0;
          const totals = negated.map((item: number[]) => {
            if (item.length === 1) {
              total += 1;
            } else {
              total += item[1] - item[0] + 1;
            }
            return total;
          });
          this.codePointResult = { totals, ranges: negated };
        }
      }
    }
  }
}

export class RegexpRange extends RegexpPart {
  public readonly type = 'range';
  constructor() {
    super();
    this.isComplete = false;
  }
  public add(target: RegexpPart): void | never {
    super.add(target);
    if (this.queues.length === 2) {
      this.isComplete = true;
      const [prev, next] = this.queues;
      if (prev.codePoint > next.codePoint) {
        throw new Error(
          `invalid range:${prev.getRuleInput()}-${next.getRuleInput()}`,
        );
      }
    }
  }
  public getRuleInput(): string {
    const [prev, next] = this.queues;
    return prev.getRuleInput() + '-' + next.getRuleInput();
  }
  protected prebuild(): string {
    const [prev, next] = this.queues;
    const min = prev.codePoint;
    const max = next.codePoint;
    return String.fromCodePoint(makeRandom(min, max));
  }
  // the range's possible character counts
  protected getCodePointCount(): number {
    const [prev, next] = this.queues;
    const min = prev.codePoint;
    const max = next.codePoint;
    return max - min + 1;
  }
}

export abstract class RegexpHexCode extends RegexpOrigin {
  public readonly type = 'hexcode';
  protected abstract rule: RegExp;
  protected abstract codeType: string;
  public untilEnd(context: string): number {
    const { rule, codeType } = this;
    if (rule.test(context)) {
      const { $1: all, $2: codePoint } = RegExp;
      const lastCode = codePoint || all;
      this.codePoint = Number(`0x${lastCode}`);
      if (this.codePoint > 0x10ffff) {
        throw new Error(
          `invalid unicode code point:\\u{${lastCode}},can not great than 0x10ffff`,
        );
      }
      this.input = `\\${codeType}${all}`;
      return all.length;
    }
    return 0;
  }
}

export class RegexpUnicode extends RegexpHexCode {
  protected rule = /^([0-9A-Fa-f]{4})/;
  protected codeType = 'u';
}

export class RegexpUnicodeAll extends RegexpHexCode {
  protected rule = /^({(0*[0-9A-Fa-f]{1,6})}|[0-9A-Fa-f]{4})/;
  protected codeType = 'u';
}

export class RegexpASCII extends RegexpHexCode {
  protected rule = /^([0-9A-Fa-f]{2})/;
  protected codeType = 'x';
}

export class RegexpGroupItem extends RegexpPart {
  public readonly type = 'group-item';
  constructor(public index: number) {
    super();
  }
  public getRuleInput(parseReference = false): string {
    return this.queues.reduce((res: string, item: RegexpPart) => {
      let cur: string;
      if (
        parseReference &&
        item.type === 'reference' &&
        (item as RegexpReference).ref !== null
      ) {
        cur = (item as RegexpReference).ref.getRuleInput(parseReference);
      } else {
        cur = this.isEndLimitChar(item)
          ? ''
          : item.getRuleInput(parseReference);
      }
      return res + cur;
    }, '');
  }
  public prebuild(conf: BuildConfData): string {
    return this.queues.reduce((res, queue: RegexpPart) => {
      let cur: string;
      if (this.isEndLimitChar(queue)) {
        // eslint-disable-next-line no-console
        console.warn('the ^ and $ of the regexp will ignore');
        cur = '';
      } else {
        cur = queue.build(conf);
      }
      return res + cur;
    }, '');
  }
  //
  private isEndLimitChar(target: RegexpPart) {
    return target.type === 'anchor';
  }
}

export class RegexpGroup extends RegexpPart {
  public readonly type = 'group';
  public captureIndex = 0;
  public captureName = '';
  public queues: RegexpGroupItem[] = [];
  public isRoot = false;
  private curGroupItem: RegexpGroupItem = null;
  private curRule: RegExp | null = null;
  constructor() {
    super();
    this.isComplete = false;
    this.buildForTimes = true;
    this.addNewGroup();
  }
  get isComplete(): boolean {
    return this.completed;
  }
  set isComplete(value: boolean) {
    this.completed = value;
    if (value === true) {
      this.isMatchNothing = this.queues.every((item: RegexpGroupItem) => {
        return item.isMatchNothing;
      });
    }
  }
  // add a new group item
  public addNewGroup(): RegexpGroupItem {
    const { queues } = this;
    const groupItem = new RegexpGroupItem(queues.length);
    this.curGroupItem = groupItem;
    groupItem.parent = this;
    return groupItem;
  }
  // add root group item
  public addRootItem(target: RegexpPart[]): void {
    target.map((item: RegexpPart) => {
      if (item.parent === null) {
        item.parent = this.curGroupItem;
      }
    });
    this.addNewGroup();
  }
  //
  public addItem(target: RegexpPart): void {
    target.parent = this.curGroupItem;
  }
  // override getRuleInput
  public getRuleInput(parseReference = false): string {
    const { queues: groups, captureIndex, isRoot } = this;
    let result = '';
    const segs = groups.map((groupItem) => {
      return groupItem.getRuleInput(parseReference);
    });
    if (captureIndex === 0 && !isRoot) {
      result = '?:' + result;
    }
    result += segs.join('|');
    return isRoot ? result : `(${result})`;
  }
  // build a rule
  protected buildRule(flags: FlagsHash): RegExp | null {
    if (this.curRule) {
      return this.curRule;
    } else {
      const rule = this.getRuleInput(true);
      const flag = Object.keys(flags).join('');
      return (this.curRule = new Function('', `return /^${rule}$/${flag}`)());
    }
  }
  // build string
  protected prebuild(conf: BuildConfData): string {
    const { queues: groups, captureIndex, captureName } = this;
    let result = '';
    const { flags, namedGroupConf } = conf;
    const groupsLen = groups.length;
    const filterGroups: RegexpGroupItem[] = [];
    const overrideGroups: RegexpGroupItem[] = [];
    const overrideValues: string[][] = [];
    let segNamedGroup: RegexpGroupItem;
    let segNamedValue: string[] = [];
    // special build logic, /(?<named_a_b_c_d>a|b|c|d)\k<named_a_b_c_d>/
    if (captureName && captureName.includes('_') && namedGroupConf) {
      const segs = captureName.split('_');
      if (segs.length === groupsLen) {
        let hasGroup = false;
        if (typeof namedGroupConf[captureName] === 'object') {
          const conf = namedGroupConf[captureName] as NamedGroupConf<boolean>;
          segs.forEach((key: string, index: number) => {
            if (typeof conf[key] === 'boolean' && conf[key] === false) {
              // ignore current group
            } else {
              hasGroup = true;
              const groupItem = groups[index];
              if (Array.isArray(conf[key])) {
                overrideGroups.push(groupItem);
                overrideValues.push(conf[key] as string[]);
              } else {
                filterGroups.push(groupItem);
              }
            }
          });
        }
        if (!hasGroup) {
          throw new Error(
            `the specified named group '${captureName}' are all filtered by the config.`,
          );
        } else {
          const overrideItemNum = overrideGroups.length;
          if (overrideItemNum) {
            // use override array
            const index = makeRandom(
              0,
              overrideItemNum + filterGroups.length - 1,
            );
            if (index < overrideItemNum) {
              segNamedGroup = overrideGroups[index];
              segNamedValue = overrideValues[index];
            }
          }
        }
      }
    }
    if (
      captureName &&
      namedGroupConf &&
      namedGroupConf[captureName] &&
      (Array.isArray(namedGroupConf[captureName]) || segNamedGroup)
    ) {
      let namedGroup: string[];
      let curRule: RegExp;
      if (!segNamedGroup) {
        namedGroup = namedGroupConf[captureName] as string[];
        curRule = this.buildRule(flags);
      } else {
        namedGroup = segNamedValue;
        curRule = this.buildRule.call(segNamedGroup, flags);
      }
      const index = makeRandom(0, namedGroup.length - 1);
      result = namedGroup[index];
      if (!curRule.test(result)) {
        throw new Error(
          `the namedGroupConf of ${captureName}'s value "${result}" is not match the rule ${curRule.toString()}`,
        );
      }
    } else {
      const lastGroups = filterGroups.length ? filterGroups : groups;
      const index = makeRandom(0, lastGroups.length - 1);
      const group = lastGroups[index];
      result = group.build(conf);
    }
    if (captureName) {
      conf.namedGroupData[captureName] = result;
    }
    if (captureIndex) {
      conf.captureGroupData[captureIndex] = result;
    }
    return result;
  }
}
