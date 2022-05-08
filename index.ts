import 'dotenv/config'

import './utils/checkDotenv'

import { getBot } from './bot'

void (async () => {
  const bot = getBot()

  const me = await bot.api.getMe()
  console.log(`@${me.username} is starting`)
  await bot.start()
})()
