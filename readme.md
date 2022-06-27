# Grammy Views

This is an early prototype for Grammy Views — UI framework for [grammY](https://grammy.dev)

Grammy Views is a UI framework for Telegram bots that provides abstractions for controlling UI states.

## Installation

### Yarn

```bash
yarn add @loskir/grammy-views
```

### NPM

```bash
npm i --save @loskir/grammy-views
```

### Deno

```ts
import { View } from "https://github.com/Loskir/grammy-views/raw/main/src/mod.ts";
```

## Comparison with other solutions

### [grammY Router](https://grammy.dev/plugins/router.html)

The Grammy Router is a basic implementation of the Finite State Machine, a concept for separating handlers into groups that are active only when the user is in a particular route.

Grammy Views enables this behavior too, but provides higher-level abstractions (e.g. local states for each View).

### [Telegraf](https://telegraf.js.org) Scenes

Telegraf has Scenes, a similar abstraction which was the inspiration for this library.
Grammy Views uses almost the same concepts as Telegraf Scenes.
The main difference is the type safety.

| Telegraf term             | Grammy Views term     | Description                                                                         |
| ------------------------- | --------------------- | ----------------------------------------------------------------------------------- |
| Scene                     | View                  | Basic building block for the UI. Represents an isolated state with its own handlers |
| `Stage`                     | `ViewController`        | Middleware that registers all views and provides context flavor                     |           |
| `ctx.scene.session`         | `ctx.view.state`        | Persistent storage that is bound to this view/scene                                 |
| `scene.enter`               | `view.render`           | Middleware that is executed upon entering the view/scene                            |
| `ctx.scene.enter('name')` | `SomeView.enter(ctx)` | Entering another view                                                               |

## Documentation

### [Context flavor](https://grammy.dev/guide/context.html#context-flavors)

You have to use `ViewContextFlavor` on your context in order for the types to be complete. It is [additive](https://grammy.dev/guide/context.html#additive-context-flavors) and does not take any type parameters.

```ts
export type CustomContext = Context & ViewContextFlavor
```

### View

A class that represents an isolated stage of the interface with its own view (`render` function) and handlers (local of global). (Similar to BaseScene in Telegraf)

```ts
const SomeView = createView('some-view')
```

Each view must have a unique name.

### Render functions

Each view can have a render function.
It's called when the view is entered.
Its purpose is to _render_ the view.
Usually it's done via editing a message or by sending a new one.
Render functions are set via `.render` method.
Several render middlewares can be applied.

```ts
const SomeView = createView('some-view')
SomeView.render((ctx) => ctx.reply('Hello from some view!'))
```

### Entering a view

```ts
import { SomeView } from './someView'

bot.command('enter', (ctx) => SomeView.enter(ctx))
```

### Handling updates

There are 3 ways to handle updates on the view:

- Local handlers
- Global handlers
- Override handlers

#### Local handlers

Local handlers are defined the same way as with `Composer` and only work when the user is inside this view.

```ts
const SomeView = createView('some-view')
SomeView.command('test', (ctx) => ctx.reply('hello!'))

bot.command('enter', (ctx) => SomeView.enter(ctx))
```

```text
> /test
< // nothing
> /enter
< // now we are inside the view
> /test
< hello!
```

#### Global handlers

Global handlers are defined using `.global` prefix and work both inside and outside the view.
They are useful for defining global entrypoints for the view.

```ts
const SomeView = createView('some-view')
SomeView.global.command('enter_some_view', (ctx) => SomeView.enter(ctx))
```

```text
> /enter_some_view
< // now we are inside the view, even if we were in different view before
```

#### Override handlers

Override handlers are defined using `.override` prefix and only work inside the view.
They have the highest priority of all three ways.

Override handlers > Global handlers > Local handlers.

Override handlers are useful for overriding other global handlers to provide similar behavior, but with some state-dependent changes.

```ts
const SomeView = createView<CustomContext, {a: string}>('some-view')
SomeView.global.command('enter_some_view', (ctx) => {
  return SomeView.enter(ctx, {a: 'we came from global handler'})
})

const SomeOtherView = createView('some-other-view')
SomeOtherView.override.command('enter_some_view', (ctx) => {
  return SomeView.enter(ctx, {a: 'we came from SomeOtherView'})
})

// ❌ this won't work because global handlers have higher priority than local ones
SomeOtherView.command('enter_some_view', (ctx) => {
  return SomeView.enter(ctx, {a: 'we came from SomeOtherView'})
})
```

### State

View can have state.
It's used for both external data (like props) and internal data.
It is defined via the second type parameter of `createView` function (the first is used to pass custom `Context` types).

```ts
const SomeView = createView<CustomContext, {a: string}>('some-view')
```

When entering a stateful view, it is required to pass appropriate state.

```ts
bot.command('enter', (ctx) => SomeView.enter(ctx, {a: '123'}))
```

`View.enter` method is strictly typed, so you'll get compilation error if you forgot some properties or confuse the types.

#### Default state

To define a default state, you use `.setDefaultState` method.

```ts
const SomeView = createView<CustomContext, {a: string}>('some-view')
  .setDefaultState(() => ({a: 'default a'}))
```

You don't have to pass properties from default state on enter (but you still can override them if you want)

```ts
// ✅ both are correct
bot.command('enter', (ctx) => SomeView.enter(ctx))
bot.command('enter', (ctx) => SomeView.enter(ctx, {a: 'override'}))
```

Notice that `.setDefaultState` returns a new instance of `View`, so you can't call it on created instance.

```ts
// ✅ correct
const SomeView = createView<CustomContext, {a: string}>('some-view')
  .setDefaultState(() => ({a: 'default a'}))
```

```ts
// ❌ incorrect
const SomeView = createView<CustomContext, {a: string}>('some-view')
SomeView.setDefaultState(() => ({a: 'default a'}))
```

#### Accessing the state

View state is stored inside session an therefore is persisted between updates.
It can be accessed via `ctx.view.state` in render middleware, local handlers and override handlers (but not in global handlers).

```ts
const SomeView = createView<CustomContext, {a: string}>('some-view')
SomeView.render((ctx) => {
  return ctx.reply(ctx.view.state.a) // ✅
})
SomeView.callbackQuery('a', (ctx) => {
  return ctx.answerCallbackQuery(ctx.view.state.a) // ✅
})
SomeView.override.callbackQuery('a', (ctx) => {
  return ctx.answerCallbackQuery(ctx.view.state.a) // ✅
})
SomeView.global.callbackQuery('a', (ctx) => {
  // ❌ no state here
})
```

### ViewController

A class that provides `ctx.view` property in the context and manages all the activities involving views. (Similar to Stage in Telegraf)

You have to `.use` it on your bot instance in order to be able to use `ctx.view` methods.
You have to register your views in this controller in order for them to work.

```ts
const viewController = new ViewController<CustomContext>()
viewController.register(
  MainView,
  OtherView,
)

bot.use(viewController)
```
