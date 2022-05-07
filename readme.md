# Grammy Views

This is an early prototype for Grammy Views — UI framework for [grammY](https://grammy.dev)

Library files are located under /lib.

The rest of the files provide a sample bot featuring the library.

The library includes:
- Codec
- View
- ViewController

## Codec

An abstraction over encoding and decoding callback data.

## View

A class that represents an isolated stage of the interface with its own view (`render` function) and handlers (local of global). (Similar to BaseScene in Telegraf)

## ViewController

A class that provides `ctx.view` property in the context and manages all the activities involving views. (Similar to Stage in Telegraf)
