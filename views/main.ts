import {View} from '../lib/view'
import {CustomContext} from '../types/context'
import {items} from '../data/items'
import {goToItem} from './item'
import {ConstantCodec} from '../lib/codec'

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

export const MainMenuCodec = new ConstantCodec('main-menu')
export const goToMainMenu = () => MainMenuCodec.encode()

// this should be a global handler, but .global does not have .codec method yet
MainView.global.on('callback_query:data').filter(MainMenuCodec.filter, (ctx, next) => MainView.enter(ctx, next))
