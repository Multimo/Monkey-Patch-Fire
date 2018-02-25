// tslint:disable-next-line:import-blacklist
import { isEqual } from 'lodash-es';
import { ReactElement } from 'react';

// ------------------------------------
//  SingleTon
// ------------------------------------

const updateMap: UpdateMapShape = new Map();

type PerformanceEntryType = 'measure' | 'mark';
type PerformanceEntry = {
  duration: number
  entryType: PerformanceEntryType
  name: string
  startTime: number,
};

const getPerfResults = () => {
  const observer = new PerformanceObserver((list) => {
    const entries = list.getEntriesByType('measure');
    entries.map((entry: PerformanceEntry) => {
      updateMap.forEach((value, key) => {
        if (entry.name.includes(key)) {
          updateMapPerformance(updateMap, key, entry);
        }
      });
    });
  });
  observer.observe({ entryTypes: ['measure'] });
};


const print = () => {
  // tslint:disable-next-line:no-console
  console.log('hehlo', updateMap);
};

const start = () => {
  // tslint:disable-next-line:no-console
  console.log('start', updateMap);
};

const stop = () => {
  // tslint:disable-next-line:no-console
  console.log('stop', updateMap);
};

// ------------------------------------
//  Helpers
// ------------------------------------

const getChildDisplayName = (o: any) => {
  if (!o.type) {
    // If the element is a not a element
    return null;
  }
  if (o.type.name !== null) {
    return o.type.name;
  } else {
    // should handle a bit better
    return 'NO NAME';
  }
};


// Recursive function to build an object of components children
const addToChilren = (componentInstance: any): any =>
  getChildDisplayName(componentInstance)
  ? {
    name: getChildDisplayName(componentInstance),
    child: componentInstance.child && addToChilren(componentInstance.child),
  } : componentInstance.child && addToChilren(componentInstance.child);


// init func for the addToChildren.
const getChildren = (componentInstance: any) => {
  const children = {
    name: getChildDisplayName(componentInstance),
    child: addToChilren(componentInstance),
  };
  return children;
};


// const setPerfMark = async (type: 'start' | 'end', componentName: string) => {
//   if (!performance.mark) {
//     // tslint:disable-next-line:no-console
//     console.log('Performance Api is NOT supported in your Browser', componentName);
//     return;
//   }
//   await performance.mark(`${type}: ${componentName}`);
// };
// const startPerMark = (componentName: string) => setPerfMark('start', componentName);
// const endPerMark = (componentName: string) => setPerfMark('end', componentName);

// const setPerfMeasure = async (componentName: string) => {
//   if (!performance.measure) {
//     // tslint:disable-next-line:no-console
//     console.log('Performance Api is NOT supported in your Browser', componentName);
//     return;
//   }
//   try {
//     await performance.measure(
//       `${componentName}`,
//       `start: ${componentName}`,
//       `end: ${componentName}`,
//     );

//     performance.clearMarks(`start: ${componentName}`);
//     performance.clearMarks(`end: ${componentName}`);
//   } catch (error) {
//     console.log(error);
//     return;
//   }
// };


// const reactEmoji = '\u269B';
const getDisplayName = (o: any) =>
  `${o.displayName || o.constructor.displayName || o.constructor.name}`;


// function to return only props if they are deeply equal but not shallow equal
const checkChangesProps = (prevProps: any, componentInstance: ReactElement<any>) => {
  return [
    ...Object.keys(prevProps),
    ...Object.keys(componentInstance.props),
  ].reduce((acc, key) => {
    const actualValue = componentInstance.props[key];
    const nextValue = prevProps[key];
    // https://github.com/maicki/why-did-you-update/issues/18
    // return clues on what changed and why. see above ^
    if (nextValue !== actualValue && isEqual(nextValue, actualValue)) {
      // console.log(displayName , nextValue, actualValue);
      acc[key] = { actualValue, nextValue };
    }

    return acc;
  }, {} as { [key: string]: any });
};


// ------------------------------------------
// Hook functions
// -------------------------------------------

function createComponentDidUpdate(updateMap: UpdateMapShape) {
  return function componentDidUpdate(prevProps: any, prevState: any) {
    // tslint:disable-next-line:no-var-self
    const componentInstance: any = this;
    const displayName = getDisplayName(componentInstance);

    const changedProps = checkChangesProps(prevProps, componentInstance);

    if (Object.keys(changedProps).length) {
      // endPerMark(displayName);
      // setPerfMeasure(displayName);

      updateMapfn(
        updateMap,
        displayName,
        changedProps,
        getChildren(componentInstance._reactInternalFiber as any),
      );
    } else {
      // performance.clearMarks(`start: ${displayName}`);
    }
  };
}

function createComponentWillUpdate() {
  return function componentWilUpdate(nextProps: any, prevState: any) {
    // startPerMark(getDisplayName(this));
  };
}

// ------------------------------------
//  Update function
// ------------------------------------

type UpdateMapShape = Map<String, updateMapValues>;

type updateMapValues = {
  children: any,
  props: any,
  updates: number,
  wastedDurationInMS: number,
};


const updateMapfn = (
  map: UpdateMapShape,
  displayName: string,
  displayProps: Object,
  children: Object,
) => {
  if (map.has(displayName)) {
    const updatedMapVaules = map.get(displayName);
    // console.log('map get', map.get(displayName));
    map.set(displayName, Object.assign(updatedMapVaules, {
      updates: updatedMapVaules ? updatedMapVaules.updates + 1 : 0,
    }));
  } else {
    map.set(displayName, {
      children,
      props: displayProps,
      updates: 1,
      wastedDurationInMS: 0,
    });
  }
  // tslint:disable-next-line:no-console
  // console.log(updateMap);
};

