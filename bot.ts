import {Bot} from 'grammy'

import {config} from './core/config'
import {CustomContext} from './types/context'

import {mainComposer} from './middlewares/main'
import callbackQuery from './passThruMiddlewares/callbackQuery'

export function getBot() {
  const bot = new Bot<CustomContext>(config.token)

  bot.use(callbackQuery)

  bot.use(mainComposer)

  bot.catch(console.error)

  return bot
}
