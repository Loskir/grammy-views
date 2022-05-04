import {DataFlavor, View} from '../lib/view'
import {CustomContext} from '../types/context'
import {items} from '../data/items'
import {goToMainMenu} from './main'
import {Codec} from '../lib/codec'

export const GoToItemCodec = new Codec<{ id: number }>({
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
// this should be a global handler, but .global does not have .codec method yet
ItemView.codec(GoToItemCodec, (ctx, next) => ItemView.enter(ctx, next))
