export interface NormalObject<T = unknown> {
    [index: string]: T;
}
export declare type Flag = 'i' | 'm' | 'g' | 'u' | 'y' | 's';
export declare type FlagsHash = {
    [key in Flag]?: boolean;
};
export declare type FlagsBinary = {
    [key in Flag]: number;
};
export declare type NamedGroupConf<T = never> = NormalObject<string[] | T>;
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
export declare type Result = Pick<Parser, 'rule' | 'lastRule' | 'context' | 'flags'> & {
    queues: RegexpPart[];
};
export declare class CharsetHelper {
    static readonly points: CodePointData<CodePointRanges>;
    static readonly lens: CodePointData<number[]>;
    static readonly bigCharPoint: number[];
    static readonly bigCharTotal: number;
    static charsetOfAll(): CodePointResult;
    static charsetOfDotall(): CodePointResult;
    static charsetOfNegated(type: CharsetCacheType): CodePointResult;
    static charsetOf(type: CharsetType): CodePointResult;
    static getCharsetInfo(type: CharsetType | CharsetNegatedType | '.', flags?: FlagsHash): CodePointResult;
    static make(type: CharsetType | CharsetNegatedType | '.', flags?: FlagsHash): string;
    static makeOne(info: CodePointResult): string;
    protected static readonly cache: CharsetCache;
    protected constructor();
}
export declare const parserRule: RegExp;
export declare const regexpRule: RegExp;
export default class Parser {
    readonly rule: string | RegExp;
    private config;
    static maxRepeat: number;
    readonly context: string;
    readonly flags: Flag[];
    readonly lastRule: string;
    private queues;
    private ruleInput;
    private flagsHash;
    private totalFlagBinary;
    private rootQueues;
    private hasLookaround;
    private hasNullRoot;
    constructor(rule: string | RegExp, config?: ParserConf);
    build(): string | never;
    info(): Result;
    private parse;
    private checkFlags;
    private hasFlag;
    getFlagsHash(): FlagsHash;
}
export declare type CharsetType = 'd' | 'w' | 's';
export declare type CharsetNegatedType = 'D' | 'W' | 'S';
export declare type CharsetWordType = 'b' | 'B';
export declare type CharsetAllType = CharsetType | CharsetNegatedType | CharsetWordType;
export declare type CharsetCacheType = CharsetNegatedType | 'DOTALL' | 'ALL';
export declare type CharsetCache = {
    [key in CharsetCacheType]?: CodePointResult;
};
export declare type CodePointRanges = number[][];
export declare type CodePointData<T> = {
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
export declare abstract class RegexpPart {
    input: string;
    queues: RegexpPart[];
    codePoint: number;
    abstract readonly type: string;
    protected parserInstance: Parser;
    protected min: number;
    protected max: number;
    protected dataConf: Partial<BuildConfData>;
    protected buildForTimes: boolean;
    protected curParent: RegexpPart;
    protected matchNothing: boolean;
    protected completed: boolean;
    constructor(input?: string);
    get parser(): Parser;
    set parser(parser: Parser);
    get count(): number;
    get parent(): RegexpPart;
    set parent(value: RegexpPart);
    set linkParent(value: RegexpPart);
    get isComplete(): boolean;
    set isComplete(value: boolean);
    get isMatchNothing(): boolean;
    set isMatchNothing(value: boolean);
    setRange(options: NumberRange): void;
    add(target: RegexpPart | RegexpPart[]): void;
    pop(): RegexpPart;
    build(conf: BuildConfData): string | never;
    untilEnd(_context: string): number | void;
    setDataConf(_conf: BuildConfData, _result: string): void;
    isAncestorOf(target: RegexpPart): boolean;
    getRuleInput(_parseReference?: boolean): string;
    protected buildRuleInputFromQueues(): string;
    protected prebuild(conf: BuildConfData): string | never;
    protected getCodePointCount(): number;
}
export declare abstract class RegexpEmpty extends RegexpPart {
    constructor(input?: string);
}
export declare abstract class RegexpOrigin extends RegexpPart {
    protected prebuild(): string;
}
export declare class RegexpReference extends RegexpPart {
    name: string;
    readonly type = "reference";
    ref: RegexpGroup | null;
    index: number;
    constructor(input: string, name?: string);
    protected prebuild(conf: BuildConfData): string;
}
export declare class RegexpSpecial extends RegexpEmpty {
    readonly special: string;
    readonly type = "special";
    constructor(special: string);
}
export declare class RegexpLookaround extends RegexpEmpty {
    readonly type = "lookaround";
    readonly looktype: string;
    constructor(input: string);
    getRuleInput(): string;
}
export declare class RegexpAny extends RegexpPart {
    readonly type = "any";
    constructor();
    protected prebuild(conf: BuildConfData): string;
}
export declare class RegexpNull extends RegexpPart {
    readonly type = "null";
    constructor();
    protected prebuild(): string;
}
export declare class RegexpBackspace extends RegexpPart {
    readonly type = "backspace";
    constructor();
    protected prebuild(): string;
}
export declare class RegexpBegin extends RegexpEmpty {
    readonly type = "begin";
}
export declare class RegexpControl extends RegexpPart {
    readonly type = "control";
    constructor(input: string);
    protected prebuild(): string;
}
export declare class RegexpCharset extends RegexpPart {
    readonly type = "charset";
    readonly charset: CharsetAllType;
    constructor(input: string);
    protected prebuild(conf: BuildConfData): string;
    protected getCodePointCount(): number;
}
export declare class RegexpPrint extends RegexpPart {
    readonly type = "print";
    protected prebuild(): string;
}
export declare class RegexpAnchor extends RegexpEmpty {
    readonly type = "anchor";
    anchor: string;
    constructor(input: string);
}
export declare class RegexpChar extends RegexpOrigin {
    readonly type = "char";
    constructor(input: string);
}
export declare class RegexpTranslateChar extends RegexpOrigin {
    readonly type = "translate";
    constructor(input: string);
    protected prebuild(): string;
}
export declare class RegexpOctal extends RegexpPart {
    readonly type = "octal";
    constructor(input: string);
    protected prebuild(): string;
}
export declare class RegexpRefOrNumber extends RegexpPart {
    readonly type = "refornumber";
    constructor(input: string);
    protected prebuild(): never;
}
export declare abstract class RegexpTimes extends RegexpPart {
    readonly type = "times";
    protected readonly maxNum: number;
    protected greedy: boolean;
    protected abstract readonly rule: RegExp;
    protected minRepeat: number;
    protected maxRepeat: number;
    constructor();
    set target(target: RegexpPart);
    untilEnd(context: string): number;
    abstract parse(): void;
}
export declare class RegexpTimesMulti extends RegexpTimes {
    protected rule: RegExp;
    parse(): void;
}
export declare class RegexpTimesQuantifiers extends RegexpTimes {
    protected readonly maxNum: number;
    protected rule: RegExp;
    constructor(maxNum?: number);
    parse(): void;
}
export declare class RegexpSet extends RegexpPart {
    readonly type = "set";
    reverse: boolean;
    private isMatchAnything;
    private codePointResult;
    constructor();
    set parser(parser: Parser);
    get parser(): Parser;
    get isComplete(): boolean;
    set isComplete(value: boolean);
    getRuleInput(): string;
    protected prebuild(conf: BuildConfData): string;
    protected makeCodePointResult(): void;
}
export declare class RegexpRange extends RegexpPart {
    readonly type = "range";
    constructor();
    add(target: RegexpPart): void | never;
    getRuleInput(): string;
    protected prebuild(): string;
    protected getCodePointCount(): number;
}
export declare abstract class RegexpHexCode extends RegexpOrigin {
    readonly type = "hexcode";
    protected abstract rule: RegExp;
    protected abstract codeType: string;
    untilEnd(context: string): number;
}
export declare class RegexpUnicode extends RegexpHexCode {
    protected rule: RegExp;
    protected codeType: string;
}
export declare class RegexpUnicodeAll extends RegexpHexCode {
    protected rule: RegExp;
    protected codeType: string;
}
export declare class RegexpASCII extends RegexpHexCode {
    protected rule: RegExp;
    protected codeType: string;
}
export declare class RegexpGroupItem extends RegexpPart {
    index: number;
    readonly type = "group-item";
    constructor(index: number);
    getRuleInput(parseReference?: boolean): string;
    prebuild(conf: BuildConfData): string;
    private isEndLimitChar;
}
export declare class RegexpGroup extends RegexpPart {
    readonly type = "group";
    captureIndex: number;
    captureName: string;
    queues: RegexpGroupItem[];
    isRoot: boolean;
    private curGroupItem;
    private curRule;
    constructor();
    get isComplete(): boolean;
    set isComplete(value: boolean);
    addNewGroup(): RegexpGroupItem;
    addRootItem(target: RegexpPart[]): void;
    addItem(target: RegexpPart): void;
    getRuleInput(parseReference?: boolean): string;
    protected buildRule(flags: FlagsHash): RegExp | null;
    protected prebuild(conf: BuildConfData): string;
}
