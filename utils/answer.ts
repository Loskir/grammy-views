import { Context } from "grammy";

export const answer = (ctx: Context) => (...args: Parameters<typeof ctx['editMessageText']>) => ctx.callbackQuery ? ctx.editMessageText(...args) : ctx.reply(...args)
