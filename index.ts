import * as isEqual from 'lodash.isequal';

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
  Object.defineProperty(window, '__MONKEY_PATCH_FIRE__', {
    value: {
      observer,
    },
    writable: false,
  });
};


const print = () => {
  const printAbleObject = {};
  updateMap.forEach((values, key: string) => {
    return Object.assign(printAbleObject, {
      [key]: {
        ...values,
        children: values.children.child.name,
        props: Object.keys(values.props).join(),
      },
    });
  });
  console.table(printAbleObject);
};

const start = () => {
  getPerfResults();
  
  // tslint:disable-next-line:no-console
  console.log('start', updateMap);
};

const stop = () => {
  const { observer } = window.__MONKEY_PATCH_FIRE__;
  observer.disconnect();
  // tslint:disable-next-line:no-console
  console.log('Observer disconnected');
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

const getDisplayName = (o: any) =>
  `${o.displayName || o.constructor.displayName || o.constructor.name}`;


// function to return only props if they are deeply equal but not shallow equal
const checkChangesProps = (prevProps: any, componentInstance: any) => {
  return [
    ...Object.keys(prevProps),
    ...Object.keys(componentInstance.props),
  ].reduce((acc, key) => {
    const actualValue = componentInstance.props[key];
    const nextValue = prevProps[key];
    // https://github.com/maicki/why-did-you-update/issues/18
    // return clues on what changed and why. see above ^
    if (nextValue !== actualValue && isEqual(nextValue, actualValue)) {
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

export const monkeyPatchFire = (React: any, opts = {}) => {
  const _componentDidUpdate = React.Component.prototype.componentDidUpdate;

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
    delete React.__RESTORE_FN__;
  };

  return React;
};


// @TODO: extend to include Component State as well! even possible?
// @TODO: expose updateMap so can create a flameGraph
