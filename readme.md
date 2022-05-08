# Grammy Views

This is an early prototype for Grammy Views — UI framework for [grammY](https://grammy.dev)

Library files are located under /lib.

The rest of the files provide a simple bot made using the library.

The library includes:

- Codec
- View
- ViewController

## Known issues

### Inconsistency between entering the view directly and via codec util function

```ts
View.render((ctx) => ctx.reply('View', {
  reply_markup: new InlineKeyboard().text('Button', goToMainMenu()),
}))
// but
View.on(':text', async (ctx) => ctx.view.enter(MainView))
```

## There is no way to declare a local handler in the view that overrides a global handler

That's how view controller middleware works: global handlers have higher priority than local.

That makes sense: global commands like /start should have higher priority than local :text handlers, for example.

But the opposite behavior can also be useful: for example, for overriding the same codec locally to be able to access the local state.

```ts
View.filter(SomeCodec, (ctx) => ctx.view.enter(OtherView, { data: ctx.codec, other_optional_data: ctx.view.state.data }))

OtherView.global.filter(SomeCodec, (ctx) => ctx.view.enter(OtherView, { data: ctx.codec }))
```

## Codec

An abstraction over encoding and decoding callback data.

## View

A class that represents an isolated stage of the interface with its own view (`render` function) and handlers (local of global). (Similar to BaseScene in Telegraf)

## ViewController

A class that provides `ctx.view` property in the context and manages all the activities involving views. (Similar to Stage in Telegraf)
