import { View } from '../lib/view'
import { CustomContext } from '../types/context'
import { ConstantCodec } from '../lib/codec'
import { goToCreateItem } from './createItem'
import { goToItemList } from './itemList'

export const MainView = new View<CustomContext>('main')
MainView.render((ctx) => {
  const answer = (...args: Parameters<typeof ctx['editMessageText']>) => ctx.callbackQuery ? ctx.editMessageText(...args) : ctx.reply(...args)
  return answer('Main menu', {
    parse_mode: 'HTML',
    reply_markup: {
      inline_keyboard: [
        [{
          text: 'Create new item',
          callback_data: goToCreateItem(),
        }],
        [{
          text: 'List of items',
          callback_data: goToItemList(),
        }],
      ]
    },
  })
})
MainView.global.command('start', (ctx) => ctx.view.enter(MainView))

export const MainMenuCodec = new ConstantCodec('main-menu')
export const goToMainMenu = () => MainMenuCodec.encode()

MainView.global.filter(MainMenuCodec.filter, (ctx) => ctx.view.enter(MainView))
