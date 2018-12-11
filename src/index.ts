// utils
const isOptional = () => {
  return Math.random() >= 0.5;
};
const makeRandom = (min: number, max: number): number => {
  if(min === max) {
    return min;
  } else {
    return min + Math.floor(Math.random() * (max + 1 - min));
  }
};
const getLastItem = (arr: any[]) => {
  return arr[arr.length - 1];
};
//
export interface NormalObject {
  [index: string]: any;
}
export type Flag = 'i' | 'm' | 'g' | 'u' | 'y' | 's';
export type FlagsHash = {
  [key in Flag]?: boolean;
};
export type FlagsBinary = {
  [key in Flag]: number;
};
export interface ParserConf {
  namedGroupConf?: NormalObject;
}
export interface BuildConfData extends ParserConf {
  flags: FlagsHash;
  namedGroupData: NormalObject;
  captureGroupData: NormalObject;
  beginWiths: string[];
  endWiths: string[];
}
// tslint:disable-next-line:max-classes-per-file
class CharsetHelper {
  public static readonly points: CodePointData<CodePointRanges> = {
    d: [[48, 57]],
    w: [[48, 57], [65, 90], [95], [97, 122]],
    s: [[0x0009, 0x000c], [0x0020], [0x00a0], [0x1680], [0x180e],
        [0x2000, 0x200a], [0x2028, 0x2029], [0x202f], [0x205f], [0x3000], [0xfeff],
       ],
  };
  public static readonly lens: CodePointData<number[]> = {
    d: [10],
    w: [10, 36, 37, 63],
    s: [4, 5, 6, 7, 8, 18, 20, 21, 22, 23, 24],
  };
  public static readonly bigCharPoint: number[] = [0x10000, 0x10ffff];
  public static readonly bigCharTotal: number = 0x10ffff - 0x10000 + 1;
  //
  public static charsetOfAll(): CodePointResult {
    return CharsetHelper.charsetOfNegated('ALL');
  }
  //
  public static charsetOfDotall(): CodePointResult {
    return CharsetHelper.charsetOfNegated('DOTALL');
  }
  //
  public static charsetOfNegated(type: CharsetCacheType): CodePointResult {
    const { points, cache } = CharsetHelper;
    if(cache[type]) {
      return cache[type];
    } else {
      let start = 0x0000;
      const max = 0xDBFF;
      const nextStart = 0xE000;
      const nextMax = 0xFFFF;
      const ranges: CodePointRanges = [];
      const totals: number[] = [];
      let total = 0;
      const add = (begin: number, end: number) => {
        const num = end - begin + 1;
        if(num <= 0) {
          return;
        } else if(num === 1) {
          ranges.push([begin]);
        } else {
          ranges.push([begin, end]);
        }
        total += num;
        totals.push(total);
      };
      if(type === 'DOTALL') {
        add(start, max);
        add(nextStart, nextMax);
      } else {
        // tslint:disable-next-line:max-line-length
        const excepts = type === 'ALL' ? [[0x000a], [0x000d], [0x2028, 0x2029]] : points[type.toLowerCase() as CharsetType];
        const specialNum = type === 'S' ? 1 : 0;
        while(start <= max && excepts.length > specialNum) {
          const [begin, end] = excepts.shift();
          add(start, begin - 1);
          start = (end || begin) + 1;
        }
        if(start < max) {
          add(start, max);
        }
        if(type === 'S') {
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
  public static charsetOf(type: CharsetType) {
    const { lens, points } = CharsetHelper;
    return {
      ranges: points[type],
      totals: lens[type],
    };
  }
  //
  public static getCharsetInfo(type: CharsetType | CharsetNegatedType | '.', flags: FlagsHash = {}): CodePointResult {
    let result: CodePointResult;
    let last: CodePointResult;
    const helper = CharsetHelper;
    if(['w', 'd', 's'].indexOf(type) > -1) {
      last = helper.charsetOf(type as CharsetType);
    } else {
      if(type === '.') {
        if(flags.s) {
          result = helper.charsetOfDotall();
        } else {
          result = helper.charsetOfAll();
        }
      } else {
        result = helper.charsetOfNegated(type as CharsetNegatedType);
      }
      if(flags.u) {
        last.ranges = result.ranges.slice(0).concat([helper.bigCharPoint]);
        last.totals = result.totals.slice(0).concat(helper.bigCharTotal);
      }
    }
    return last || result;
  }
  // make the type
  public static make(type: CharsetType | CharsetNegatedType | '.', flags: FlagsHash = {}): string {
    return CharsetHelper.makeOne(CharsetHelper.getCharsetInfo(type, flags));
  }
  //
  public static makeOne(info: CodePointResult) {
    const { totals, ranges } = info;
    const total = getLastItem(totals);
    const rand = makeRandom(1, total);
    let nums = totals.length;
    let codePoint: number;
    let index = 0;
    while(nums > 1) {
      const avg = Math.floor(nums / 2);
      const prev = totals[index + avg - 1];
      const next = totals[index + avg];
      if(rand >= prev && rand <= next) {
        // find
        index += avg - (rand === prev ? 1 : 0);
        break;
      } else {
        if(rand > next) {
          // in the right side
          index += avg + 1;
          nums -= (avg + 1);
        } else {
          // in the left side,keep the index
          nums -= avg ;
        }
      }
    }
    codePoint = ranges[index][0] + (rand - (totals[index - 1] || 0)) - 1;
    return String.fromCodePoint(codePoint);
  }
  protected static readonly cache: CharsetCache = {};
  // contructor
  constructor() {
    // do nothing
    return CharsetHelper;
  }
}
const charH = CharsetHelper;
const symbols: NormalObject = {
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
export const parserRule = new RegExp(`^\/(?:\\\\.|[^\\\\](?!\/)|[^\\\\])+?\/[${flagItems}]*`);
export const regexpRule = new RegExp(`^\/((?:\\\\.|[^\\\\](?!\/)|[^\\\\])+?)\/([${flagItems}]*)$`);
/**
 *
 *
 * @export
 * @class Parser
 */
// tslint:disable-next-line:max-classes-per-file
export default class Parser {
  public readonly context: string = '';
  public readonly flags: Flag[] = [];
  public readonly lastRule: string = '';
  private queues: RegexpPart[] = [];
  private ruleInput: string = '';
  private flagsHash: FlagsHash = {};
  private totalFlagBinary: number = 0;
  private rootQueues: RegexpPart[] = [];
  private hasLookaround: boolean = false;
  constructor(public readonly rule: string, private config: ParserConf = {}) {
    if(regexpRule.test(rule)) {
      this.rule = rule;
      this.context = RegExp.$1;
      this.flags = RegExp.$2 ? (RegExp.$2.split('') as Flag[]) : [];
      this.checkFlags();
      this.parse();
      this.lastRule = this.ruleInput;
    } else {
      throw new Error(`wrong regexp:${rule}`);
    }
  }
  // set configs
  public setConfig(conf: ParserConf) {
    this.config = conf;
  }
  // build
  public build(): string | never {
    if(this.hasLookaround) {
      throw new Error('the build method does not support lookarounds.');
    }
    const { rootQueues } = this;
    const conf: BuildConfData = {
      ...this.config,
      flags: this.flagsHash,
      namedGroupData: {},
      captureGroupData: {},
      beginWiths: [],
      endWiths: [],
    };
    return rootQueues.reduce((res, queue) => {
      return res + queue.build(conf);
    }, '');
  }
  // get all info
  public info() {
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
    let i: number = 0;
    const j: number = context.length;
    const queues: RegexpPart[] = [new RegexpBegin()];
    const groups: RegexpGroup[] = [];
    const lookarounds: RegexpLookaround[] = [];
    const captureGroups: RegexpGroup[] = [];
    const refGroups: {[index: string]: RegexpGroup | null } = {};
    const captureRule = /^(\?(?:<(.+?)>|:))/;
    const lookaroundRule = /^(\?(?:<=|<!|=|!))/;
    const hasFlagU = this.hasFlag('u');
    const nestQueues: RegexpPart[] = [];
    let groupCaptureIndex: number = 0;
    let curSet: RegexpSet = null;
    let curRange: RegexpRange = null;
    const addToGroup = (cur: RegexpPart) => {
      if(groups.length || lookarounds.length) {
        // tslint:disable-next-line:max-line-length
        const isGroup = getLastItem(nestQueues).type === 'group';
        const curQueue = isGroup ? getLastItem(groups) : getLastItem(lookarounds);
        if(isGroup) {
          curQueue.addItem(cur);
        } else {
          cur.parent = curQueue;
        }
      }
    };
    // /()/
    while(i < j) {
      // current character
      const char: string = context.charAt(i++);
      // when in set,ignore these special chars
      if((curRange || curSet) && ['[', '(', ')', '|', '*', '?', '+', '{', '.', '}', '^', '$', '/'].indexOf(char) > -1) {
        const newChar = new RegexpChar(char);
        if(curRange) {
          newChar.parent = curRange;
          curRange = null;
        } else {
          newChar.parent = curSet;
        }
        queues.push(newChar);
        continue;
      }
      // match more
      const nextAll: string = context.slice(i);
      const lastGroup = getLastItem(groups);
      const lastQueue = getLastItem(queues);
      let target = null;
      let special: RegexpPart = null;
      switch(char) {
        // match translate first,match "\*"
        case s.translate:
          // move one char
          const next = context.charAt(i++);
          const input = char + next;
          if(next === 'u' || next === 'x') {
            // unicode,ascii,if has u flag,can also match ${x{4}|x{6}}
            target = next === 'x' ? new RegexpASCII() : (hasFlagU ? new RegexpUnicodeAll() : new RegexpUnicode());
            const matchedNum: number = target.untilEnd(context.slice(i));
            if(matchedNum === 0) {
              // not regular unicode,"\uzyaa"
              target = new RegexpIgnore(`\\${next}`);
            } else {
              // is unicode,move matchedNum steps
              i += matchedNum;
            }
          } else if(next === 'c') {
            // control char
            // https://github.com/tc39/ecma262/pull/864
            // https://github.com/Microsoft/ChakraCore/commit/4374e4407b12fa18e9795ce1ca0869affccb85fe
            const code = context.charAt(i);
            if(hasFlagU) {
              if(/[a-zA-Z]/.test(code)) {
                target = new RegexpControl(code);
                i++;
              } else {
                throw new Error(`invalid unicode escape,unexpect control character[${i}]:\\c${code}`);
              }
            } else {
              if(/\w/.test(code)) {
                target = new RegexpControl(code);
                i++;
              } else {
                target = new RegexpChar('\\');
              }
            }
          } else if(['d', 'D', 'w', 'W', 's', 'S', 'b', 'B'].indexOf(next) > -1) {
            // charsets
            target = new RegexpCharset(input);
          } else if(['t', 'r', 'n', 'f', 'v'].indexOf(next) > -1) {
            // print chars
            target = new RegexpPrint(input);
          } else if(/^(\d+)/.test(nextAll)) {
            const no = RegExp.$1;
            if(curSet) {
              // in set, "\" + \d will parse as octal,max 0377
              if(/^(0[0-7]{0,2}|[1-3][0-7]{0,2}|[4-7][0-7]?)/.test(no)) {
                const octal = RegExp.$1;
                target = new RegexpOctal(`\\${octal}`);
                i += octal.length - 1;
              } else {
                target = new RegexpTranslateChar(`\\${no.charAt(0)}`);
              }
            } else {
              // reference
              if(no.charAt(0) === '0') {
                target = new RegexpNull();
              } else {
                i += no.length - 1;
                target = new RegexpReference(`\\${no}`);
                const refGroup = captureGroups[+no - 1];
                refGroups[no] = refGroup;
                if(refGroup) {
                  if(refGroup.isAncestorOf(lastGroup)) {
                    target.ref = null;
                  } else {
                    target.ref = refGroup;
                  }
                } else {
                  target.ref = null;
                  target.isMatchNothing = true;
                }
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
          if(isLookaround) {
            const lookType = RegExp.$1;
            target = new RegexpLookaround(lookType);
            special = new RegexpSpecial('lookaroundBegin');
            this.hasLookaround = true;
            i += lookType.length;
          } else {
            target = new RegexpGroup();
            special = new RegexpSpecial('groupBegin');
          }
          nestQueues.push(target);
          if(!isLookaround) {
            target = target as RegexpGroup;
            // get capture info
            if(captureRule.test(nextAll)) {
              const { $1: all, $2: captureName } = RegExp;
              if(all === '?:') {
                // do nothing, captureIndex = 0 by default
              } else {
                // named group
                target.captureIndex = ++groupCaptureIndex;
                target.captureName = captureName;
              }
              i += all.length;
            } else {
              target.captureIndex = ++groupCaptureIndex;
            }
            if(target.captureIndex > 0) {
              captureGroups.push(target);
            }
          }
          break;
        // match group end ")"
        case s.groupEnd:
          if(nestQueues.length) {
            const curNest = nestQueues.pop();
            if(!curNest || ['group', 'lookaround'].indexOf(curNest.type) < 0) {
              throw new Error(`unexpected capture end.`);
            }
            const last = (curNest.type === 'group' ? groups : lookarounds).pop();
            if(last) {
              last.isComplete = true;
              special = new RegexpSpecial(`${curNest.type}End`);
              special.parent = last;
            }
          } else {
            throw new Error(`unmatched ${char},you mean "\\${char}"?`);
          }
          break;
        // match group splitor "|"
        case s.groupSplitor:
          const group = getLastItem(groups);
          if(!group) {
            target = new RegexpGroup();
            target.isRoot = true;
            target.addNewGroup(queues.splice(0, queues.length, target));
            groups.push(target);
          } else {
            group.addNewGroup();
          }
          special = new RegexpSpecial('groupSplitor');
          break;
        // match set begin "["
        case s.setBegin:
          if(/^\\b]/.test(nextAll)) {
            target = new RegexpBackspace();
            i += 3;
          } else {
            curSet = new RegexpSet();
            if(nextAll.charAt(0) === '^') {
              curSet.reverse = true;
              i += 1;
            }
            queues.push(curSet);
            addToGroup(curSet);
            special = new RegexpSpecial('setBegin');
            special.parent = curSet;
          }
          break;
        // match set end "]"
        case s.setEnd:
          if(curSet) {
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
          if(curSet) {
            if(lastQueue.codePoint < 0) {
              // such as [-aaa] [^-a] [\s-a]
              target = new RegexpChar(char);
            } else {
              const nextChar = nextAll.charAt(0);
              if(nextChar === s.setEnd ) {
                curSet.isComplete = true;
                curSet = null;
                i += 1;
              } else {
                curSet.pop();
                curRange = new RegexpRange();
                curRange.parent = curSet;
                queues.pop().parent = curRange;
                queues.push(curRange, lastQueue);
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
          target = char === s.multipleBegin ? new RegexpTimesMulti() : new RegexpTimesQuantifiers();
          const num = target.untilEnd(context.slice(i - 1));
          if(num > 0) {
            const type = lastQueue.special || lastQueue.type;
            const error = `[${lastQueue.input}]nothing to repeat[index:${i}]:${context.slice(i - 1, i - 1 + num)}`;
            // tslint:disable-next-line:max-line-length
            if(type === 'groupStart' || type === 'groupSplitor' || type === 'times' || type === 'multipleOptional' || type === 'begin' || (type === 'charset' && lastQueue.charset.toLowerCase() === 'b')) {
              throw new Error(error);
            } else if(type === 'multipleEnd') {
              // allow {1,2}?,??,but not allow ?+,{1,2}+,
              if(char === s.optional) {
                target = new RegexpIgnore('\\?');
                special = new RegexpSpecial('multipleOptional');
              } else {
                throw new Error(error);
              }
            } else {
              i += num - 1;
              if(char === s.multipleBegin || char === s.optional) {
                special = new RegexpSpecial('multipleEnd');
              }
              if(type === 'groupEnd' || type === 'setEnd') {
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
        // match /
        case s.delimiter:
          throw new Error(`unexpected pattern end delimiter:"/${nextAll}"`);
          break;
        // default
        default:
          target = new RegexpChar(char);
      }
      // push target to queues
      if(target) {
        const cur = target as RegexpPart;
        queues.push(cur);
        if(curRange) {
          if(target.codePoint < 0) {
            // not char,translateChar,control char,or octal
            const [range, first, rangeSplitor, second] = queues.splice(-4, 4);
            const middle = new RegexpChar('-');
            curSet.pop();
            [first, middle, second].map((item: RegexpPart) => {
              item.parent = curSet;
              queues.push(item);
              return item;
            });
          } else {
            target.parent = curRange;
          }
          curRange = null;
        } else if(curSet) {
          cur.parent = curSet;
        } else {
          addToGroup(cur);
        }
        if(['group', 'lookaround'].indexOf(cur.type) > -1) {
          const lists = cur.type === 'group' ? groups : lookarounds;
          (lists as RegexpPart[]).push(cur);
        }
      }
      // add special
      if(special) {
        if(target) {
          special.parent = target;
        }
        queues.push(special);
      }
    }
    // if root group,set completed when parse end
    if(queues.length === 1 && queues[0].type === 'group') {
      const group = queues[0] as RegexpGroup;
      if(group.isRoot === true) {
        group.isComplete = true;
      }
    }
    // check the queues whether if completed and saved the root queues
    const rootQueues: RegexpPart[] = [];
    let ruleInput = '';
    queues.every((queue) => {
      if(!queue.isComplete) {
        throw new Error(`the regexp segment ${queue.type} is not completed:${queue.input}`);
      }
      if(queue.parent === null) {
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
    if(len === 0) {
      return;
    }
    if(len > Object.keys(flagsBinary).length) {
      throw new Error(`the rule has repeat flag,please check.`);
    }
    const first = flags[0];
    let totalFlagBinary = flagsBinary[first];
    const flagsHash: FlagsHash = {
      [first]: true,
    };
    for(let i = 1, j = flags.length; i < j; i++) {
      const flag = flags[i];
      const binary = flagsBinary[flag];
      if((totalFlagBinary & binary) === 0) {
        totalFlagBinary += binary;
        flagsHash[flag] = true;
      } else {
        throw new Error(`wrong flag[${i}]:${flag}`);
      }
    }
    this.flagsHash = flagsHash;
    this.totalFlagBinary = totalFlagBinary;
    if(flagsHash.y || flagsHash.m || flagsHash.g) {
      // tslint:disable-next-line:no-console
      console.warn(`the flags of 'g','m','y' will ignore,but you can set flags such as 'i','u','s'`);
    }
  }
  // check if has the flag
  private hasFlag(flag: Flag) {
    const { totalFlagBinary } = this;
    const binary = flagsBinary[flag];
    return binary && (binary & totalFlagBinary) !== 0;
  }
}
// make charset
type CharsetType = 'd' | 'w' | 's';
type CharsetNegatedType = 'D' | 'W' | 'S';
type CharsetWordType = 'b' | 'B';
type CharsetAllType = CharsetType | CharsetNegatedType | CharsetWordType;
type CharsetCacheType = CharsetNegatedType | 'DOTALL' | 'ALL';
type CharsetCache = {
  [key in CharsetCacheType]?: CodePointResult
};
type CodePointRanges = number[][];
type CodePointData<T> = {
  [key in CharsetType]: T
};
interface CodePointResult {
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
// tslint:disable-next-line:max-classes-per-file
export abstract class RegexpPart {
  public queues: RegexpPart[] = [];
  public codePoint: number = -1;
  public abstract readonly type: string;
  protected min: number = 1;
  protected max: number = 1;
  protected dataConf: NormalObject = {};
  protected buildForTimes: boolean = false;
  protected curParent: RegexpPart = null;
  protected matchNothing: boolean = false;
  protected completed: boolean = true;
  constructor(public input: string = '') {}
  get parent() {
    return this.curParent;
  }
  set parent(value: RegexpPart) {
    this.curParent = value;
    // ignore special chars
    if(this.type !== 'special') {
      value.add(this);
    }
  }
  get isComplete() {
    return this.completed;
  }
  set isComplete(value: boolean) {
    this.completed = value;
  }
  get isMatchNothing() {
    return this.matchNothing;
  }
  set isMatchNothing(value: boolean) {
    this.matchNothing = value;
    if(this.parent) {
      this.parent.isMatchNothing = value;
    }
  }
  public setRange(options: NumberRange) {
    Object.keys(options).forEach((key: keyof NumberRange) => {
      this[key] = options[key];
    });
  }
  public add(target: RegexpPart | RegexpPart[]): void {
    this.queues = this.queues.concat(target);
  }
  //
  public pop() {
    return this.queues.pop();
  }
  public build(conf: BuildConfData): string | never {
    const { min, max } = this;
    let result = '';
    if(min === 0 && max === 0) {
      // do nothing
    } else {
      let total =  min + Math.floor(Math.random() * (max - min + 1));
      if(total !== 0) {
        const makeOnce = () => {
          let cur = this.prebuild(conf);
          if(conf.flags && conf.flags.i) {
            cur = isOptional() ? (isOptional() ? cur.toLowerCase() : cur.toUpperCase()) : cur;
          }
          return cur;
        };
        if(!this.buildForTimes) {
          result = makeOnce().repeat(total);
        } else {
          while(total--) {
            result += makeOnce();
          }
        }
      }
    }
    this.dataConf = conf;
    this.setDataConf(conf, result);
    return result;
  }
  //
  public setDataConf(conf: BuildConfData, result: string): void {
    // override by child
  }
  // toString
  public toString() {
    return this.input;
  }
  // parse until end
  public untilEnd(context: string) {
    // override by child
  }
  // check if this is the ancestor of the target
  public isAncestorOf(target: RegexpPart): boolean {
    do {
      if(target === this) {
        return true;
      }
    } while( target = (target ? target.parent : null));
    return false;
  }
  // get last input, remove named group's name.e.g
  public getRuleInput(parseReference?: boolean): string {
    if(this.queues.length) {
      return this.buildRuleInputFromQueues();
    } else {
      return this.input;
    }
  }
  //
  protected buildRuleInputFromQueues(): string {
    return this.queues.reduce((result: string, next: RegexpPart) => {
      return result + next.getRuleInput();
    }, '');
  }
  // when
  protected prebuild(conf: BuildConfData): string | never {
    if(this.queues.length) {
      return this.queues.reduce((res, cur: RegexpPart) => {
        return res + cur.build(conf);
      }, '');
    } else {
      return '';
    }
  }
}

// tslint:disable-next-line:max-classes-per-file
export abstract class RegexpEmpty extends RegexpPart {
  constructor(input?: string) {
    super(input);
    this.min = 0;
    this.max = 0;
  }
}
// tslint:disable-next-line:max-classes-per-file
export abstract class RegexpOrigin extends RegexpPart {
  protected prebuild() {
    return this.input;
  }
}
// tslint:disable-next-line:max-classes-per-file
export class RegexpReference extends RegexpPart {
  public readonly type = 'reference';
  public ref: RegexpGroup | null = null;
  public index: number;
  constructor(input: string) {
    super(input);
    this.index = Number(`${input.slice(1)}`);
  }
  protected prebuild(conf: BuildConfData) {
    const { ref } = this;
    if(ref === null) {
      return '';
    } else {
      const { captureIndex } = ref as RegexpGroup;
      const { captureGroupData } = conf;
      return captureGroupData[captureIndex];
    }
  }
}
// tslint:disable-next-line:max-classes-per-file
export class RegexpSpecial extends RegexpEmpty {
  public readonly type = 'special';
  constructor(public readonly special: string) {
    super();
  }
}
// tslint:disable-next-line:max-classes-per-file
export class RegexpLookaround extends RegexpEmpty {
  public readonly type = 'lookaround';
  public readonly looktype: string;
  constructor(input: string) {
    super();
    this.looktype = input;
    this.isComplete = false;
  }
  public getRuleInput() {
    return '(' + this.looktype + this.buildRuleInputFromQueues() + ')';
  }
}
// tslint:disable-next-line:max-classes-per-file
export class RegexpAny extends RegexpPart {
  public readonly type = 'any';
  constructor() {
    super('.');
    this.buildForTimes = true;
  }
  protected prebuild(conf: BuildConfData) {
    return charH.make('.', conf.flags);
  }
}
// tslint:disable-next-line:max-classes-per-file
export class RegexpNull extends RegexpPart {
  public readonly type = 'null';
  constructor() {
    super('\\0');
  }
  protected prebuild() {
    return '\x00';
  }
}
// tslint:disable-next-line:max-classes-per-file
export class RegexpBackspace extends RegexpPart {
  public readonly type = 'backspace';
  constructor() {
    super('[\\b]');
  }
  protected prebuild() {
    return '\u0008';
  }
}
// tslint:disable-next-line:max-classes-per-file
export class RegexpBegin extends RegexpEmpty {
  public readonly type = 'begin';
}
// tslint:disable-next-line:max-classes-per-file
export class RegexpControl extends RegexpPart {
  public readonly type = 'control';
  constructor(input: string) {
    super(`\\c${input}`);
    this.codePoint = parseInt(input.charCodeAt(0).toString(2).slice(-5), 2);
  }
  protected prebuild() {
    return String.fromCharCode(this.codePoint);
  }
}
// tslint:disable-next-line:max-classes-per-file
export class RegexpCharset extends RegexpPart {
  public readonly type = 'charset';
  public readonly charset: CharsetAllType;
  constructor(input: string) {
    super(input);
    this.charset = this.input.slice(-1) as CharsetAllType;
    this.buildForTimes = true;
  }
  protected prebuild(conf: BuildConfData) {
    const { charset } = this;
    if(charset === 'b' || charset === 'B') {
      // tslint:disable-next-line:no-console
      console.warn('please do not use \\b or \\B');
      return '';
    } else {
      // make the charset
      return charH.make(charset as (CharsetType | CharsetNegatedType), conf.flags);
    }
  }
}
// tslint:disable-next-line:max-classes-per-file
export class RegexpPrint extends RegexpPart {
  public readonly type = 'print';
  protected prebuild() {
    return this.input;
  }
}
// tslint:disable-next-line:max-classes-per-file
export class RegexpIgnore extends RegexpEmpty {
  public readonly type = 'ignore';
  protected prebuild() {
    // tslint:disable-next-line:no-console
    console.warn(`the "${this.input}" will ignore.`);
    return '';
  }
}
// tslint:disable-next-line:max-classes-per-file
export class RegexpChar extends RegexpOrigin {
  public readonly type = 'char';
  constructor(input: string) {
    super(input);
    this.codePoint = input.codePointAt(0);
  }
}
// tslint:disable-next-line:max-classes-per-file
export class RegexpTranslateChar extends RegexpOrigin {
  public readonly type = 'translate';
  constructor(input: string) {
    super(input);
    this.codePoint = input.slice(-1).codePointAt(0);
  }
  protected prebuild() {
    return this.input.slice(-1);
  }
}
// tslint:disable-next-line:max-classes-per-file
export class RegexpOctal extends RegexpPart {
  public readonly type = 'octal';
  constructor(input: string) {
    super(input);
    this.codePoint = Number(`0o${input.slice(1)}`);
  }
  protected prebuild() {
    return String.fromCodePoint(this.codePoint);
  }
}
// tslint:disable-next-line:max-classes-per-file
export abstract class RegexpTimes extends RegexpPart {
  public readonly type = 'times';
  protected readonly maxNum: number = 5;
  protected greedy: boolean = true;
  protected abstract readonly rule: RegExp;
  protected minRepeat: number = 0;
  protected maxRepeat: number = 0;
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
  public untilEnd(context: string) {
    if(this.rule.test(context)) {
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
// tslint:disable-next-line:max-classes-per-file
export class RegexpTimesMulti extends RegexpTimes {
  protected rule = /^(\{(\d+)(,(\d*))?})/;
  public parse() {
    const { $2: min, $3: code, $4: max} = RegExp;
    this.minRepeat = parseInt(min, 10);
    this.maxRepeat = Number(max) ? parseInt(max, 10) : (code ? this.minRepeat + this.maxNum * 2 : this.minRepeat);
  }
}
// tslint:disable-next-line:max-classes-per-file
export class RegexpTimesQuantifiers extends RegexpTimes {
  protected rule = /^(\*\?|\+\?|\*|\+|\?)/;
  public parse() {
    const all = RegExp.$1;
    this.greedy = all.length === 1;
    switch(all.charAt(0)) {
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
// tslint:disable-next-line:max-classes-per-file
export class RegexpSet extends RegexpPart {
  public readonly type = 'set';
  public reverse: boolean = false;
  private isMatchAnything: boolean = false;
  private codePointResult: CodePointResult = null;
  constructor() {
    super();
    this.isComplete = false;
    this.buildForTimes = true;
  }
  get isComplete() {
    return this.completed;
  }
  set isComplete(value: boolean) {
    this.completed = value;
    if(value === true && this.queues.length === 0) {
      if(this.reverse) {
        this.isMatchAnything = true;
      } else {
        this.isMatchNothing = true;
      }
    }
  }
  public isSetStart() {
    return this.queues.length === 0;
  }
  public getRuleInput() {
    return '[' + (this.reverse ? '^' : '')   + this.buildRuleInputFromQueues() + ']';
  }
  protected prebuild(conf: BuildConfData) {
    const index = makeRandom(0, this.queues.length - 1);
    if(this.isMatchAnything) {
      return (new RegexpAny()).build(conf);
    }
    if(this.matchNothing) {
      // tslint:disable-next-line:no-console
      console.warn('the empty set will match nothing:[]');
      return '';
    }
    if(this.reverse) {
      // reverse
      if(!this.codePointResult) {
        const ranges = this.queues.reduce((res: CodePointRanges, item: RegexpPart) => {
          const { type } = item;
          let cur: any[];
          if(type === 'charset') {
            // tslint:disable-next-line:max-line-length
            const charset = (item as RegexpCharset).charset as CharsetAllType;
            if(charset === 'b' || charset === 'B') {
              // tslint:disable-next-line:no-console
              console.warn('the charset \\b or \\B will ignore');
              cur = [];
            } else {
              cur = charH.getCharsetInfo(charset, conf.flags).ranges;
            }
          } else if(type === 'range') {
            cur = [(item as RegexpRange).queues.map((e: RegexpPart) => {
              return e.codePoint;
            })];
          } else {
            cur = [[item.codePoint]];
          }
          return res.concat(cur);
        }, []);
        ranges.push([0xD800, 0xDFFF], conf.flags.u ? [0x110000] : [0x10000]);
        ranges.sort((a: number[], b: number[]) => {
          return b[0] > a[0] ? -1 : (b[0] === a[0] ? (b[1] > a[1] ? 1 : -1) : 1);
        });
        const negated = [];
        let point = 0;
        for(let i = 0, j = ranges.length; i < j; i++) {
          const cur = ranges[i];
          const [start] = cur;
          const end = cur[1] || start;
          if(point < start) {
            negated.push(point + 1 === start ? [point] : [point, start - 1]);
          }
          point = Math.max(end + 1, point);
        }
        if(negated.length === 0) {
          this.isMatchNothing = true;
        } else {
          let total = 0;
          const totals = negated.map((item: number[]) => {
            if(item.length === 1) {
              total += 1;
            } else {
              total += item[1] - item[0] + 1;
            }
            return total;
          });
          this.codePointResult = { totals, ranges: negated };
        }
      }
      if(this.isMatchNothing) {
        // tslint:disable-next-line:no-console
        console.error('the rule is match nothing');
        return '';
      }
      return charH.makeOne(this.codePointResult);
    }
    return this.queues[index].build(conf) as string;
  }
}
// tslint:disable-next-line:max-classes-per-file
export class RegexpRange extends RegexpPart {
  public readonly type = 'range';
  constructor() {
    super();
    this.isComplete = false;
  }
  public add(target: RegexpPart) {
    super.add(target);
    if(this.queues.length === 2) {
      this.isComplete = true;
      const [prev, next] = this.queues;
      if(prev.codePoint > next.codePoint) {
        throw new Error(`invalid range:${prev.getRuleInput()}-${next.getRuleInput()}`);
      }
    }
  }
  public getRuleInput() {
    const [prev, next] = this.queues;
    return prev.getRuleInput() + '-' + next.getRuleInput();
  }
  protected prebuild() {
    const [prev, next] = this.queues;
    const min = prev.codePoint;
    const max = next.codePoint;
    return String.fromCodePoint(makeRandom(min, max));
  }
}
// tslint:disable-next-line:max-classes-per-file
export abstract class RegexpHexCode extends RegexpOrigin {
  public readonly type = 'hexcode';
  protected abstract rule: RegExp;
  protected abstract codeType: string;
  public untilEnd(context: string): number {
    const { rule, codeType } = this;
    if(rule.test(context)) {
      const { $1: all, $2: codePoint } = RegExp;
      const lastCode = codePoint || all;
      this.codePoint = Number(`0x${lastCode}`);
      this.input = `\\${codeType}${all}`;
    }
    return 0;
  }
}
// tslint:disable-next-line:max-classes-per-file
export class RegexpUnicode extends RegexpHexCode {
  protected rule = /^([0-9A-Fa-f]{4})/;
  protected codeType = 'u';
}
// tslint:disable-next-line:max-classes-per-file
export class RegexpUnicodeAll extends RegexpHexCode {
  protected rule = /^({([0-9A-Fa-f]{4}|[0-9A-Fa-f]{6})}|[0-9A-Fa-f]{2})/;
  protected codeType = 'u';
}
// tslint:disable-next-line:max-classes-per-file
export class RegexpASCII extends RegexpHexCode {
  protected rule = /^([0-9A-Fa-f]{2})/;
  protected codeType = 'x';
}
// tslint:disable-next-line:max-classes-per-file
export class RegexpGroupItem extends RegexpPart {
  public readonly type = 'group-item';
  constructor(public index: number) {
    super();
  }
  public getRuleInput(parseReference: boolean = false) {
    return this.queues.reduce((res: string, item: RegexpPart) => {
      let cur: string;
      if(parseReference && item.type === 'reference' && (item as RegexpReference).ref !== null) {
            cur = (item as RegexpReference).ref.getRuleInput(parseReference);
          } else {
            cur = this.isEndLimitChar(item) ? '' : item.getRuleInput(parseReference);
          }
      return  res + cur;
    }, '');
  }
  public prebuild(conf: BuildConfData) {
    return this.queues.reduce((res, queue: RegexpPart) => {
      let cur: string;
      if(this.isEndLimitChar(queue)) {
        // tslint:disable-next-line:no-console
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
    return target.type === 'char' && (target.input === '^' || target.input === '$');
  }
}
// tslint:disable-next-line:max-classes-per-file
export class RegexpGroup extends RegexpPart {
  public readonly type = 'group';
  public captureIndex: number = 0;
  public captureName: string = '';
  public queues: RegexpGroupItem[] = [];
  public isRoot: boolean = false;
  private curGroupItem: RegexpGroupItem = null;
  private curRule: RegExp | null = null;
  constructor() {
    super();
    this.isComplete = false;
    this.buildForTimes = true;
    this.addNewGroup();
  }
  get isComplete() {
    return this.completed;
  }
  set isComplete(value: boolean) {
    this.completed = value;
    if(value === true) {
      this.isMatchNothing = this.queues.every((item: RegexpGroupItem) => {
        return item.isMatchNothing;
      });
    }
  }
  public getCurGroupItem() {
    return this.curGroupItem;
  }
  public addNewGroup(queue?: RegexpPart[]) {
    const { queues } = this;
    let groupItem: RegexpGroupItem;
    if(queue) {
      groupItem = this.curGroupItem;
      queue.map((item: RegexpPart) => {
        item.parent = groupItem;
      });
    } else {
      groupItem = new RegexpGroupItem(queues.length);
      this.curGroupItem = groupItem;
    }
    groupItem.parent = this;
    return groupItem;
  }
  public addItem(target: RegexpPart) {
    target.parent = this.curGroupItem;
  }
  // override getRuleInput
  public getRuleInput(parseReference: boolean = false) {
    const { queues: groups, captureIndex, isRoot  } = this;
    let result = '';
    const segs = groups.map((groupItem) => {
      return groupItem.getRuleInput(parseReference);
    });
    if(captureIndex === 0) {
      result = '?:' + result;
    }
    result += segs.join('|');
    return isRoot ? result : `(${result})`;
  }
  //
  protected buildRule(flags: FlagsHash) {
    if(this.curRule) {
      return this.curRule;
    } else {
      const rule = this.getRuleInput(true);
      const flag = Object.keys(flags).join('');
      return new Function('', `return /^${rule}$/${flag}`)();
    }
  }
  //
  protected prebuild(conf: BuildConfData) {
    const { queues: groups, captureIndex, captureName } = this;
    let result: string = '';
    const { flags, namedGroupConf } = conf;
    const groupsLen = groups.length;
    const filterGroups: RegexpGroupItem[] = (() => {
      let curGroups: RegexpGroupItem[] = [];
      if(captureName && captureName.indexOf(':') > -1 && namedGroupConf) {
        const segs = captureName.split(':');
        if(segs.length === groupsLen) {
          const notInIndexs: number[] = [];
          const inIndexs: number[] = [];
          segs.forEach((key: string, index: number) => {
            if(typeof namedGroupConf[key] === 'boolean') {
              (namedGroupConf[key] === true ? inIndexs : notInIndexs).push(index);
            }
          });
          let lastIndexs: number[] = [];
          if(inIndexs.length) {
            lastIndexs = inIndexs;
          } else if(notInIndexs.length && notInIndexs.length < groupsLen) {
            for(let i = 0; i < groupsLen; i++) {
              if(notInIndexs.indexOf(i) < 0) {
                lastIndexs.push(i);
              }
            }
          }
          if(lastIndexs.length) {
            curGroups = lastIndexs.map((index) => groups[index]);
          }
        }
      }
      return curGroups;
    })();
    if(captureName && namedGroupConf && namedGroupConf[captureName]) {
      const curRule = this.buildRule(flags);
      const index = makeRandom(0, namedGroupConf[captureName].length - 1);
      result = namedGroupConf[captureName][index];
      if(!curRule.test(result)) {
        // tslint:disable-next-line:max-line-length
        throw new Error(`the namedGroupConf of ${captureName}'s value "${result}" is not match the rule ${curRule.toString()}`);
      }
    } else {
      const lastGroups = filterGroups.length ? filterGroups : groups;
      const index = makeRandom(0, lastGroups.length - 1);
      const group = lastGroups[index];
      result = group.build(conf);
    }
    if(captureName) {
      conf.namedGroupData[captureName] = result;
    }
    if(captureIndex) {
      conf.captureGroupData[captureIndex] = result;
    }
    return result;
  }
}
