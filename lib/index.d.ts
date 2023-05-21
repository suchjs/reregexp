declare const SYMBOL_DOTALL = "DOTALL";
declare const SYMBOL_ALL = "ALL";
export interface NormalObject<T = unknown> {
    [index: string]: T;
}
export type $N = `$${1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9}`;
export type Flag = 'i' | 'm' | 'g' | 'u' | 'y' | 's' | 'd';
export type FlagsHash = {
    [key in Flag]?: boolean;
};
export type FlagsBinary = {
    [key in Flag]: number;
};
export type NamedGroupConf<T = never> = NormalObject<string[] | T>;
export interface FeaturesConfig {
    unicode?: boolean;
    namedCapture?: boolean;
    upc?: boolean;
}
export interface ParserConf {
    maxRepeat?: number;
    namedGroupConf?: NamedGroupConf<NamedGroupConf<string[] | boolean>>;
    extractSetAverage?: boolean;
    charactersOfAny?: CodePointRanges | CodePointRangeItem | ((flags?: FlagsHash) => string);
    capture?: boolean;
    features?: FeaturesConfig;
}
export interface BuildConfData extends ParserConf {
    flags: FlagsHash;
    namedGroupData: NormalObject<string>;
    captureGroupData: NormalObject<string>;
}
export type Result = Pick<ReRegExp, 'rule' | 'lastRule' | 'context' | 'flags'> & {
    queues: RegexpPart[];
};
export type UPCData = {
    negate: boolean;
    short: boolean;
    key?: string;
    value: string;
};
export type UPCFactory = (data: UPCData) => UPCInstance | never;
export interface UPCInstance {
    generate(): string;
}
export declare class CharsetHelper {
    static readonly points: CodePointData<CodePointRanges>;
    static readonly lens: CodePointData<number[]>;
    static readonly bigCharPoint: [number, number];
    static readonly bigCharTotal: number;
    static charsetOfAll(): CodePointResult;
    static charsetOfDotall(): CodePointResult;
    static charsetOfNegated(type: CharsetCacheType): CodePointResult;
    static charsetOf(type: CharsetType): CodePointResult;
    static getCharsetInfo(type: CharsetType | CharsetNegatedType | '.', flags?: FlagsHash): CodePointResult;
    static make(type: CharsetType | CharsetNegatedType | '.', flags?: FlagsHash): string;
    static makeOne(result: CodePointResult): string;
    protected static readonly cache: CharsetCache;
    protected constructor();
}
export declare const parserRule: RegExp;
export declare const regexpRule: RegExp;
export default class ReRegExp {
    readonly rule: string | RegExp;
    private config;
    static maxRepeat: number;
    static features: FeaturesConfig;
    static UPCFactory?: UPCFactory;
    static charactersOfAny: ParserConf['charactersOfAny'];
    readonly context: string;
    readonly flags: Flag[];
    readonly lastRule: string;
    groups?: NormalObject<string>;
    $1: string;
    $2: string;
    $3: string;
    $4: string;
    $5: string;
    $6: string;
    $7: string;
    $8: string;
    $9: string;
    private queues;
    private ruleInput;
    private flagsHash;
    private totalFlagBinary;
    private rootQueues;
    private hasLookaround;
    private hasNullRoot;
    private anyCharacterHandle;
    private anyCharacterHandleDone;
    constructor(rule: string | RegExp, config?: ParserConf);
    build(): string | never;
    info(): Result;
    private parse;
    private checkFlags;
    private hasFlag;
    getFlagsHash(): FlagsHash;
}
export type CharsetType = 'd' | 'w' | 's';
export type CharsetNegatedType = 'D' | 'W' | 'S';
export type CharsetWordType = 'b' | 'B';
export type CharsetAllType = CharsetType | CharsetNegatedType | CharsetWordType;
export type CharsetCacheType = CharsetNegatedType | typeof SYMBOL_DOTALL | typeof SYMBOL_ALL;
export type CharsetCache = {
    [key in CharsetCacheType]?: CodePointResult;
};
export type CodePointRangeItem = [number, number] | [number];
export type CodePointRanges = Array<CodePointRangeItem>;
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
export declare abstract class RegexpPart {
    input: string;
    queues: RegexpPart[];
    codePoint: number;
    abstract readonly type: string;
    protected parserInstance: ReRegExp;
    protected min: number;
    protected max: number;
    protected dataConf: Partial<BuildConfData>;
    protected buildForTimes: boolean;
    protected curParent: RegexpPart;
    protected matchNothing: boolean;
    protected completed: boolean;
    constructor(input?: string);
    get parser(): ReRegExp;
    set parser(parser: ReRegExp);
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
    handle?: () => string;
    readonly type = "any";
    constructor(handle?: () => string);
    static genDiyCharactersHandle(conf: ParserConf & {
        flags: FlagsHash;
    }): () => string;
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
    set parser(parser: ReRegExp);
    get parser(): ReRegExp;
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
export declare class RegexpUnicodeCategory extends RegexpPart {
    private readonly symbol;
    type: string;
    protected data: UPCData;
    protected rule: RegExp;
    protected generator: UPCInstance;
    constructor(symbol: string);
    untilEnd(context: string): number | never;
    protected prebuild(): string;
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
export {};
