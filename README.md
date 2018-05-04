# Monkey-Patch-Fire
A way to investigate and find unecessary component re-renderings in your react apps.

# Why did I make this:

I made this because I wanted to know react in greater detail. React is fantastic for writting UI but once you start looking at performance you need a way to conceptualise its re-rendering modal. This started out as a helper function to see why certain components were re-rendering and once React 16 came out I was able to combine it with the browsers performance api to get the timings. Essentially, this tool will log any React.Class component in which has updated but has deeply equal props to its previous props. One thing to note is if you pass new props to a functional component it will React will always re-render the component.

The timings are important for getting an idea of where to put your time. Potentially, you could have a component in which is re-rendering 100 times but only taking 2ms, its most likely not worth trying to optimise it. But if you have a component which is only re-rendering 2 times but is take 200ms it could be a signal to break up this component into a flatter tree or to see why exactly that prop is re-rendering.

### Opinion:

`ShouldComponentUpdate() === !important` 

`ShouldComponentUpdate()` should be used as a last resort to solve rendering problems. Quite often using this will hide the actual issues, much like the css property `!important` does with CSS specificity. There is a performance hit to looking up properties in Javascript, so there is the potential side effect of making your app actually slower using this.

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