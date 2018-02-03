// tslint:disable-next-line:import-blacklist
import { isEqual } from 'lodash-es';
import { ReactElement, isValidElement } from 'react';

// ------------------------------------
//  SingleTon
// ------------------------------------


const updateMap: UpdateMapShape = new Map();


// ------------------------------------
//  Helpers
// ------------------------------------


const getDisplayName = (o: any) => o.displayName || o.constructor.displayName || o.constructor.name;
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
const addToChilren = (reactInstance: any): any =>
  getChildDisplayName(reactInstance)
  ? {
    name: getChildDisplayName(reactInstance),
    child: reactInstance.child && addToChilren(reactInstance.child),
  }
  : reactInstance.child && addToChilren(reactInstance.child);


// init func for the addToChildren.
const getChildren = (reactInstance: any) => {
  const children = {
    name: getChildDisplayName(reactInstance),
    child: addToChilren(reactInstance),
  };
  return children;
};


// function to return only props if they are deeply equal but not shallow equal
const checkChangesProps = (prevProps: any, componentInstance: ReactElement<any>) => {
  return [
    ...Object.keys(prevProps),
    ...Object.keys(componentInstance.props),
  ].reduce((acc, key) => {
    const actualValue = componentInstance.props[key];
    const nextValue = prevProps[key];
    // https://github.com/maicki/why-did-you-update/issues/18
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

      updateMapfn(
        updateMap,
        displayName,
        changedProps,
        getChildren(componentInstance._reactInternalFiber as any),
      );
    }
  };
}

function createComponentWillUpdate(updateMap: UpdateMapShape) {
  return function componentWilUpdate(nextProps: any, prevState: any) {
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
};

const updateMapfn = (
  updateMap: UpdateMapShape,
  displayName: string,
  displayProps: Object,
  children: Object,
) => {
  if (updateMap.has(displayName)) {
    const updatedMapVaules = updateMap.get(displayName);
    // console.log('updatemap get', updateMap.get(displayName));
    updateMap.set(displayName, Object.assign(updatedMapVaules, {
      updates: updatedMapVaules ? updatedMapVaules.updates + 1 : 0,
    }));
  } else {
    updateMap.set(displayName, {
      children,
      props: displayProps,
      updates: 1,
    });
  }
  // tslint:disable-next-line:no-console
  console.log(updateMap);
};


// ------------------------------------
//  Monkey Patcher
// ------------------------------------

// doesnt support sfc?
export const monkeyPatchFire = (React: any, opts = {}) => {
  const _componentDidUpdate = React.Component.prototype.componentDidUpdate;
  const _componentWillUpdate = React.Component.prototype.componentWillUpdate;

  React.Component.prototype.componentDidUpdate = createComponentDidUpdate(updateMap);
  React.Component.prototype.componentWillUpdate = createComponentWillUpdate(updateMap);

  // not sure is needed
  React.__RESTORE_FN__ = () => {
    React.Component.prototype.componentDidUpdate = _componentDidUpdate;
    React.Component.prototype.componentWillUpdate = _componentWillUpdate;
    delete React.__RESTORE_FN__;
  };

  return React;
};


// @TODO: Adds timings to updateMap
// @TODO: expose updateMap so can create a flameGraph
// @TODO: extend to include Component State as well!



// Other libraries that do things interestingly

// https://github.com/nitin42/react-perf-devtool
// How to get Data, put into new PerformanceObserver?

// var observer = new PerformanceObserver(function(list, obj) {
//   var entries = list.getEntries();
//   for (var i=0; i < entries.length; i++) {
//     console.log(entries)
//   }
// });
// observer.observe({entryTypes: ["mark", "frame"]});

// function perf_observer(list, observer) {
//    console.log('ob2:', entries)
// }
// var observer2 = new PerformanceObserver(perf_observer);
// observer2.observe({entryTypes: ["measure"]});

// React Component Tree?
// Todo or not todo?

// https://github.com/React-Sight/React-Sight
// injects script via chrome extension to hook into code
// monkey patches react render and updates tree based on that.
//
// window.__REACT_DEVTOOLS_GLOBAL_HOOK__.onCommitFiberRoot =  (function (original) {
//   return function (...args) {
//     console.log('DOM: ', args[1]); // logs the vdom

//     return original(...args);
//   };
// })(window.__REACT_DEVTOOLS_GLOBAL_HOOK__.onCommitFiberRoot);

// https://github.com/react-rpm/react-rpm

