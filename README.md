# Monkey-Patch-Fire
Just another React Performance Tool.

## ETHOS

For a MVP i would like to see:
- all re-renders for all types of `rendered` components.
- how long each Components re-renders are taking
- exactly what prop / state is causing the render.
- 


# TODO:

- [] Update inject script to patch over `React.createElement` or use `react.__REACT_DEVTOOLS_GLOBAL_HOOK__` so that can check re-renders in SFC & not have the collector overridden via custom `ComponentWillMount()` inside components.

- [] Use the `browser` + `PerformanceObeserver` api to build and agregate all the component renders. ie How long its all taking

- [] Display / visualise all of re-renderings. Flame graph, heats map, tables?

- [] Have it injected via a browser addon vs having to import it inside and use on client load.

- [] Add tests

- [] Add installation instructions

- [] Differ on the different type of re-renders:


components can update for multiple reasons (e.g. new objects and new functions). Ideally all reasons would be displayed at once to make the debugging experience easier.

E.g., if we render this twice:

// (ClassDemo is not a PureComponent)

```
<ClassDemo a={1} b={{c: {d: 4}}} e={function something () {}} f={1} />
```
There are multiple avoidable reasons why ClassDemo will update:

- Functions for props e are not reference equal but are similar.
- Objects for props b are not reference equal but are deep equal.
- Props a and f are reference equal, but component is not PureComponent.

Currently we only log:
  The name of the prop that changed. 

ClassDemo.props: Changes are in functions only. Possibly avoidable re-render?
```
Functions before: {e: ƒ}
Functions after: {e: ƒ}
```
After fixing prop e so the functions are the same, the next error is uncovered:

ClassDemo.props: Value did not change. Avoidable re-render!
```
Before: {a: 1, b: {…}, e: 1, f: 1}
After: {a: 1, b: {…}, e: 1, f: 1}
"b" property is not equal by reference
```
After fixing prop b so the objects are the same, the next (final) error is uncovered:

ClassDemo.props: Value did not change. Avoidable re-render!
```
Before: {a: 1, b: 1, e: 1, f: 1}
After: {a: 1, b: 1, e: 1, f: 1}
```
After making the component a PureComponent, finally we have fixed all the errors.

Ideally, we would aggregate all reasons into one log. E.g.

ClassDemo.props:
- Functions for props `e` are not reference equal but are similar.
- Objects for props `b` are not reference equal but are deep equal.
- Props `a` and `f` are reference equal, but component is not `PureComponent`.
Possibly avoidable re-render?