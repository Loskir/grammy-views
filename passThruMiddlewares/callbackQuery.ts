import {Context, NextFunction} from 'grammy'

export default (ctx: Context, next: NextFunction) => {
  let called = false
  ctx.api.config.use((prev, method, payload, signal) => {
    if (method === 'answerCallbackQuery') called = true
    return prev(method, payload, signal)
  })
  return next()
    .finally(() => {
      if (ctx.callbackQuery && !called) {
        return ctx.answerCallbackQuery()
      }
    })
}
