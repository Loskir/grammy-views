import { Bot, session } from 'grammy'

import { config } from './core/config'
import { CustomContext } from './types/context'

import callbackQuery from './passThruMiddlewares/callbackQuery'
import { ViewController } from './lib/viewController'
import { MainView } from './views/main'
import { FileAdapter } from '@grammyjs/storage-file'
import { OrderCakeCommentView, OrderCakeConfirmView, OrderCakeDoughView, OrderCakeFillingsView } from './views/orderCake'
import { CartItemView, CartView } from './views/cart'

export function getBot() {
  const bot = new Bot<CustomContext>(config.token)

  bot.use(callbackQuery)
  bot.use(session({
    initial: () => ({
      __views: { current: '', state: undefined },
      cart: [],
    }),
    storage: new FileAdapter({ dirName: 'sessions' }),
  }))

  const viewController = new ViewController<CustomContext>()
  viewController.register(
    MainView,
    OrderCakeDoughView,
    OrderCakeFillingsView,
    OrderCakeCommentView,
    OrderCakeConfirmView,
    CartView,
    CartItemView,
  )

  bot.use(viewController)

  bot.catch(console.error)

  return bot
}
