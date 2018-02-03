# Monkey-Patch-Fire
Just another React Performance Tool.

## ETHOS

For a MVP i would like to see:
- all re-renders for all types of `rendered` components.
- how long each Components re-renders are taking
- exactly what prop / state is causing the render.


# TODO:

1. Update inject script to patch over `React.createElement` or use `react.__REACT_DEVTOOLS_GLOBAL_HOOK__` so that can check re-renders in SFC & not have the collector overridden via custom `ComponentWillMount()` inside components.

2. Use the `browser` + `PerformanceObeserver` api to build and agregate all the component renders. ie How long its all taking

3. Display / visualise all of re-renderings. Flame graph, heats map, tables?

4. Have it injected via a browser addon vs having to import it inside and use on client load.
