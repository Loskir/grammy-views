import { View } from '../lib/view'
import { CustomContext } from '../types/context'
import { ConstantCodec } from '../lib/codec'
import { goToOrderCake } from './orderCake'
import { goToCart } from './cart'

export const MainView = new View<CustomContext>('main')
MainView.render((ctx) => {
  const answer = (...args: Parameters<typeof ctx['editMessageText']>) => ctx.callbackQuery ? ctx.editMessageText(...args) : ctx.reply(...args)
  return answer('Welcome to grammY bakery!', {
    parse_mode: 'HTML',
    reply_markup: {
      inline_keyboard: [
        [{
          text: 'Order a cake',
          callback_data: goToOrderCake(),
        }],
        [{
          text: 'Your orders',
          callback_data: goToCart(),
        }],
      ]
    },
  })
})
MainView.global.command(['start', 'cancel'], (ctx) => ctx.view.enter(MainView))

export const MainMenuCodec = new ConstantCodec('main-menu')
export const goToMainMenu = () => MainMenuCodec.encode()

MainView.global.filter(MainMenuCodec.filter, (ctx) => ctx.view.enter(MainView))
