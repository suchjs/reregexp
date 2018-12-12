"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
Object.defineProperty(exports, "__esModule", { value: true });
var isOptional = function () {
    return Math.random() >= 0.5;
};
var makeRandom = function (min, max) {
    if (min === max) {
        return min;
    }
    else {
        return min + Math.floor(Math.random() * (max + 1 - min));
    }
};
var getLastItem = function (arr) {
    return arr[arr.length - 1];
};
var CharsetHelper = (function () {
    function CharsetHelper() {
    }
    CharsetHelper.charsetOfAll = function () {
        return CharsetHelper.charsetOfNegated('ALL');
    };
    CharsetHelper.charsetOfDotall = function () {
        return CharsetHelper.charsetOfNegated('DOTALL');
    };
    CharsetHelper.charsetOfNegated = function (type) {
        var points = CharsetHelper.points, cache = CharsetHelper.cache;
        if (cache[type]) {
            return cache[type];
        }
        else {
            var start = 0x0000;
            var max = 0xDBFF;
            var nextStart = 0xE000;
            var nextMax = 0xFFFF;
            var ranges_1 = [];
            var totals_1 = [];
            var total_1 = 0;
            var add = function (begin, end) {
                var num = end - begin + 1;
                if (num <= 0) {
                    return;
                }
                else if (num === 1) {
                    ranges_1.push([begin]);
                }
                else {
                    ranges_1.push([begin, end]);
                }
                total_1 += num;
                totals_1.push(total_1);
            };
            if (type === 'DOTALL') {
                add(start, max);
                add(nextStart, nextMax);
            }
            else {
                var excepts = type === 'ALL' ? [[0x000a], [0x000d], [0x2028, 0x2029]] : points[type.toLowerCase()];
                var specialNum = type === 'S' ? 1 : 0;
                while (start <= max && excepts.length > specialNum) {
                    var _a = excepts.shift(), begin = _a[0], end = _a[1];
                    add(start, begin - 1);
                    start = (end || begin) + 1;
                }
                if (start < max) {
                    add(start, max);
                }
                if (type === 'S') {
                    var last = getLastItem(excepts)[0];
                    add(nextStart, last - 1);
                    add(last + 1, nextMax);
                }
                else {
                    add(nextStart, nextMax);
                }
            }
            return (cache[type] = {
                ranges: ranges_1,
                totals: totals_1,
            });
        }
    };
    CharsetHelper.charsetOf = function (type) {
        var lens = CharsetHelper.lens, points = CharsetHelper.points;
        return {
            ranges: points[type],
            totals: lens[type],
        };
    };
    CharsetHelper.getCharsetInfo = function (type, flags) {
        if (flags === void 0) { flags = {}; }
        var result;
        var last;
        var helper = CharsetHelper;
        if (['w', 'd', 's'].indexOf(type) > -1) {
            last = helper.charsetOf(type);
        }
        else {
            if (type === '.') {
                if (flags.s) {
                    result = helper.charsetOfDotall();
                }
                else {
                    result = helper.charsetOfAll();
                }
            }
            else {
                result = helper.charsetOfNegated(type);
            }
            if (flags.u) {
                last.ranges = result.ranges.slice(0).concat([helper.bigCharPoint]);
                last.totals = result.totals.slice(0).concat(helper.bigCharTotal);
            }
        }
        return last || result;
    };
    CharsetHelper.make = function (type, flags) {
        if (flags === void 0) { flags = {}; }
        return CharsetHelper.makeOne(CharsetHelper.getCharsetInfo(type, flags));
    };
    CharsetHelper.makeOne = function (info) {
        var totals = info.totals, ranges = info.ranges;
        var total = getLastItem(totals);
        var rand = makeRandom(1, total);
        var nums = totals.length;
        var codePoint;
        var index = 0;
        while (nums > 1) {
            var avg = Math.floor(nums / 2);
            var prev = totals[index + avg - 1];
            var next = totals[index + avg];
            if (rand >= prev && rand <= next) {
                index += avg - (rand === prev ? 1 : 0);
                break;
            }
            else {
                if (rand > next) {
                    index += avg + 1;
                    nums -= (avg + 1);
                }
                else {
                    nums -= avg;
                }
            }
        }
        codePoint = ranges[index][0] + (rand - (totals[index - 1] || 0)) - 1;
        return String.fromCodePoint(codePoint);
    };
    CharsetHelper.points = {
        d: [[48, 57]],
        w: [[48, 57], [65, 90], [95], [97, 122]],
        s: [[0x0009, 0x000c], [0x0020], [0x00a0], [0x1680], [0x180e],
            [0x2000, 0x200a], [0x2028, 0x2029], [0x202f], [0x205f], [0x3000], [0xfeff],
        ],
    };
    CharsetHelper.lens = {
        d: [10],
        w: [10, 36, 37, 63],
        s: [4, 5, 6, 7, 8, 18, 20, 21, 22, 23, 24],
    };
    CharsetHelper.bigCharPoint = [0x10000, 0x10ffff];
    CharsetHelper.bigCharTotal = 0x10ffff - 0x10000 + 1;
    CharsetHelper.cache = {};
    return CharsetHelper;
}());
var charH = CharsetHelper;
var symbols = {
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
var flagsBinary = {
    i: 1,
    u: 2,
    s: 4,
    g: 8,
    m: 16,
    y: 32,
};
var flagItems = Object.keys(flagsBinary).join('');
exports.parserRule = new RegExp("^/(?:\\\\.|[^\\\\](?!/)|[^\\\\])+?/[" + flagItems + "]*");
exports.regexpRule = new RegExp("^/((?:\\\\.|[^\\\\](?!/)|[^\\\\])+?)/([" + flagItems + "]*)$");
var Parser = (function () {
    function Parser(rule, config) {
        if (config === void 0) { config = {}; }
        this.rule = rule;
        this.config = config;
        this.context = '';
        this.flags = [];
        this.lastRule = '';
        this.queues = [];
        this.ruleInput = '';
        this.flagsHash = {};
        this.totalFlagBinary = 0;
        this.rootQueues = [];
        this.hasLookaround = false;
        this.hasNullRoot = null;
        if (exports.regexpRule.test(rule)) {
            this.rule = rule;
            this.context = RegExp.$1;
            this.flags = RegExp.$2 ? RegExp.$2.split('') : [];
            this.checkFlags();
            this.parse();
            this.lastRule = this.ruleInput;
        }
        else {
            throw new Error("wrong regexp:" + rule);
        }
    }
    Parser.prototype.setConfig = function (conf) {
        this.config = conf;
    };
    Parser.prototype.build = function () {
        if (this.hasLookaround) {
            throw new Error('the build method does not support lookarounds.');
        }
        var nullRootError = new Error('the regexp has null expression,will match nothing');
        if (this.hasNullRoot === true) {
            throw nullRootError;
        }
        var rootQueues = this.rootQueues;
        var conf = __assign({}, this.config, { flags: this.flagsHash, namedGroupData: {}, captureGroupData: {}, beginWiths: [], endWiths: [] });
        var result = rootQueues.reduce(function (res, queue) {
            return res + queue.build(conf);
        }, '');
        if (this.hasNullRoot === null) {
            if (rootQueues.filter(function (item) { return item.isMatchNothing; }).length) {
                this.hasNullRoot = true;
                throw nullRootError;
            }
            else {
                this.hasNullRoot = false;
            }
        }
        return result;
    };
    Parser.prototype.info = function () {
        var _a = this, rule = _a.rule, context = _a.context, lastRule = _a.lastRule, flags = _a.flags, queues = _a.queues;
        return {
            rule: rule,
            context: context,
            lastRule: lastRule,
            flags: flags,
            queues: queues,
        };
    };
    Parser.prototype.parse = function () {
        var context = this.context;
        var s = symbols;
        var i = 0;
        var j = context.length;
        var queues = [new RegexpBegin()];
        var groups = [];
        var lookarounds = [];
        var captureGroups = [];
        var namedCaptures = {};
        var refGroups = {};
        var captureRule = /^(\?(?:<(.+?)>|:))/;
        var lookaroundRule = /^(\?(?:<=|<!|=|!))/;
        var hasFlagU = this.hasFlag('u');
        var nestQueues = [];
        var groupCaptureIndex = 0;
        var curSet = null;
        var curRange = null;
        var addToGroup = function (cur) {
            if (groups.length || lookarounds.length) {
                var isGroup = getLastItem(nestQueues).type === 'group';
                var curQueue = isGroup ? getLastItem(groups) : getLastItem(lookarounds);
                if (isGroup) {
                    curQueue.addItem(cur);
                }
                else {
                    cur.parent = curQueue;
                }
            }
        };
        var isWrongRepeat = function (type, prev) {
            var denyTypes = ['groupBegin', 'groupSplitor', 'times', 'begin', 'anchor'];
            return denyTypes.indexOf(type) > -1 || (type === 'charset' && prev.charset.toLowerCase() === 'b');
        };
        while (i < j) {
            var char = context.charAt(i++);
            if ((curRange || curSet) && ['[', '(', ')', '|', '*', '?', '+', '{', '.', '}', '^', '$', '/'].indexOf(char) > -1) {
                var newChar = new RegexpChar(char);
                if (curRange) {
                    newChar.parent = curRange;
                    curRange = null;
                }
                else {
                    newChar.parent = curSet;
                }
                queues.push(newChar);
                continue;
            }
            var nextAll = context.slice(i);
            var lastGroup = getLastItem(groups);
            var lastQueue = getLastItem(queues);
            var target = null;
            var special = null;
            switch (char) {
                case s.translate:
                    var next = context.charAt(i++);
                    var input = char + next;
                    if (next === 'u' || next === 'x') {
                        target = next === 'x' ? new RegexpASCII() : (hasFlagU ? new RegexpUnicodeAll() : new RegexpUnicode());
                        var matchedNum = target.untilEnd(context.slice(i));
                        if (matchedNum === 0) {
                            target = new RegexpIgnore("\\" + next);
                        }
                        else {
                            i += matchedNum;
                        }
                    }
                    else if (next === 'c') {
                        var code = context.charAt(i);
                        if (hasFlagU) {
                            if (/[a-zA-Z]/.test(code)) {
                                target = new RegexpControl(code);
                                i++;
                            }
                            else {
                                throw new Error("invalid unicode escape,unexpect control character[" + i + "]:\\c" + code);
                            }
                        }
                        else {
                            if (/\w/.test(code)) {
                                target = new RegexpControl(code);
                                i++;
                            }
                            else {
                                target = new RegexpChar('\\');
                                i--;
                            }
                        }
                    }
                    else if (['d', 'D', 'w', 'W', 's', 'S', 'b', 'B'].indexOf(next) > -1) {
                        target = new RegexpCharset(input);
                    }
                    else if (['t', 'r', 'n', 'f', 'v'].indexOf(next) > -1) {
                        target = new RegexpPrint(input);
                    }
                    else if (/^(\d+)/.test(nextAll)) {
                        var no = RegExp.$1;
                        if (curSet) {
                            if (/^(0[0-7]{0,2}|[1-3][0-7]{0,2}|[4-7][0-7]?)/.test(no)) {
                                var octal = RegExp.$1;
                                target = new RegexpOctal("\\" + octal);
                                i += octal.length - 1;
                            }
                            else {
                                target = new RegexpTranslateChar("\\" + no.charAt(0));
                            }
                        }
                        else {
                            if (no.charAt(0) === '0') {
                                target = new RegexpNull();
                            }
                            else {
                                i += no.length - 1;
                                target = new RegexpReference("\\" + no);
                                var refGroup = captureGroups[+no - 1];
                                refGroups[no] = refGroup;
                                if (refGroup) {
                                    if (refGroup.isAncestorOf(lastGroup)) {
                                        target.ref = null;
                                    }
                                    else {
                                        target.ref = refGroup;
                                    }
                                }
                                else {
                                    target.ref = null;
                                    target.isMatchNothing = true;
                                }
                            }
                        }
                    }
                    else if (next === 'k' && /^<([^>]+?)>/.test(context.slice(i))) {
                        var name_1 = RegExp.$1;
                        if (!namedCaptures[name_1]) {
                            throw new Error("Invalid named capture referenced:" + name_1);
                        }
                        else {
                            i += name_1.length + 2;
                            var refGroup = namedCaptures[name_1];
                            target = new RegexpReference("\\" + refGroup.captureIndex, name_1);
                            if (refGroup.isAncestorOf(lastGroup)) {
                                target.ref = null;
                            }
                            else {
                                target.ref = refGroup;
                            }
                        }
                    }
                    else {
                        target = new RegexpTranslateChar(input);
                    }
                    break;
                case s.groupBegin:
                    var isLookaround = lookaroundRule.test(nextAll);
                    if (isLookaround) {
                        var lookType = RegExp.$1;
                        target = new RegexpLookaround(lookType);
                        special = new RegexpSpecial('lookaroundBegin');
                        this.hasLookaround = true;
                        i += lookType.length;
                    }
                    else {
                        target = new RegexpGroup();
                        special = new RegexpSpecial('groupBegin');
                    }
                    nestQueues.push(target);
                    if (!isLookaround) {
                        target = target;
                        if (captureRule.test(nextAll)) {
                            var all = RegExp.$1, captureName = RegExp.$2;
                            if (all === '?:') {
                            }
                            else {
                                target.captureIndex = ++groupCaptureIndex;
                                target.captureName = captureName;
                                namedCaptures[captureName] = target;
                            }
                            i += all.length;
                        }
                        else {
                            target.captureIndex = ++groupCaptureIndex;
                        }
                        if (target.captureIndex > 0) {
                            captureGroups.push(target);
                        }
                    }
                    break;
                case s.groupEnd:
                    if (nestQueues.length) {
                        var curNest = nestQueues.pop();
                        if (!curNest || ['group', 'lookaround'].indexOf(curNest.type) < 0) {
                            throw new Error("unexpected capture end.");
                        }
                        var last = (curNest.type === 'group' ? groups : lookarounds).pop();
                        if (last) {
                            last.isComplete = true;
                            special = new RegexpSpecial(curNest.type + "End");
                            special.parent = last;
                        }
                    }
                    else {
                        throw new Error("unmatched " + char + ",you mean \"\\" + char + "\"?");
                    }
                    break;
                case s.groupSplitor:
                    var group = getLastItem(groups);
                    if (!group) {
                        target = new RegexpGroup();
                        target.isRoot = true;
                        target.addNewGroup(queues.splice(0, queues.length, target));
                        groups.push(target);
                    }
                    else {
                        group.addNewGroup();
                    }
                    special = new RegexpSpecial('groupSplitor');
                    break;
                case s.setBegin:
                    if (/^\\b]/.test(nextAll)) {
                        target = new RegexpBackspace();
                        i += 3;
                    }
                    else {
                        curSet = new RegexpSet();
                        if (nextAll.charAt(0) === '^') {
                            curSet.reverse = true;
                            i += 1;
                        }
                        queues.push(curSet);
                        addToGroup(curSet);
                        special = new RegexpSpecial('setBegin');
                        special.parent = curSet;
                    }
                    break;
                case s.setEnd:
                    if (curSet) {
                        curSet.isComplete = true;
                        special = new RegexpSpecial('setEnd');
                        special.parent = curSet;
                        curSet = null;
                    }
                    else {
                        target = new RegexpChar(char);
                    }
                    break;
                case s.rangeSplitor:
                    if (curSet) {
                        if (lastQueue.codePoint < 0) {
                            target = new RegexpChar(char);
                        }
                        else {
                            var nextChar = nextAll.charAt(0);
                            if (nextChar === s.setEnd) {
                                curSet.isComplete = true;
                                curSet = null;
                                i += 1;
                            }
                            else {
                                curSet.pop();
                                curRange = new RegexpRange();
                                curRange.parent = curSet;
                                queues.pop().parent = curRange;
                                queues.push(curRange, lastQueue);
                                special = new RegexpSpecial('rangeSplitor');
                                special.parent = curRange;
                            }
                        }
                    }
                    else {
                        target = new RegexpChar(char);
                    }
                    break;
                case s.multipleBegin:
                case s.optional:
                case s.multiple:
                case s.leastOne:
                    target = char === s.multipleBegin ? new RegexpTimesMulti() : new RegexpTimesQuantifiers();
                    var num = target.untilEnd(context.slice(i - 1));
                    if (num > 0) {
                        var type = lastQueue.special || lastQueue.type;
                        var error = "[" + lastQueue.input + "]nothing to repeat[index:" + i + "]:" + context.slice(i - 1, i - 1 + num);
                        if (isWrongRepeat(type, lastQueue)) {
                            throw new Error(error);
                        }
                        else {
                            i += num - 1;
                            if (type === 'groupEnd' || type === 'setEnd') {
                                target.target = lastQueue.parent;
                            }
                            else {
                                target.target = lastQueue;
                            }
                        }
                    }
                    else {
                        target = new RegexpChar(char);
                    }
                    break;
                case s.matchAny:
                    target = new RegexpAny();
                    break;
                case s.delimiter:
                    throw new Error("unexpected pattern end delimiter:\"/" + nextAll + "\"");
                case s.beginWith:
                case s.endWith:
                    target = new RegexpAnchor(char);
                    break;
                default:
                    target = new RegexpChar(char);
            }
            if (target) {
                var cur = target;
                queues.push(cur);
                if (curRange) {
                    if (target.codePoint < 0) {
                        var _a = queues.splice(-4, 4), range = _a[0], first = _a[1], rangeSplitor = _a[2], second = _a[3];
                        var middle = new RegexpChar('-');
                        curSet.pop();
                        [first, middle, second].map(function (item) {
                            item.parent = curSet;
                            queues.push(item);
                            return item;
                        });
                    }
                    else {
                        target.parent = curRange;
                    }
                    curRange = null;
                }
                else if (curSet) {
                    cur.parent = curSet;
                }
                else {
                    addToGroup(cur);
                }
                if (['group', 'lookaround'].indexOf(cur.type) > -1) {
                    var lists = cur.type === 'group' ? groups : lookarounds;
                    lists.push(cur);
                }
            }
            if (special) {
                if (target) {
                    special.parent = target;
                }
                queues.push(special);
            }
        }
        if (queues.length === 1 && queues[0].type === 'group') {
            var group = queues[0];
            if (group.isRoot === true) {
                group.isComplete = true;
            }
        }
        var rootQueues = [];
        var ruleInput = '';
        queues.every(function (queue) {
            if (!queue.isComplete) {
                throw new Error("the regexp segment " + queue.type + " is not completed:" + queue.input);
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
    };
    Parser.prototype.checkFlags = function () {
        var _a;
        var flags = this.flags;
        var len = flags.length;
        if (len === 0) {
            return;
        }
        if (len > Object.keys(flagsBinary).length) {
            throw new Error("the rule has repeat flag,please check.");
        }
        var first = flags[0];
        var totalFlagBinary = flagsBinary[first];
        var flagsHash = (_a = {},
            _a[first] = true,
            _a);
        for (var i = 1, j = flags.length; i < j; i++) {
            var flag = flags[i];
            var binary = flagsBinary[flag];
            if ((totalFlagBinary & binary) === 0) {
                totalFlagBinary += binary;
                flagsHash[flag] = true;
            }
            else {
                throw new Error("wrong flag[" + i + "]:" + flag);
            }
        }
        this.flagsHash = flagsHash;
        this.totalFlagBinary = totalFlagBinary;
        if (flagsHash.y || flagsHash.m || flagsHash.g) {
            console.warn("the flags of 'g','m','y' will ignore,but you can set flags such as 'i','u','s'");
        }
    };
    Parser.prototype.hasFlag = function (flag) {
        var totalFlagBinary = this.totalFlagBinary;
        var binary = flagsBinary[flag];
        return binary && (binary & totalFlagBinary) !== 0;
    };
    return Parser;
}());
exports.default = Parser;
var RegexpPart = (function () {
    function RegexpPart(input) {
        if (input === void 0) { input = ''; }
        this.input = input;
        this.queues = [];
        this.codePoint = -1;
        this.min = 1;
        this.max = 1;
        this.dataConf = {};
        this.buildForTimes = false;
        this.curParent = null;
        this.matchNothing = false;
        this.completed = true;
    }
    Object.defineProperty(RegexpPart.prototype, "parent", {
        get: function () {
            return this.curParent;
        },
        set: function (value) {
            this.curParent = value;
            if (this.type !== 'special') {
                value.add(this);
            }
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(RegexpPart.prototype, "isComplete", {
        get: function () {
            return this.completed;
        },
        set: function (value) {
            this.completed = value;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(RegexpPart.prototype, "isMatchNothing", {
        get: function () {
            return this.matchNothing;
        },
        set: function (value) {
            this.matchNothing = value;
            if (this.parent) {
                this.parent.isMatchNothing = value;
            }
        },
        enumerable: true,
        configurable: true
    });
    RegexpPart.prototype.setRange = function (options) {
        var _this = this;
        Object.keys(options).forEach(function (key) {
            _this[key] = options[key];
        });
    };
    RegexpPart.prototype.add = function (target) {
        this.queues = this.queues.concat(target);
    };
    RegexpPart.prototype.pop = function () {
        return this.queues.pop();
    };
    RegexpPart.prototype.build = function (conf) {
        var _this = this;
        var _a = this, min = _a.min, max = _a.max;
        var result = '';
        if (min === 0 && max === 0) {
        }
        else {
            var total = min + Math.floor(Math.random() * (max - min + 1));
            if (total !== 0) {
                var makeOnce = function () {
                    var cur = _this.prebuild(conf);
                    if (conf.flags && conf.flags.i) {
                        cur = isOptional() ? (isOptional() ? cur.toLowerCase() : cur.toUpperCase()) : cur;
                    }
                    return cur;
                };
                if (!this.buildForTimes) {
                    result = makeOnce().repeat(total);
                }
                else {
                    while (total--) {
                        result += makeOnce();
                    }
                }
            }
        }
        this.dataConf = conf;
        this.setDataConf(conf, result);
        return result;
    };
    RegexpPart.prototype.setDataConf = function (conf, result) {
    };
    RegexpPart.prototype.toString = function () {
        return this.input;
    };
    RegexpPart.prototype.untilEnd = function (context) {
    };
    RegexpPart.prototype.isAncestorOf = function (target) {
        do {
            if (target === this) {
                return true;
            }
        } while (target = (target ? target.parent : null));
        return false;
    };
    RegexpPart.prototype.getRuleInput = function (parseReference) {
        if (this.queues.length) {
            return this.buildRuleInputFromQueues();
        }
        else {
            return this.input;
        }
    };
    RegexpPart.prototype.buildRuleInputFromQueues = function () {
        return this.queues.reduce(function (result, next) {
            return result + next.getRuleInput();
        }, '');
    };
    RegexpPart.prototype.prebuild = function (conf) {
        if (this.queues.length) {
            return this.queues.reduce(function (res, cur) {
                return res + cur.build(conf);
            }, '');
        }
        else {
            return '';
        }
    };
    return RegexpPart;
}());
exports.RegexpPart = RegexpPart;
var RegexpEmpty = (function (_super) {
    __extends(RegexpEmpty, _super);
    function RegexpEmpty(input) {
        var _this = _super.call(this, input) || this;
        _this.min = 0;
        _this.max = 0;
        return _this;
    }
    return RegexpEmpty;
}(RegexpPart));
exports.RegexpEmpty = RegexpEmpty;
var RegexpOrigin = (function (_super) {
    __extends(RegexpOrigin, _super);
    function RegexpOrigin() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    RegexpOrigin.prototype.prebuild = function () {
        return this.input;
    };
    return RegexpOrigin;
}(RegexpPart));
exports.RegexpOrigin = RegexpOrigin;
var RegexpReference = (function (_super) {
    __extends(RegexpReference, _super);
    function RegexpReference(input, name) {
        if (name === void 0) { name = ''; }
        var _this = _super.call(this, input) || this;
        _this.name = name;
        _this.type = 'reference';
        _this.ref = null;
        _this.index = Number("" + input.slice(1));
        return _this;
    }
    RegexpReference.prototype.prebuild = function (conf) {
        var ref = this.ref;
        if (ref === null) {
            return '';
        }
        else {
            var captureIndex = ref.captureIndex;
            var captureGroupData = conf.captureGroupData;
            return captureGroupData[captureIndex];
        }
    };
    return RegexpReference;
}(RegexpPart));
exports.RegexpReference = RegexpReference;
var RegexpSpecial = (function (_super) {
    __extends(RegexpSpecial, _super);
    function RegexpSpecial(special) {
        var _this = _super.call(this) || this;
        _this.special = special;
        _this.type = 'special';
        return _this;
    }
    return RegexpSpecial;
}(RegexpEmpty));
exports.RegexpSpecial = RegexpSpecial;
var RegexpLookaround = (function (_super) {
    __extends(RegexpLookaround, _super);
    function RegexpLookaround(input) {
        var _this = _super.call(this) || this;
        _this.type = 'lookaround';
        _this.looktype = input;
        _this.isComplete = false;
        return _this;
    }
    RegexpLookaround.prototype.getRuleInput = function () {
        return '(' + this.looktype + this.buildRuleInputFromQueues() + ')';
    };
    return RegexpLookaround;
}(RegexpEmpty));
exports.RegexpLookaround = RegexpLookaround;
var RegexpAny = (function (_super) {
    __extends(RegexpAny, _super);
    function RegexpAny() {
        var _this = _super.call(this, '.') || this;
        _this.type = 'any';
        _this.buildForTimes = true;
        return _this;
    }
    RegexpAny.prototype.prebuild = function (conf) {
        return charH.make('.', conf.flags);
    };
    return RegexpAny;
}(RegexpPart));
exports.RegexpAny = RegexpAny;
var RegexpNull = (function (_super) {
    __extends(RegexpNull, _super);
    function RegexpNull() {
        var _this = _super.call(this, '\\0') || this;
        _this.type = 'null';
        return _this;
    }
    RegexpNull.prototype.prebuild = function () {
        return '\x00';
    };
    return RegexpNull;
}(RegexpPart));
exports.RegexpNull = RegexpNull;
var RegexpBackspace = (function (_super) {
    __extends(RegexpBackspace, _super);
    function RegexpBackspace() {
        var _this = _super.call(this, '[\\b]') || this;
        _this.type = 'backspace';
        return _this;
    }
    RegexpBackspace.prototype.prebuild = function () {
        return '\u0008';
    };
    return RegexpBackspace;
}(RegexpPart));
exports.RegexpBackspace = RegexpBackspace;
var RegexpBegin = (function (_super) {
    __extends(RegexpBegin, _super);
    function RegexpBegin() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.type = 'begin';
        return _this;
    }
    return RegexpBegin;
}(RegexpEmpty));
exports.RegexpBegin = RegexpBegin;
var RegexpControl = (function (_super) {
    __extends(RegexpControl, _super);
    function RegexpControl(input) {
        var _this = _super.call(this, "\\c" + input) || this;
        _this.type = 'control';
        _this.codePoint = parseInt(input.charCodeAt(0).toString(2).slice(-5), 2);
        return _this;
    }
    RegexpControl.prototype.prebuild = function () {
        return String.fromCharCode(this.codePoint);
    };
    return RegexpControl;
}(RegexpPart));
exports.RegexpControl = RegexpControl;
var RegexpCharset = (function (_super) {
    __extends(RegexpCharset, _super);
    function RegexpCharset(input) {
        var _this = _super.call(this, input) || this;
        _this.type = 'charset';
        _this.charset = _this.input.slice(-1);
        _this.buildForTimes = true;
        return _this;
    }
    RegexpCharset.prototype.prebuild = function (conf) {
        var charset = this.charset;
        if (charset === 'b' || charset === 'B') {
            console.warn('please do not use \\b or \\B');
            return '';
        }
        else {
            return charH.make(charset, conf.flags);
        }
    };
    return RegexpCharset;
}(RegexpPart));
exports.RegexpCharset = RegexpCharset;
var RegexpPrint = (function (_super) {
    __extends(RegexpPrint, _super);
    function RegexpPrint() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.type = 'print';
        return _this;
    }
    RegexpPrint.prototype.prebuild = function () {
        return this.input;
    };
    return RegexpPrint;
}(RegexpPart));
exports.RegexpPrint = RegexpPrint;
var RegexpIgnore = (function (_super) {
    __extends(RegexpIgnore, _super);
    function RegexpIgnore() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.type = 'ignore';
        return _this;
    }
    return RegexpIgnore;
}(RegexpEmpty));
exports.RegexpIgnore = RegexpIgnore;
var RegexpAnchor = (function (_super) {
    __extends(RegexpAnchor, _super);
    function RegexpAnchor(input) {
        var _this = _super.call(this, input) || this;
        _this.type = 'anchor';
        _this.anchor = input;
        console.warn("the anchor of \"" + _this.input + "\" will ignore.");
        return _this;
    }
    return RegexpAnchor;
}(RegexpEmpty));
exports.RegexpAnchor = RegexpAnchor;
var RegexpChar = (function (_super) {
    __extends(RegexpChar, _super);
    function RegexpChar(input) {
        var _this = _super.call(this, input) || this;
        _this.type = 'char';
        _this.codePoint = input.codePointAt(0);
        return _this;
    }
    return RegexpChar;
}(RegexpOrigin));
exports.RegexpChar = RegexpChar;
var RegexpTranslateChar = (function (_super) {
    __extends(RegexpTranslateChar, _super);
    function RegexpTranslateChar(input) {
        var _this = _super.call(this, input) || this;
        _this.type = 'translate';
        _this.codePoint = input.slice(-1).codePointAt(0);
        return _this;
    }
    RegexpTranslateChar.prototype.prebuild = function () {
        return this.input.slice(-1);
    };
    return RegexpTranslateChar;
}(RegexpOrigin));
exports.RegexpTranslateChar = RegexpTranslateChar;
var RegexpOctal = (function (_super) {
    __extends(RegexpOctal, _super);
    function RegexpOctal(input) {
        var _this = _super.call(this, input) || this;
        _this.type = 'octal';
        _this.codePoint = Number("0o" + input.slice(1));
        return _this;
    }
    RegexpOctal.prototype.prebuild = function () {
        return String.fromCodePoint(this.codePoint);
    };
    return RegexpOctal;
}(RegexpPart));
exports.RegexpOctal = RegexpOctal;
var RegexpTimes = (function (_super) {
    __extends(RegexpTimes, _super);
    function RegexpTimes() {
        var _this = _super.call(this) || this;
        _this.type = 'times';
        _this.maxNum = 5;
        _this.greedy = true;
        _this.minRepeat = 0;
        _this.maxRepeat = 0;
        _this.isComplete = false;
        return _this;
    }
    Object.defineProperty(RegexpTimes.prototype, "target", {
        set: function (target) {
            target.setRange({
                min: this.minRepeat,
                max: this.maxRepeat,
            });
        },
        enumerable: true,
        configurable: true
    });
    RegexpTimes.prototype.untilEnd = function (context) {
        if (this.rule.test(context)) {
            var all = RegExp.$1;
            this.isComplete = true;
            this.input = all;
            this.parse();
            return all.length;
        }
        return 0;
    };
    return RegexpTimes;
}(RegexpPart));
exports.RegexpTimes = RegexpTimes;
var RegexpTimesMulti = (function (_super) {
    __extends(RegexpTimesMulti, _super);
    function RegexpTimesMulti() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.rule = /^(\{(\d+)(,(\d*))?}(\??))/;
        return _this;
    }
    RegexpTimesMulti.prototype.parse = function () {
        var min = RegExp.$2, code = RegExp.$3, max = RegExp.$4, optional = RegExp.$5;
        this.greedy = optional !== '?';
        this.minRepeat = parseInt(min, 10);
        this.maxRepeat = Number(max) ? parseInt(max, 10) : (code ? this.minRepeat + this.maxNum * 2 : this.minRepeat);
    };
    return RegexpTimesMulti;
}(RegexpTimes));
exports.RegexpTimesMulti = RegexpTimesMulti;
var RegexpTimesQuantifiers = (function (_super) {
    __extends(RegexpTimesQuantifiers, _super);
    function RegexpTimesQuantifiers() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.rule = /^(\*\?|\+\?|\?\?|\*|\+|\?)/;
        return _this;
    }
    RegexpTimesQuantifiers.prototype.parse = function () {
        var all = RegExp.$1;
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
    };
    return RegexpTimesQuantifiers;
}(RegexpTimes));
exports.RegexpTimesQuantifiers = RegexpTimesQuantifiers;
var RegexpSet = (function (_super) {
    __extends(RegexpSet, _super);
    function RegexpSet() {
        var _this = _super.call(this) || this;
        _this.type = 'set';
        _this.reverse = false;
        _this.isMatchAnything = false;
        _this.codePointResult = null;
        _this.isComplete = false;
        _this.buildForTimes = true;
        return _this;
    }
    Object.defineProperty(RegexpSet.prototype, "isComplete", {
        get: function () {
            return this.completed;
        },
        set: function (value) {
            this.completed = value;
            if (value === true && this.queues.length === 0) {
                if (this.reverse) {
                    this.isMatchAnything = true;
                }
                else {
                    this.isMatchNothing = true;
                }
            }
        },
        enumerable: true,
        configurable: true
    });
    RegexpSet.prototype.isSetStart = function () {
        return this.queues.length === 0;
    };
    RegexpSet.prototype.getRuleInput = function () {
        return '[' + (this.reverse ? '^' : '') + this.buildRuleInputFromQueues() + ']';
    };
    RegexpSet.prototype.prebuild = function (conf) {
        var index = makeRandom(0, this.queues.length - 1);
        if (this.isMatchAnything) {
            return (new RegexpAny()).build(conf);
        }
        if (this.matchNothing) {
            console.warn('the empty set will match nothing:[]');
            return '';
        }
        if (this.reverse) {
            if (!this.codePointResult) {
                var ranges = this.queues.reduce(function (res, item) {
                    var type = item.type;
                    var cur;
                    if (type === 'charset') {
                        var charset = item.charset;
                        if (charset === 'b' || charset === 'B') {
                            console.warn('the charset \\b or \\B will ignore');
                            cur = [];
                        }
                        else {
                            cur = charH.getCharsetInfo(charset, conf.flags).ranges;
                        }
                    }
                    else if (type === 'range') {
                        cur = [item.queues.map(function (e) {
                                return e.codePoint;
                            })];
                    }
                    else {
                        cur = [[item.codePoint]];
                    }
                    return res.concat(cur);
                }, []);
                ranges.push([0xD800, 0xDFFF], conf.flags.u ? [0x110000] : [0x10000]);
                ranges.sort(function (a, b) {
                    return b[0] > a[0] ? -1 : (b[0] === a[0] ? (b[1] > a[1] ? 1 : -1) : 1);
                });
                var negated = [];
                var point = 0;
                for (var i = 0, j = ranges.length; i < j; i++) {
                    var cur = ranges[i];
                    var start = cur[0];
                    var end = cur[1] || start;
                    if (point < start) {
                        negated.push(point + 1 === start ? [point] : [point, start - 1]);
                    }
                    point = Math.max(end + 1, point);
                }
                if (negated.length === 0) {
                    this.isMatchNothing = true;
                }
                else {
                    var total_2 = 0;
                    var totals = negated.map(function (item) {
                        if (item.length === 1) {
                            total_2 += 1;
                        }
                        else {
                            total_2 += item[1] - item[0] + 1;
                        }
                        return total_2;
                    });
                    this.codePointResult = { totals: totals, ranges: negated };
                }
            }
            if (this.isMatchNothing) {
                console.error('the rule is match nothing');
                return '';
            }
            return charH.makeOne(this.codePointResult);
        }
        return this.queues[index].build(conf);
    };
    return RegexpSet;
}(RegexpPart));
exports.RegexpSet = RegexpSet;
var RegexpRange = (function (_super) {
    __extends(RegexpRange, _super);
    function RegexpRange() {
        var _this = _super.call(this) || this;
        _this.type = 'range';
        _this.isComplete = false;
        return _this;
    }
    RegexpRange.prototype.add = function (target) {
        _super.prototype.add.call(this, target);
        if (this.queues.length === 2) {
            this.isComplete = true;
            var _a = this.queues, prev = _a[0], next = _a[1];
            if (prev.codePoint > next.codePoint) {
                throw new Error("invalid range:" + prev.getRuleInput() + "-" + next.getRuleInput());
            }
        }
    };
    RegexpRange.prototype.getRuleInput = function () {
        var _a = this.queues, prev = _a[0], next = _a[1];
        return prev.getRuleInput() + '-' + next.getRuleInput();
    };
    RegexpRange.prototype.prebuild = function () {
        var _a = this.queues, prev = _a[0], next = _a[1];
        var min = prev.codePoint;
        var max = next.codePoint;
        return String.fromCodePoint(makeRandom(min, max));
    };
    return RegexpRange;
}(RegexpPart));
exports.RegexpRange = RegexpRange;
var RegexpHexCode = (function (_super) {
    __extends(RegexpHexCode, _super);
    function RegexpHexCode() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.type = 'hexcode';
        return _this;
    }
    RegexpHexCode.prototype.untilEnd = function (context) {
        var _a = this, rule = _a.rule, codeType = _a.codeType;
        if (rule.test(context)) {
            var all = RegExp.$1, codePoint = RegExp.$2;
            var lastCode = codePoint || all;
            this.codePoint = Number("0x" + lastCode);
            this.input = "\\" + codeType + all;
        }
        return 0;
    };
    return RegexpHexCode;
}(RegexpOrigin));
exports.RegexpHexCode = RegexpHexCode;
var RegexpUnicode = (function (_super) {
    __extends(RegexpUnicode, _super);
    function RegexpUnicode() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.rule = /^([0-9A-Fa-f]{4})/;
        _this.codeType = 'u';
        return _this;
    }
    return RegexpUnicode;
}(RegexpHexCode));
exports.RegexpUnicode = RegexpUnicode;
var RegexpUnicodeAll = (function (_super) {
    __extends(RegexpUnicodeAll, _super);
    function RegexpUnicodeAll() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.rule = /^({([0-9A-Fa-f]{4}|[0-9A-Fa-f]{6})}|[0-9A-Fa-f]{2})/;
        _this.codeType = 'u';
        return _this;
    }
    return RegexpUnicodeAll;
}(RegexpHexCode));
exports.RegexpUnicodeAll = RegexpUnicodeAll;
var RegexpASCII = (function (_super) {
    __extends(RegexpASCII, _super);
    function RegexpASCII() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.rule = /^([0-9A-Fa-f]{2})/;
        _this.codeType = 'x';
        return _this;
    }
    return RegexpASCII;
}(RegexpHexCode));
exports.RegexpASCII = RegexpASCII;
var RegexpGroupItem = (function (_super) {
    __extends(RegexpGroupItem, _super);
    function RegexpGroupItem(index) {
        var _this = _super.call(this) || this;
        _this.index = index;
        _this.type = 'group-item';
        return _this;
    }
    RegexpGroupItem.prototype.getRuleInput = function (parseReference) {
        var _this = this;
        if (parseReference === void 0) { parseReference = false; }
        return this.queues.reduce(function (res, item) {
            var cur;
            if (parseReference && item.type === 'reference' && item.ref !== null) {
                cur = item.ref.getRuleInput(parseReference);
            }
            else {
                cur = _this.isEndLimitChar(item) ? '' : item.getRuleInput(parseReference);
            }
            return res + cur;
        }, '');
    };
    RegexpGroupItem.prototype.prebuild = function (conf) {
        var _this = this;
        return this.queues.reduce(function (res, queue) {
            var cur;
            if (_this.isEndLimitChar(queue)) {
                console.warn('the ^ and $ of the regexp will ignore');
                cur = '';
            }
            else {
                cur = queue.build(conf);
            }
            return res + cur;
        }, '');
    };
    RegexpGroupItem.prototype.isEndLimitChar = function (target) {
        return target.type === 'char' && (target.input === '^' || target.input === '$');
    };
    return RegexpGroupItem;
}(RegexpPart));
exports.RegexpGroupItem = RegexpGroupItem;
var RegexpGroup = (function (_super) {
    __extends(RegexpGroup, _super);
    function RegexpGroup() {
        var _this = _super.call(this) || this;
        _this.type = 'group';
        _this.captureIndex = 0;
        _this.captureName = '';
        _this.queues = [];
        _this.isRoot = false;
        _this.curGroupItem = null;
        _this.curRule = null;
        _this.isComplete = false;
        _this.buildForTimes = true;
        _this.addNewGroup();
        return _this;
    }
    Object.defineProperty(RegexpGroup.prototype, "isComplete", {
        get: function () {
            return this.completed;
        },
        set: function (value) {
            this.completed = value;
            if (value === true) {
                this.isMatchNothing = this.queues.every(function (item) {
                    return item.isMatchNothing;
                });
            }
        },
        enumerable: true,
        configurable: true
    });
    RegexpGroup.prototype.getCurGroupItem = function () {
        return this.curGroupItem;
    };
    RegexpGroup.prototype.addNewGroup = function (queue) {
        var queues = this.queues;
        var groupItem;
        if (queue) {
            groupItem = this.curGroupItem;
            queue.map(function (item) {
                item.parent = groupItem;
            });
        }
        else {
            groupItem = new RegexpGroupItem(queues.length);
            this.curGroupItem = groupItem;
        }
        groupItem.parent = this;
        return groupItem;
    };
    RegexpGroup.prototype.addItem = function (target) {
        target.parent = this.curGroupItem;
    };
    RegexpGroup.prototype.getRuleInput = function (parseReference) {
        if (parseReference === void 0) { parseReference = false; }
        var _a = this, groups = _a.queues, captureIndex = _a.captureIndex, isRoot = _a.isRoot;
        var result = '';
        var segs = groups.map(function (groupItem) {
            return groupItem.getRuleInput(parseReference);
        });
        if (captureIndex === 0) {
            result = '?:' + result;
        }
        result += segs.join('|');
        return isRoot ? result : "(" + result + ")";
    };
    RegexpGroup.prototype.buildRule = function (flags) {
        if (this.curRule) {
            return this.curRule;
        }
        else {
            var rule = this.getRuleInput(true);
            var flag = Object.keys(flags).join('');
            return new Function('', "return /^" + rule + "$/" + flag)();
        }
    };
    RegexpGroup.prototype.prebuild = function (conf) {
        var _a = this, groups = _a.queues, captureIndex = _a.captureIndex, captureName = _a.captureName;
        var result = '';
        var flags = conf.flags, namedGroupConf = conf.namedGroupConf;
        var groupsLen = groups.length;
        var filterGroups = (function () {
            var curGroups = [];
            if (captureName && captureName.indexOf(':') > -1 && namedGroupConf) {
                var segs = captureName.split(':');
                if (segs.length === groupsLen) {
                    var notInIndexs_1 = [];
                    var inIndexs_1 = [];
                    segs.forEach(function (key, index) {
                        if (typeof namedGroupConf[key] === 'boolean') {
                            (namedGroupConf[key] === true ? inIndexs_1 : notInIndexs_1).push(index);
                        }
                    });
                    var lastIndexs = [];
                    if (inIndexs_1.length) {
                        lastIndexs = inIndexs_1;
                    }
                    else if (notInIndexs_1.length && notInIndexs_1.length < groupsLen) {
                        for (var i = 0; i < groupsLen; i++) {
                            if (notInIndexs_1.indexOf(i) < 0) {
                                lastIndexs.push(i);
                            }
                        }
                    }
                    if (lastIndexs.length) {
                        curGroups = lastIndexs.map(function (index) { return groups[index]; });
                    }
                }
            }
            return curGroups;
        })();
        if (captureName && namedGroupConf && namedGroupConf[captureName]) {
            var curRule = this.buildRule(flags);
            var index = makeRandom(0, namedGroupConf[captureName].length - 1);
            result = namedGroupConf[captureName][index];
            if (!curRule.test(result)) {
                throw new Error("the namedGroupConf of " + captureName + "'s value \"" + result + "\" is not match the rule " + curRule.toString());
            }
        }
        else {
            var lastGroups = filterGroups.length ? filterGroups : groups;
            var index = makeRandom(0, lastGroups.length - 1);
            var group = lastGroups[index];
            result = group.build(conf);
        }
        if (captureName) {
            conf.namedGroupData[captureName] = result;
        }
        if (captureIndex) {
            conf.captureGroupData[captureIndex] = result;
        }
        return result;
    };
    return RegexpGroup;
}(RegexpPart));
exports.RegexpGroup = RegexpGroup;
//# sourceMappingURL=index.js.map