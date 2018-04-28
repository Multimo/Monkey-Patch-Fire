"use strict";
var __assign = (this && this.__assign) || Object.assign || function(t) {
    for (var s, i = 1, n = arguments.length; i < n; i++) {
        s = arguments[i];
        for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
            t[p] = s[p];
    }
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
// tslint:disable-next-line:import-blacklist
var lodash_1 = require("lodash");
var updateMap = new Map();
var getPerfResults = function () {
    var observer = new PerformanceObserver(function (list) {
        var entries = list.getEntriesByType('measure');
        entries.map(function (entry) {
            updateMap.forEach(function (value, key) {
                if (entry.name.includes(key)) {
                    updateMapPerformance(updateMap, key, entry);
                }
            });
        });
    });
    observer.observe({ entryTypes: ['measure'] });
};
var print = function () {
    var printAbleObject = {};
    updateMap.forEach(function (values, key) {
        return Object.assign(printAbleObject, (_a = {},
            _a[String(key)] = __assign({}, values, { children: values.children.child.name, props: Object.keys(values.props).join() }),
            _a));
        var _a;
    });
    // tslint:disable-next-line:no-console
    console.table(printAbleObject);
};
var start = function () {
    getPerfResults();
    // tslint:disable-next-line:no-console
    console.log('start', updateMap);
};
// ------------------------------------
//  Helpers
// ------------------------------------
var getChildDisplayName = function (o) {
    if (!o.type) {
        // If the element is a not a element
        return null;
    }
    if (o.type.name !== null) {
        return o.type.name;
    }
    else {
        // should handle a bit better
        return 'NO NAME';
    }
};
// Recursive function to build an object of components children
var addToChilren = function (componentInstance) {
    return getChildDisplayName(componentInstance)
        ? {
            name: getChildDisplayName(componentInstance),
            child: componentInstance.child && addToChilren(componentInstance.child),
        }
        : componentInstance.child && addToChilren(componentInstance.child);
};
// init func for the addToChildren.
var getChildren = function (componentInstance) {
    var children = {
        name: getChildDisplayName(componentInstance),
        child: addToChilren(componentInstance),
    };
    return children;
};
var getDisplayName = function (o) {
    return "" + (o.displayName || o.constructor.displayName || o.constructor.name);
};
// function to return only props if they are deeply equal but not shallow equal
var checkChangesProps = function (prevProps, componentInstance) {
    return Object.keys(prevProps).concat(Object.keys(componentInstance.props)).reduce(function (acc, key) {
        var actualValue = componentInstance.props[key];
        var nextValue = prevProps[key];
        // https://github.com/maicki/why-did-you-update/issues/18
        // return clues on what changed and why. see above ^
        // nextValue !== actualValue &&
        if (lodash_1.isEqual(nextValue, actualValue)) {
            // console.log(displayName , nextValue, actualValue);
            acc[key] = { actualValue: actualValue, nextValue: nextValue };
        }
        return acc;
    }, {});
};
// ------------------------------------------
// Hook functions
// -------------------------------------------
function createComponentDidUpdate(updateMap) {
    return function componentDidUpdate(prevProps, prevState) {
        // tslint:disable-next-line:no-var-self
        var componentInstance = this;
        var displayName = getDisplayName(componentInstance);
        var changedProps = checkChangesProps(prevProps, componentInstance);
        if (Object.keys(changedProps).length) {
            updateMapfn(updateMap, displayName, changedProps, getChildren(componentInstance._reactInternalFiber));
        }
    };
}
var updateMapfn = function (map, displayName, displayProps, children) {
    if (map.has(displayName)) {
        var updatedMapVaules = map.get(displayName);
        map.set(displayName, Object.assign(updatedMapVaules, __assign({}, updatedMapVaules, { updates: updatedMapVaules ? updatedMapVaules.updates + 1 : 0 })));
    }
    else {
        map.set(displayName, {
            children: children,
            props: displayProps,
            updates: 1,
            wastedDurationInMS: 0,
        });
    }
};
var updateMapPerformance = function (map, key, entry) {
    var updatedMapVaules = map.get(key);
    if (updatedMapVaules) {
        return map.set(key, Object.assign(updatedMapVaules, {
            wastedDurationInMS: updatedMapVaules.wastedDurationInMS + Math.floor(entry.duration),
        }));
    }
};
// ------------------------------------
//  Monkey Patcher
// ------------------------------------
exports.monkeyPatchFire = function (React, opts) {
    if (opts === void 0) { opts = {}; }
    var _componentDidUpdate = React.Component.prototype.componentDidUpdate;
    React.Component.prototype.componentDidUpdate = createComponentDidUpdate(updateMap);
    if (window) {
        Object.defineProperty(window, '__MONKEY_PATCH_FIRE__', {
            value: {
                updateMap: updateMap,
                print: print,
                start: start,
                getPerfResults: getPerfResults,
            },
            writable: false,
        });
    }
    return React;
};
// @TODO: expose updateMap so can create a flameGraph
// @TODO: extend to include Component State as well! even possible?
