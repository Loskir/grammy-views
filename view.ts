import {Codec, ConstantCodec, DataFlavor, View} from './views'
import {CustomContext} from './types/context'

const GoToItemCodec = new Codec<{ id: number }>({
  encode(data) {
    return `go-to-item-${data.id}`
  },
  decode(s) {
    const match = s.match(/^go-to-item-(\d+)$/)
    if (!match) {
      return null
    }
    return {
      id: Number(match[1]),
    }
  },
})
export const goToItem = (id: number) => GoToItemCodec.encode({id})

const MainMenuCodec = new ConstantCodec('main-menu')
export const goToMainMenu = () => MainMenuCodec.encode()

const items = [
  'a',
  'b',
  'c',
  'd',
  'e',
]

export const MainView = new View<CustomContext>('main')
MainView.render((ctx) => {
  const answer = (...args: Parameters<typeof ctx['editMessageText']>) => ctx.callbackQuery ? ctx.editMessageText(...args) : ctx.reply(...args)
  return answer('Main menu', {
    parse_mode: 'HTML',
    reply_markup: {
      inline_keyboard: [
        ...items.map((item, i) => [{
          text: `Go to item ${i}`,
          callback_data: goToItem(i),
        }]),
        [{
          text: `Go to item 999`,
          callback_data: goToItem(999),
        }],
      ]
    },
  })
})
MainView.global.command('start', (ctx, next) => MainView.enter(ctx, next))
MainView.codec(GoToItemCodec, (ctx, next) => ItemView.enter(ctx, next))

export const ItemView = new View<CustomContext, DataFlavor<{ id: number }>>('item')
ItemView.render((ctx) => {
  const item = items[ctx.data.id]
  if (!item) {
    return ctx.answerCallbackQuery({
      text: 'Item not found',
    })
  }
  const keyboard = [
    [{text: 'Go to main menu', callback_data: goToMainMenu()}],
  ]
  const navigationRow = []
  if (ctx.data.id > 0) {
    navigationRow.push({
      text: '<',
      callback_data: goToItem(ctx.data.id - 1),
    })
  }
  if (ctx.data.id < items.length - 1) {
    navigationRow.push({
      text: '>',
      callback_data: goToItem(ctx.data.id + 1),
    })
  }
  keyboard.push(navigationRow)
  const answer = (...args: Parameters<typeof ctx['editMessageText']>) => ctx.callbackQuery ? ctx.editMessageText(...args) : ctx.reply(...args)
  return answer(`Item ${item} (${ctx.data.id})`, {
    parse_mode: 'HTML',
    reply_markup: {
      inline_keyboard: keyboard,
    },
  })
})
ItemView.codec(MainMenuCodec, (ctx, next) => MainView.enter(ctx, next))
