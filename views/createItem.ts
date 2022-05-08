import { InlineKeyboard, Keyboard } from "grammy";
import { ConstantCodec } from "../lib/codec";
import { View } from "../lib/view";
import { CustomContext } from "../types/context";
import { answer } from "../utils/answer";
import { goToMainMenu, MainView } from "./main";

const CreateItemCodec = new ConstantCodec('create-item')
export const goToCreateItem = () => CreateItemCodec.encode()

export const CreateItemView = new View<CustomContext>('create-item')

CreateItemView.global.on('callback_query:data').filter(CreateItemCodec.filter, (ctx) => ctx.view.enter(CreateItemView))

CreateItemView.render((ctx) => {
  return answer(ctx)('Send me the name', {
    reply_markup: new InlineKeyboard().text('Back', goToMainMenu()),
  })
})
CreateItemView.on(':text', async (ctx) => {
  const name = ctx.msg.text
  await ctx.reply(`New item: ${name}`)
  return ctx.view.enter(MainView)
})