const updateMapPerformance = (
  map: UpdateMapShape,
  key: string,
  entry: PerformanceEntry,
): UpdateMapShape => {
  const updatedMapVaules = map.get(key);
  return map.set(key, Object.assign(updatedMapVaules, {
    wastedDurationInMS: updatedMapVaules.wastedDurationInMS + entry.duration,
  }));
};


// ------------------------------------
//  Monkey Patcher
// ------------------------------------

// doesnt support sfc?
export const monkeyPatchFire = (React: any, opts = {}) => {
  const _componentWillUpdate = React.Component.prototype.componentWillUpdate;
  const _componentDidUpdate = React.Component.prototype.componentDidUpdate;

  React.Component.prototype.componentWillUpdate = createComponentWillUpdate();
  React.Component.prototype.componentDidUpdate = createComponentDidUpdate(updateMap);


  if (window) {
    Object.defineProperty(window, '__MONKEY_PATCH_FIRE__', {
      value: {
        updateMap,
        print,
        start,
        stop,
        getPerfResults,
      },
      writable: false,
    });
  }

  // not sure is needed
  React.__RESTORE_FN__ = () => {
    React.Component.prototype.componentDidUpdate = _componentDidUpdate;
    React.Component.prototype.componentWillUpdate = _componentWillUpdate;
    delete React.__RESTORE_FN__;
  };

  return React;
};


// __REACT_DEVTOOLS_GLOBAL_HOOK__.onCommitFiberRoot = (function (original) {
//   return function (...args) {
//     console.log(args)
//     return original(...args);
//   };
// })(__REACT_DEVTOOLS_GLOBAL_HOOK__.onCommitFiberRoot);

// @TODO: Adds timings to updateMap
// @TODO: expose updateMap so can create a flameGraph
// @TODO: extend to include Component State as well! even possible?



// Other libraries that do things interestingly

// https://github.com/nitin42/react-perf-devtool
// How to get Data, put into new PerformanceObserver?

// var observer = new PerformanceObserver(function(list, obj) {
//   var entries = list.getEntriesByType("measure");
//   for (var i=0; i < entries.length; i++) {
//     console.log(entries)
//   }
// });
// observer.observe({entryTypes: ["measure"]});

// function perf_observer(list, observer) {
//    console.log('ob2:', entries)a
// }
// var observer2 = new PerformanceObserver(perf_observer);
// observer2.observe({entryTypes: ["measure"]});

// React Component Tree?
// Todo or not todo?



// https://github.com/React-Sight/React-Sight
// injects script via chrome extension hook
// monkey patches their injector hooks and updates tree based on that.
//
// window.__REACT_DEVTOOLS_GLOBAL_HOOK__.onCommitFiberRoot =  (function (original) {
//   return function (...args) {
//     console.log('DOM: ', args[1]); // logs the vdom

//     return original(...args);
//   };
// })(window.__REACT_DEVTOOLS_GLOBAL_HOOK__.onCommitFiberRoot);

// https://github.com/react-rpm/react-rpm



// const json = {
//   mounted: true
//   options: {wait: false, withRef: false, bindI18n: "languageChanged loaded", bindStore: "added removed", translateFuncName: "t", …}
//   props: {ns: Array(1), wait: false, withRef: false, bindI18n: "languageChanged loaded", bindStore: "added removed", }
//   refs: {}
//   state: {i18nLoadedAt: null, ready: true}
//   t: ƒ fixedT(key, opts)
//   updater: {isMounted: ƒ, enqueueSetState: ƒ, enqueueReplaceState: ƒ, enqueueForceUpdate: ƒ}
//   __reactInternalMemoizedMaskedChildContext: {i18n: I18n}
//   __reactInternalMemoizedMergedChildContext: {i18n: I18n, store: {…}, storeSubscription: null, @@contextSubscriber/router: {…}, router: {…}, …}
// __reactInternalMemoizedUnmaskedChildContext: {i18n: I18n, store;: {…}, storeSubscription: null,; @@contextSubscriber/router: {…}, router: {…}, …};
//                                               _reactInternalFiber: FiberNode; {tag: 2, key;: null, type;: ƒ, stateNode: I18n,  return: FiberNode,  …}
//                                               _reactInternalInstance: {_processChildContext: ƒ}
//                                               isMounted: (...)
//   replaceState:                               (...)
//   __proto__:                                  Component
//                                               componentDidMount: ƒ componentDidMount()
//                                               componentWillMount: ƒ componentWillMount()
//                                               componentWillUnmount: ƒ componentWillUnmount()
//                                               constructor: ƒ I18n(props, context)
//                                               getChildContext: ƒ getChildContext()
//                                               getI18nTranslate: ƒ getI18nTranslate()
//                                               isMounted: (...)
//   onI18nChanged:                              ƒ onI18nChanged()
//                                               arguments: (...)
//   caller:                                     (...)
//   length:                                     0
//                                               name: 'onI18nChanged'
//                                               prototype: {constructor: ƒ}
//                                               render: ƒ render()
//                                               replaceState: (...)
//   __proto__; :                                [Object Object];
// }


// Use below to get the children of a component.

