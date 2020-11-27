"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
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
var __spreadArrays = (this && this.__spreadArrays) || function () {
    for (var s = 0, i = 0, il = arguments.length; i < il; i++) s += arguments[i].length;
    for (var r = Array(s), k = 0, i = 0; i < il; i++)
        for (var a = arguments[i], j = 0, jl = a.length; j < jl; j++, k++)
            r[k] = a[j];
    return r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RegexpGroup = exports.RegexpGroupItem = exports.RegexpASCII = exports.RegexpUnicodeAll = exports.RegexpUnicode = exports.RegexpHexCode = exports.RegexpRange = exports.RegexpSet = exports.RegexpTimesQuantifiers = exports.RegexpTimesMulti = exports.RegexpTimes = exports.RegexpRefOrNumber = exports.RegexpOctal = exports.RegexpTranslateChar = exports.RegexpChar = exports.RegexpAnchor = exports.RegexpPrint = exports.RegexpCharset = exports.RegexpControl = exports.RegexpBegin = exports.RegexpBackspace = exports.RegexpNull = exports.RegexpAny = exports.RegexpLookaround = exports.RegexpSpecial = exports.RegexpReference = exports.RegexpOrigin = exports.RegexpEmpty = exports.RegexpPart = exports.regexpRule = exports.parserRule = exports.CharsetHelper = void 0;
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
var getRandomTotalIndex = function (totals) {
    var total = getLastItem(totals);
    var rand = makeRandom(1, total);
    var nums = totals.length;
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
                nums -= avg + 1;
            }
            else {
                nums -= avg;
            }
        }
    }
    return {
        rand: rand,
        index: index,
    };
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
            var max = 0xdbff;
            var nextStart = 0xe000;
            var nextMax = 0xffff;
            var ranges_1 = [];
            var totals_1 = [];
            var total_1 = 0;
            var add = function (begin, end) {
                var num = end - begin + 1;
                if (num <= 0) {
                    return;
                }
                else {
                    ranges_1.push(num > 1 ? [begin, end] : [begin]);
                }
                total_1 += num;
                totals_1.push(total_1);
            };
            if (type === 'DOTALL') {
                add(start, max);
                add(nextStart, nextMax);
            }
            else {
                var excepts = type === 'ALL'
                    ? [[0x000a], [0x000d], [0x2028, 0x2029]]
                    : points[type.toLowerCase()];
                var isNegaWhitespace = type === 'S';
                var count = excepts.length - (isNegaWhitespace ? 1 : 0);
                var looped = 0;
                while (start <= max && count > looped) {
                    var _a = excepts[looped++], begin = _a[0], end = _a[1];
                    add(start, begin - 1);
                    start = (end || begin) + 1;
                }
                if (start < max) {
                    add(start, max);
                }
                if (isNegaWhitespace) {
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
        var last;
        var helper = CharsetHelper;
        if (['w', 'd', 's'].includes(type)) {
            last = helper.charsetOf(type);
        }
        else {
            if (type === '.') {
                if (flags.s) {
                    last = helper.charsetOfDotall();
                }
                else {
                    last = helper.charsetOfAll();
                }
            }
            else {
                last = helper.charsetOfNegated(type);
            }
            if (flags.u) {
                last = {
                    ranges: last.ranges.concat([helper.bigCharPoint]),
                    totals: last.totals.concat(helper.bigCharTotal),
                };
            }
        }
        return last;
    };
    CharsetHelper.make = function (type, flags) {
        if (flags === void 0) { flags = {}; }
        return CharsetHelper.makeOne(CharsetHelper.getCharsetInfo(type, flags));
    };
    CharsetHelper.makeOne = function (info) {
        var totals = info.totals, ranges = info.ranges;
        var _a = getRandomTotalIndex(totals), rand = _a.rand, index = _a.index;
        var codePoint = ranges[index][0] + (rand - (totals[index - 1] || 0)) - 1;
        return String.fromCodePoint(codePoint);
    };
    CharsetHelper.points = {
        d: [[48, 57]],
        w: [[48, 57], [65, 90], [95], [97, 122]],
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
    CharsetHelper.lens = {
        d: [10],
        w: [10, 36, 37, 63],
        s: [5, 6, 7, 8, 18, 20, 21, 22, 23, 24],
    };
    CharsetHelper.bigCharPoint = [0x10000, 0x10ffff];
    CharsetHelper.bigCharTotal = 0x10ffff - 0x10000 + 1;
    CharsetHelper.cache = {};
    return CharsetHelper;
}());
exports.CharsetHelper = CharsetHelper;
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
exports.parserRule = new RegExp("^\\/(?:\\\\.|\\[[^\\]]*\\]|[^\\/])+?/[" + flagItems + "]*");
var regexpRuleContext = "((?:\\\\.|\\[[^\\]]*\\]|[^\\/])+?)";
exports.regexpRule = new RegExp("^\\/" + regexpRuleContext + "\\/([" + flagItems + "]*)$");
var regexpNoFlagsRule = new RegExp("^" + regexpRuleContext + "$");
var octalRule = /^(0[0-7]{0,2}|[1-3][0-7]{0,2}|[4-7][0-7]?)/;
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
        if (rule instanceof RegExp) {
            this.rule = rule.toString();
            this.context = rule.source;
            this.flags = rule.flags.split('');
        }
        else {
            if (exports.regexpRule.test(rule) || regexpNoFlagsRule.test(rule)) {
                this.rule = rule;
                this.context = RegExp.$1;
                this.flags = RegExp.$2 ? RegExp.$2.split('') : [];
            }
            else {
                throw new Error("wrong regexp:" + rule);
            }
        }
        this.checkFlags();
        this.parse();
        this.lastRule = this.ruleInput;
    }
    Parser.prototype.build = function () {
        if (this.hasLookaround) {
            throw new Error('the build method does not support lookarounds.');
        }
        var rootQueues = this.rootQueues;
        var result = '';
        var conf = __assign(__assign({}, this.config), { flags: this.flagsHash, namedGroupData: {}, captureGroupData: {}, beginWiths: [], endWiths: [] });
        var nullRootErr = 'the regexp has null expression, will match nothing';
        if (this.hasNullRoot === true) {
            throw new Error(nullRootErr);
        }
        else {
            this.hasNullRoot = rootQueues.some(function (queue) {
                if (queue.isMatchNothing) {
                    return true;
                }
                result += queue.build(conf);
                return false;
            });
            if (this.hasNullRoot)
                throw new Error(nullRootErr);
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
        var _this = this;
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
        var refOrNumbers = [];
        var addToQueue = function () {
            var args = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args[_i] = arguments[_i];
            }
            args.forEach(function (queue) { return (queue.parser = _this); });
            queues.push.apply(queues, args);
        };
        var groupCaptureIndex = 0;
        var curSet = null;
        var curRange = null;
        var addToGroupOrLookaround = function (cur) {
            var curQueue = getLastItem(nestQueues) ||
                getLastItem(groups) ||
                getLastItem(lookarounds);
            if (['group', 'lookaround'].includes(cur.type)) {
                var lists = cur.type === 'group' ? groups : lookarounds;
                lists.push(cur);
                nestQueues.push(cur);
            }
            if (curQueue) {
                if (curQueue.type === 'group') {
                    curQueue.addItem(cur);
                }
                else {
                    cur.parent = curQueue;
                }
            }
        };
        var isWrongRepeat = function (type, prev) {
            var denyTypes = [
                'groupBegin',
                'groupSplitor',
                'times',
                'begin',
                'anchor',
            ];
            return (denyTypes.includes(type) ||
                (type === 'charset' && prev.charset.toLowerCase() === 'b'));
        };
        while (i < j) {
            var char = context.charAt(i++);
            if ((curRange || curSet) &&
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
                ].includes(char)) {
                var newChar = new RegexpChar(char);
                if (curRange) {
                    newChar.parent = curRange;
                    curRange = null;
                }
                else {
                    newChar.parent = curSet;
                }
                addToQueue(newChar);
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
                        target =
                            next === 'x'
                                ? new RegexpASCII()
                                : hasFlagU
                                    ? new RegexpUnicodeAll()
                                    : new RegexpUnicode();
                        var matchedNum = target.untilEnd(context.slice(i));
                        if (matchedNum === 0) {
                            if (hasFlagU) {
                                throw new Error("invalid unicode code point:" + context);
                            }
                            target = new RegexpTranslateChar("\\" + next);
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
                            if (/[A-Za-z]/.test(code)) {
                                target = new RegexpControl(code);
                                i++;
                            }
                            else {
                                target = new RegexpChar('\\');
                                i--;
                            }
                        }
                    }
                    else if (['d', 'D', 'w', 'W', 's', 'S', 'b', 'B'].includes(next)) {
                        target = new RegexpCharset(input);
                    }
                    else if (['t', 'r', 'n', 'f', 'v'].includes(next)) {
                        target = new RegexpPrint(input);
                    }
                    else if (/^(\d+)/.test(nextAll)) {
                        var no = RegExp.$1;
                        if (curSet) {
                            if (octalRule.test(no)) {
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
                                if (no.length === 1) {
                                    target = new RegexpNull();
                                }
                                else {
                                    if (+no.charAt(1) > 7) {
                                        target = new RegexpNull();
                                    }
                                    else {
                                        var octal = no.length >= 3 && +no.charAt(2) <= 7
                                            ? no.slice(1, 3)
                                            : no.charAt(1);
                                        target = new RegexpOctal("\\0" + octal);
                                        i += octal.length;
                                    }
                                }
                            }
                            else {
                                i += no.length - 1;
                                if (+no <= captureGroups.length) {
                                    target = new RegexpReference("\\" + no);
                                    var refGroup = captureGroups[+no - 1];
                                    refGroups[no] = refGroup;
                                    if (refGroup.isAncestorOf(lastGroup)) {
                                        target.ref = null;
                                    }
                                    else {
                                        target.ref = refGroup;
                                    }
                                }
                                else {
                                    target = new RegexpRefOrNumber("\\" + no);
                                    refOrNumbers.push(target);
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
                        var last = (curNest.type === 'group'
                            ? groups
                            : lookarounds).pop();
                        last.isComplete = true;
                        special = new RegexpSpecial(curNest.type + "End");
                        special.parent = last;
                    }
                    else {
                        throw new Error("unmatched " + char + ",you mean \"\\" + char + "\"?");
                    }
                    break;
                case s.groupSplitor:
                    var group = getLastItem(groups);
                    if (!group) {
                        var rootGroup = new RegexpGroup();
                        rootGroup.isRoot = true;
                        rootGroup.addRootItem(queues.slice(1));
                        queues.splice(1, 0, rootGroup);
                        groups.push(rootGroup);
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
                        addToQueue(curSet);
                        addToGroupOrLookaround(curSet);
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
                                addToQueue(curRange, lastQueue);
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
                    target =
                        char === s.multipleBegin
                            ? new RegexpTimesMulti()
                            : new (RegexpTimesQuantifiers.bind.apply(RegexpTimesQuantifiers, __spreadArrays([void 0], (this.config.maxRepeat ? [this.config.maxRepeat] : []))))();
                    var num = target.untilEnd(context.slice(i - 1));
                    if (num > 0) {
                        var type = lastQueue instanceof RegexpSpecial
                            ? lastQueue.special
                            : lastQueue.type;
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
                case s.beginWith:
                case s.endWith:
                    target = new RegexpAnchor(char);
                    break;
                case s.delimiter:
                    throw new Error("unexpected pattern end delimiter:\"/" + nextAll + "\"");
                default:
                    target = new RegexpChar(char);
            }
            if (target) {
                var cur = target;
                addToQueue(cur);
                if (curRange) {
                    if (target.codePoint < 0) {
                        var _a = queues.splice(-4, 4), first = _a[1], second = _a[3];
                        var middle = new RegexpChar('-');
                        curSet.pop();
                        [first, middle, second].map(function (item) {
                            item.parent = curSet;
                            addToQueue(item);
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
                    addToGroupOrLookaround(cur);
                }
            }
            if (special) {
                if (target) {
                    special.parent = target;
                }
                addToQueue(special);
            }
        }
        if (refOrNumbers.length) {
            var replace_1 = function (lists, search, rep) {
                var idx = 0;
                var finded = false;
                for (var len = lists.length; idx < len; idx++) {
                    if (search === lists[idx]) {
                        finded = true;
                        break;
                    }
                }
                if (finded) {
                    lists.splice.apply(lists, __spreadArrays([idx, 1], rep));
                }
            };
            var refLen_1 = captureGroups.length;
            refOrNumbers.map(function (item) {
                var strNum = item.input.slice(1);
                var total = strNum.length;
                var matchLen = 0;
                var instance;
                if (strNum.charAt(0) !== '0' && +strNum <= refLen_1) {
                    instance = new RegexpReference(item.input);
                    instance.ref = null;
                    matchLen = total;
                }
                else {
                    if (/^([1-3][0-7]{0,2}|[4-7][0-7]?)/.test(strNum)) {
                        var octal = RegExp.$1;
                        instance = new RegexpOctal("\\" + octal);
                        matchLen += octal.length;
                    }
                    else {
                        instance = new RegexpTranslateChar("\\" + strNum.charAt(0));
                        matchLen += 1;
                    }
                }
                instance.linkParent = item.parent;
                var res = [instance];
                while (matchLen < total) {
                    var curChar = new RegexpChar(strNum.charAt(matchLen++));
                    curChar.linkParent = item.parent;
                    res.push(curChar);
                }
                if (item.parent) {
                    replace_1(item.parent.queues, item, res);
                }
                replace_1(queues, item, res);
            });
        }
        if (queues.length > 1 &&
            queues[1].type === 'group' &&
            queues[1].isRoot === true) {
            queues[1].isComplete = true;
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
            throw new Error("The rule may has repeated or unrecognized flags<got '" + flags.join('') + "'>, please check.");
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
    Parser.prototype.getFlagsHash = function () {
        return this.flagsHash;
    };
    Parser.maxRepeat = 5;
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
    Object.defineProperty(RegexpPart.prototype, "parser", {
        get: function () {
            return this.parserInstance;
        },
        set: function (parser) {
            this.parserInstance = parser;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(RegexpPart.prototype, "count", {
        get: function () {
            return this.getCodePointCount();
        },
        enumerable: false,
        configurable: true
    });
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
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(RegexpPart.prototype, "linkParent", {
        set: function (value) {
            this.curParent = value;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(RegexpPart.prototype, "isComplete", {
        get: function () {
            return this.completed;
        },
        set: function (value) {
            this.completed = value;
        },
        enumerable: false,
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
        enumerable: false,
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
    RegexpPart.prototype.untilEnd = function (_context) {
    };
    RegexpPart.prototype.setDataConf = function (_conf, _result) {
    };
    RegexpPart.prototype.isAncestorOf = function (target) {
        do {
            if (target === this) {
                return true;
            }
        } while ((target = target === null || target === void 0 ? void 0 : target.parent));
        return false;
    };
    RegexpPart.prototype.getRuleInput = function (_parseReference) {
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
    RegexpPart.prototype.getCodePointCount = function () {
        return 1;
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
            return captureGroupData.hasOwnProperty(captureIndex)
                ? captureGroupData[captureIndex]
                : '';
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
    RegexpCharset.prototype.getCodePointCount = function () {
        var _a = this, parser = _a.parser, charset = _a.charset;
        var totals = charH.getCharsetInfo(charset, parser.getFlagsHash()).totals;
        return getLastItem(totals);
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
        return new Function('', "return '" + this.input + "'")();
    };
    return RegexpPrint;
}(RegexpPart));
exports.RegexpPrint = RegexpPrint;
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
var RegexpRefOrNumber = (function (_super) {
    __extends(RegexpRefOrNumber, _super);
    function RegexpRefOrNumber(input) {
        var _this = _super.call(this, input) || this;
        _this.type = 'refornumber';
        return _this;
    }
    RegexpRefOrNumber.prototype.prebuild = function () {
        throw new Error("the \"" + this.input + "\" must parse again,either reference or number");
    };
    return RegexpRefOrNumber;
}(RegexpPart));
exports.RegexpRefOrNumber = RegexpRefOrNumber;
var RegexpTimes = (function (_super) {
    __extends(RegexpTimes, _super);
    function RegexpTimes() {
        var _this = _super.call(this) || this;
        _this.type = 'times';
        _this.maxNum = Parser.maxRepeat;
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
        enumerable: false,
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
        _this.rule = /^(\{(\d+)(,|,(\d*))?}(\??))/;
        return _this;
    }
    RegexpTimesMulti.prototype.parse = function () {
        var min = RegExp.$2, code = RegExp.$3, max = RegExp.$4, optional = RegExp.$5;
        this.greedy = optional !== '?';
        this.minRepeat = parseInt(min, 10);
        this.maxRepeat = Number(max)
            ? parseInt(max, 10)
            : code
                ? this.minRepeat + this.maxNum * 2
                : this.minRepeat;
        if (this.maxRepeat < this.minRepeat) {
            throw new Error("wrong quantifier: {" + this.minRepeat + ", " + this.maxRepeat + "}");
        }
    };
    return RegexpTimesMulti;
}(RegexpTimes));
exports.RegexpTimesMulti = RegexpTimesMulti;
var RegexpTimesQuantifiers = (function (_super) {
    __extends(RegexpTimesQuantifiers, _super);
    function RegexpTimesQuantifiers(maxNum) {
        if (maxNum === void 0) { maxNum = Parser.maxRepeat; }
        var _this = _super.call(this) || this;
        _this.maxNum = maxNum;
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
    Object.defineProperty(RegexpSet.prototype, "parser", {
        get: function () {
            return this.parserInstance;
        },
        set: function (parser) {
            this.parserInstance = parser;
            this.makeCodePointResult();
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(RegexpSet.prototype, "isComplete", {
        get: function () {
            return this.completed;
        },
        set: function (value) {
            this.completed = value;
            if (value === true) {
                var isEmptyQueue = this.queues.length === 0;
                if (isEmptyQueue) {
                    if (this.reverse) {
                        this.isMatchAnything = true;
                    }
                    else {
                        this.isMatchNothing = true;
                    }
                }
                else {
                    this.makeCodePointResult();
                }
            }
        },
        enumerable: false,
        configurable: true
    });
    RegexpSet.prototype.getRuleInput = function () {
        return ('[' + (this.reverse ? '^' : '') + this.buildRuleInputFromQueues() + ']');
    };
    RegexpSet.prototype.prebuild = function (conf) {
        if (this.isMatchAnything) {
            return new RegexpAny().build(conf);
        }
        var queues = this.queues;
        if (this.reverse) {
            return charH.makeOne(this.codePointResult);
        }
        var index;
        if (conf.extractSetAverage) {
            var total_2 = 0;
            var totals = queues.map(function (queue) { return (total_2 = total_2 + queue.count); });
            index = getRandomTotalIndex(totals).index;
        }
        else {
            index = makeRandom(0, queues.length - 1);
        }
        return this.queues[index].build(conf);
    };
    RegexpSet.prototype.makeCodePointResult = function () {
        if (!this.reverse || !this.parser || !this.isComplete)
            return;
        if (!this.codePointResult) {
            var _a = this, queues = _a.queues, parser = _a.parser;
            var flags_1 = parser.getFlagsHash();
            if (queues.length === 1 &&
                queues[0].type === 'charset' &&
                ['w', 's', 'd'].includes(queues[0].charset.toLowerCase())) {
                var charCode = queues[0].charset.charCodeAt(0) ^ 32;
                var charset = String.fromCharCode(charCode);
                this.codePointResult = charH.getCharsetInfo(charset, flags_1);
            }
            else {
                var ranges = queues.reduce(function (res, item) {
                    var type = item.type;
                    var cur;
                    if (type === 'charset') {
                        var charset = item.charset;
                        if (charset === 'b' || charset === 'B') {
                            console.warn('the charset \\b or \\B will ignore');
                            cur = [];
                        }
                        else {
                            cur = charH.getCharsetInfo(charset, flags_1).ranges.slice(0);
                        }
                    }
                    else if (type === 'range') {
                        cur = [
                            item.queues.map(function (e) {
                                return e.codePoint;
                            }),
                        ];
                    }
                    else {
                        cur = [[item.codePoint]];
                    }
                    return res.concat(cur);
                }, []);
                ranges.push([0xd800, 0xdfff], flags_1.u ? [0x110000] : [0x10000]);
                ranges.sort(function (a, b) {
                    return b[0] > a[0] ? -1 : b[0] === a[0] ? (b[1] > a[1] ? 1 : -1) : 1;
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
                    var total_3 = 0;
                    var totals = negated.map(function (item) {
                        if (item.length === 1) {
                            total_3 += 1;
                        }
                        else {
                            total_3 += item[1] - item[0] + 1;
                        }
                        return total_3;
                    });
                    this.codePointResult = { totals: totals, ranges: negated };
                }
            }
        }
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
    RegexpRange.prototype.getCodePointCount = function () {
        var _a = this.queues, prev = _a[0], next = _a[1];
        var min = prev.codePoint;
        var max = next.codePoint;
        return max - min + 1;
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
            if (this.codePoint > 0x10ffff) {
                throw new Error("invalid unicode code point:\\u{" + lastCode + "},can not great than 0x10ffff");
            }
            this.input = "\\" + codeType + all;
            return all.length;
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
        _this.rule = /^({(0*[0-9A-Fa-f]{1,6})}|[0-9A-Fa-f]{4})/;
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
            if (parseReference &&
                item.type === 'reference' &&
                item.ref !== null) {
                cur = item.ref.getRuleInput(parseReference);
            }
            else {
                cur = _this.isEndLimitChar(item)
                    ? ''
                    : item.getRuleInput(parseReference);
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
        return target.type === 'anchor';
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
        enumerable: false,
        configurable: true
    });
    RegexpGroup.prototype.addNewGroup = function () {
        var queues = this.queues;
        var groupItem = new RegexpGroupItem(queues.length);
        this.curGroupItem = groupItem;
        groupItem.parent = this;
        return groupItem;
    };
    RegexpGroup.prototype.addRootItem = function (target) {
        var _this = this;
        target.map(function (item) {
            if (item.parent === null) {
                item.parent = _this.curGroupItem;
            }
        });
        this.addNewGroup();
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
        if (captureIndex === 0 && !isRoot) {
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
            return (this.curRule = new Function('', "return /^" + rule + "$/" + flag)());
        }
    };
    RegexpGroup.prototype.prebuild = function (conf) {
        var _a = this, groups = _a.queues, captureIndex = _a.captureIndex, captureName = _a.captureName;
        var result = '';
        var flags = conf.flags, namedGroupConf = conf.namedGroupConf;
        var groupsLen = groups.length;
        var filterGroups = [];
        var overrideGroups = [];
        var overrideValues = [];
        var segNamedGroup;
        var segNamedValue = [];
        if (captureName && captureName.includes('_') && namedGroupConf) {
            var segs = captureName.split('_');
            if (segs.length === groupsLen) {
                var hasGroup_1 = false;
                if (typeof namedGroupConf[captureName] === 'object') {
                    var conf_1 = namedGroupConf[captureName];
                    segs.forEach(function (key, index) {
                        if (typeof conf_1[key] === 'boolean' && conf_1[key] === false) {
                        }
                        else {
                            hasGroup_1 = true;
                            var groupItem = groups[index];
                            if (Array.isArray(conf_1[key])) {
                                overrideGroups.push(groupItem);
                                overrideValues.push(conf_1[key]);
                            }
                            else {
                                filterGroups.push(groupItem);
                            }
                        }
                    });
                }
                if (!hasGroup_1) {
                    throw new Error("the specified named group '" + captureName + "' are all filtered by the config.");
                }
                else {
                    var overrideItemNum = overrideGroups.length;
                    if (overrideItemNum) {
                        var index = makeRandom(0, overrideItemNum + filterGroups.length - 1);
                        if (index < overrideItemNum) {
                            segNamedGroup = overrideGroups[index];
                            segNamedValue = overrideValues[index];
                        }
                    }
                }
            }
        }
        if (captureName &&
            namedGroupConf &&
            namedGroupConf[captureName] &&
            (Array.isArray(namedGroupConf[captureName]) || segNamedGroup)) {
            var namedGroup = void 0;
            var curRule = void 0;
            if (!segNamedGroup) {
                namedGroup = namedGroupConf[captureName];
                curRule = this.buildRule(flags);
            }
            else {
                namedGroup = segNamedValue;
                curRule = this.buildRule.call(segNamedGroup, flags);
            }
            var index = makeRandom(0, namedGroup.length - 1);
            result = namedGroup[index];
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