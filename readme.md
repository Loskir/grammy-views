# Grammy Views

This is an early prototype for Grammy Views — UI framework for [grammY](https://grammy.dev)

Grammy Views is a UI framework for Telegram bots that provides abstractions for controlling UI states.

## Comparison with other solutions

### [grammY Router](https://grammy.dev/plugins/router.html)

The Grammy Router is a basic implementation of the Finite State Machine, a concept for separating handlers into groups that are active only when the user is in a particular route.

Grammy Views enables this behavior too, but provides higher-level abstractions (e.g. local states for each View). 

### [Telegraf](https://telegraf.js.org) Scenes

Telegraf has Scenes, a similar abstraction which was the inspiration for this library. 
Grammy Views uses almost the same concepts as Telegraf Scenes. 
The main difference is the type safety.

## Documentation

The library includes:

<!-- - Codec -->
- View
- ViewController

<!-- ### Codec

An abstraction over encoding and decoding callback data.

Example:

```ts
const SomeCodec = new Codec<{name: string}>({
  encode(data) {
    // this function encodes the data to string
    return `some-codec-${data.name}`
  }
  decode(s) {
    // this function matches and decodes the string back to the data structure
    // if there's no match, it retuns null
    const match = s.match(/^some-codec-(.+)$/)
    if (!match) return null
    return { name: match[1] }
  }
})
```

`ConstantCodec` is a shortcut for encoding data that has no dynamic parameters. 

Example: 

```ts
const SomeCodec = new ConstantCodec('some-codec')
```

Codes are useful for unifying interfaces of transitions between states. Instead of specifying strings in different parts of the program, codecs allow you to define an interface in one place and use it everywhere.

To use a codec inside callback button, you can call `.encode` method directly

```ts
bot.use((ctx) => ctx.reply('Codec', {
  reply_markup: new InlineKeyboard().text('Button', SomeCodec.encode(data)),
}))
```

or create and export a helper function

```ts
export const goToSomewhere(data: string) => SomeCodec.encode(data)
bot.use((ctx) => ctx.reply('Codec', {
  reply_markup: new InlineKeyboard().text('Button', goToSomewhere(data)),
}))
```

To handle a codec, you can use `.filter` method:

```ts
bot.filter(SomeCodec.filter, (ctx) => ctx.reply(ctx.codec.toString()))
```

Decoded data is available via `ctx.codec`.

> Side note. Q: What's the difference between a constant codec and a string? A: I don't know :D -->

### View

A class that represents an isolated stage of the interface with its own view (`render` function) and handlers (local of global). (Similar to BaseScene in Telegraf)

```ts
const SomeView = new View('some-view')
```

Each view must have a unique name.

View has 3 generic arguments: `Context`, `State`, `DefaultState`

#### Render functions

Each view can have a render function. It's called when the view is entered. Its purpose is to _render_ the view. Usually it's done via editing a message or by sending a new one. Render functions are set via `.render` method. Several functions can be chained (like a composer)

```ts
const SomeView = new View('some-view')
SomeView.render((ctx) => ctx.reply('Hello from some view!'))
```

#### Entering a view

TODO

#### State

View can have a state. It's used for both external data (like props) and internal data.


### ViewController

A class that provides `ctx.view` property in the context and manages all the activities involving views. (Similar to Stage in Telegraf)


## Known issues

<!-- ### Inconsistency between entering the view directly and via codec util function

```ts
View.render((ctx) => ctx.reply('View', {
  reply_markup: new InlineKeyboard().text('Button', goToMainMenu()),
}))
// but
View.on(':text', async (ctx) => ctx.view.enter(MainView))
``` -->

## There is no way to declare a local handler in the view that overrides a global handler

That's how view controller middleware works: global handlers have higher priority than local.

That makes sense: global commands like /start should have higher priority than local :text handlers, for example.

But the opposite behavior can also be useful: for example, for overriding the same codec locally to be able to access the local state.

```ts
View.filter(SomeCodec, (ctx) => ctx.view.enter(OtherView, { data: ctx.codec, other_optional_data: ctx.view.state.data }))

OtherView.global.filter(SomeCodec, (ctx) => ctx.view.enter(OtherView, { data: ctx.codec }))
```
