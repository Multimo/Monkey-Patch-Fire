// tslint:disable-next-line:import-blacklist
import { isEqual } from 'lodash';

// ------------------------------------
//  SingleTon
// ------------------------------------

declare const PerformanceObserver: any;

interface Window {
  __MONKEY_PATCH_FIRE__: {
    getPerfResults: any;
    start: any;
    stop: any;
    print: any;
  };
}

const updateMap: UpdateMapShape = new Map();

type ComponentInstance = {
  _reactInternalFiber: any,
  child: ComponentInstance,
  type?: {
    name: string;
  },
  props: any,
  state: any,
};

type PerformanceEntryType = 'measure' | 'mark';
type PerformanceEntry = {
  duration: number
  entryType: PerformanceEntryType
  name: string
  startTime: number,
};

type PerformanceObserverEntryList = {
  getEntries(): PerformanceEntry[];
  getEntriesByName(name: string, type: PerformanceEntryType): PerformanceEntry[];
  getEntriesByType(type: PerformanceEntryType): PerformanceEntry[];
};

const getPerfResults = () => {
  const observer = new PerformanceObserver((list: PerformanceObserverEntryList) => {
    const entries = list.getEntriesByType('measure');
    entries.map((entry: PerformanceEntry) => {
      updateMap.forEach((value, key) => {
        if (entry.name.includes(key as string)) {
          updateMapPerformance(updateMap, key as string, entry);
        }
      });
    });
  });
  observer.observe({ entryTypes: ['measure'] });
};


const print = () => {
  const printAbleObject = {};
  updateMap.forEach((values, key) => {
    return Object.assign(printAbleObject, {
      [String(key)]: {
        ...values,
        children: values.children.child.name,
        props: Object.keys(values.props).join(),
      },
    });
  });

  // tslint:disable-next-line:no-console
  console.table(printAbleObject);
};

const start = () => {
  getPerfResults();
  // tslint:disable-next-line:no-console
  console.log('start', updateMap);
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
const addToChilren = (componentInstance: ComponentInstance): any =>
  getChildDisplayName(componentInstance)
  ? {
    name: getChildDisplayName(componentInstance),
    child: componentInstance.child && addToChilren(componentInstance.child),
  }
  : componentInstance.child && addToChilren(componentInstance.child);


// init func for the addToChildren.
const getChildren = (componentInstance: ComponentInstance) => {
  const children = {
    name: getChildDisplayName(componentInstance),
    child: addToChilren(componentInstance),
  };
  return children;
};

const getDisplayName = (o: any) =>
  `${o.displayName || o.constructor.displayName || o.constructor.name}`;


// function to return only props if they are deeply equal but not shallow equal
const checkChangesProps = (prevProps: any, componentInstance: ComponentInstance) => {
  return [
    ...Object.keys(prevProps),
    ...Object.keys(componentInstance.props),
  ].reduce((acc, key) => {
    const actualValue = componentInstance.props[key];
    const nextValue = prevProps[key];
    // https://github.com/maicki/why-did-you-update/issues/18
    // return clues on what changed and why. see above ^
    // nextValue !== actualValue &&
    if (isEqual(nextValue, actualValue)) {
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
    const componentInstance: ComponentInstance = this;

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
    map.set(displayName, Object.assign(updatedMapVaules, {
      ...updatedMapVaules,
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
) => {
  const updatedMapVaules = map.get(key);
  if (updatedMapVaules) {
    return map.set(key, Object.assign(updatedMapVaules, {
      wastedDurationInMS: updatedMapVaules.wastedDurationInMS + Math.floor(entry.duration),
    }));
  }
};


// ------------------------------------
//  Monkey Patcher
// ------------------------------------

export const monkeyPatchFire = (React: any) => {
  const _componentDidUpdate = React.Component.prototype.componentDidUpdate;
  React.Component.prototype.componentDidUpdate = createComponentDidUpdate(updateMap);

  if (window) {
    Object.defineProperty(window, '__MONKEY_PATCH_FIRE__', {
      value: {
        updateMap,
        print,
        start,
        getPerfResults,
      },
      writable: false,
    });
  }

  return React;
};

// @TODO: expose updateMap so can create a flameGraph
// @TODO: extend to include Component State as well! even possible?
