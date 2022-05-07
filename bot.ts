import { Bot } from 'grammy'

import { config } from './core/config'
import { CustomContext } from './types/context'

import callbackQuery from './passThruMiddlewares/callbackQuery'
import { ViewController } from './lib/viewController'
import { MainView } from './views/main'
import { ItemView } from './views/item'

export function getBot() {
  const bot = new Bot<CustomContext>(config.token)

  bot.use(callbackQuery)

  const viewController = new ViewController<CustomContext>()
  viewController.register(
    MainView,
    ItemView,
  )

  bot.use(viewController)

  bot.catch(console.error)

  return bot
}
