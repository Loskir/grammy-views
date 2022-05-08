import { Codec, ConstantCodec } from "../lib/codec";
import { View } from "../lib/view";
import { Dough, Filling } from "../types/cake";
import { CustomContext } from "../types/context";
import { answer } from "../utils/answer";
import { goToMainMenu, MainView } from "./main";

const OrderCakeCodec = new ConstantCodec('order-cake')
export const goToOrderCake = () => OrderCakeCodec.encode()
export const goToChooseDough = () => OrderCakeCodec.encode()

const DoughCodec = new Codec<Dough>({
  encode(data) {
    return `order-cake-dough-${data}`
  },
  decode(s) {
    const match = s.match(/^order-cake-dough-(.+)$/)
    if (!match) {
      return null
    }
    const dough = match[1] as Dough
    if (!Object.values(Dough).includes(dough)) {
      return null
    }
    return dough
  },
})

export const OrderCakeDoughView = new View<CustomContext>('order-cake-dough')
OrderCakeDoughView.global.filter(OrderCakeCodec.filter, (ctx) => ctx.view.enter(OrderCakeDoughView))
OrderCakeDoughView.render((ctx) => {
  return answer(ctx)(`Welcome to the order screen!
First, choose what kind of <b>dough</b> to use for the cake.

Type /cancel at any time to return to the main screen.`, {
    parse_mode: 'HTML',
    reply_markup: {
      inline_keyboard: [
        ...Object.values(Dough).map((v) => [{
          text: v,
          callback_data: DoughCodec.encode(v),
        }]),
        [{
          text: '‹ Back to Main Menu',
          callback_data: goToMainMenu(),
        }]
      ],
    },
  })
})
OrderCakeDoughView.filter(DoughCodec.filter, (ctx) => ctx.view.enter(OrderCakeFillingsView, { dough: ctx.codec }))

const FillingCodec = new Codec<Filling>({
  encode(data) {
    return `order-cake-fillings-${data}`
  },
  decode(s) {
    const match = s.match(/^order-cake-fillings-(.+)$/)
    if (!match) {
      return null
    }
    const filling = match[1] as Filling
    if (!Object.values(Filling).includes(filling)) {
      return null
    }
    return filling
  },
})

const FillingDoneCodec = new ConstantCodec('order-cake-fillings-done')

export const OrderCakeFillingsView = new View<
  CustomContext,
  { dough: Dough, fillings: Filling[] },
  { fillings: Filling[] }
>(
  'order-cake-fillings',
  () => ({ fillings: [] }),
)
OrderCakeFillingsView.render((ctx) => {
  const keyboard = [
    ...Object.values(Filling).map((v) => [{
      text: (ctx.view.state.fillings.includes(v) ? '✅ ' : '') + v,
      callback_data: FillingCodec.encode(v),
    }]),
  ]

  const row = [{
    text: '‹ Change dough',
    callback_data: goToChooseDough(),
  }]

  if (ctx.view.state.fillings.length > 0) {
    row.push({
      text: 'Next ›',
      callback_data: FillingDoneCodec.encode(),
    })
  }

  keyboard.push(row)

  return answer(ctx)(`Great! You selected <b>${ctx.view.state.dough}</b> dough.
  
Now choose your desired types of cake <b>fillings</b>`, {
    parse_mode: 'HTML',
    reply_markup: {
      inline_keyboard: keyboard,
    },
  })
})
OrderCakeFillingsView.filter(FillingCodec.filter, (ctx) => {
  if (ctx.view.state.fillings.includes(ctx.codec)) {
    ctx.view.state.fillings = ctx.view.state.fillings.filter((v) => v !== ctx.codec)
  } else {
    ctx.view.state.fillings.push(ctx.codec)
  }
  return ctx.view.render()
})
OrderCakeFillingsView.filter(FillingDoneCodec.filter, (ctx) => {
  if (ctx.view.state.fillings.length < 0) {
    return ctx.answerCallbackQuery({
      text: 'Select at least one filling',
    })
  }
  return ctx.view.enter(OrderCakeCommentView, {
    dough: ctx.view.state.dough,
    fillings: ctx.view.state.fillings,
  })
})

const OrderCakeCommentBackCodec = new ConstantCodec('order-cake-comment-back')
const OrderCakeCommentSkipCodec = new ConstantCodec('order-cake-comment-skip')

export const OrderCakeCommentView = new View<
  CustomContext,
  { dough: Dough, fillings: Filling[], comment?: string }
>('order-cake-comment')
OrderCakeCommentView.render((ctx) => {
  return answer(ctx)(`You've chosen:
Dough: <b>${ctx.view.state.dough}</b>
Fillings: <b>${ctx.view.state.fillings.join('</b>, <b>')}</b>

Now you can leave a comment to our chefs, if you want.`, {
    parse_mode: 'HTML',
    reply_markup: {
      inline_keyboard: [
        [{ text: 'Skip ›', callback_data: OrderCakeCommentSkipCodec.encode() }],
        [{ text: '‹ Change fillings', callback_data: OrderCakeCommentBackCodec.encode() }],
      ]
    }
  })
})
OrderCakeCommentView.filter(OrderCakeCommentBackCodec.filter, (ctx) => ctx.view.enter(OrderCakeFillingsView, {
  dough: ctx.view.state.dough,
  fillings: ctx.view.state.fillings,
}))
OrderCakeCommentView.filter(OrderCakeCommentSkipCodec.filter, (ctx) => ctx.view.enter(OrderCakeConfirmView, {
  dough: ctx.view.state.dough,
  fillings: ctx.view.state.fillings,
}))
OrderCakeCommentView.on(':text', (ctx) => {
  return ctx.view.enter(OrderCakeConfirmView, {
    dough: ctx.view.state.dough,
    fillings: ctx.view.state.fillings,
    comment: ctx.msg.text,
  })
})

const OrderCakeConfirmCodec = new ConstantCodec('order-cake-confirm-confirm')
const OrderCakeConfirmBackCodec = new ConstantCodec('order-cake-confirm-back')

export const OrderCakeConfirmView = new View<
  CustomContext,
  { dough: Dough, fillings: Filling[], comment?: string }
>('order-cake-confirm')
OrderCakeConfirmView.render((ctx) => {
  return answer(ctx)(`Dough: <b>${ctx.view.state.dough}</b>
Fillings: <b>${ctx.view.state.fillings.join('</b>, <b>')}</b>
Comment: ${ctx.view.state.comment ? `<b>${ctx.view.state.comment}</b>` : '<i>No comment</i>'}`, {
    parse_mode: 'HTML',
    reply_markup: {
      inline_keyboard: [
        [{text: 'Confirm', callback_data: OrderCakeConfirmCodec.encode()}],
        [{ text: '‹ Change comment', callback_data: OrderCakeConfirmBackCodec.encode() }],
      ]
    }
  })
})
OrderCakeConfirmView.filter(OrderCakeConfirmBackCodec.filter, (ctx) => ctx.view.enter(OrderCakeCommentView, {
  dough: ctx.view.state.dough,
  fillings: ctx.view.state.fillings,
}))
OrderCakeConfirmView.filter(OrderCakeConfirmCodec.filter, (ctx) => {
  ctx.session.cart.push({
    dough: ctx.view.state.dough,
    fillings: ctx.view.state.fillings,
    comment: ctx.view.state.comment,
    created_at: new Date(),
  })
  ctx.answerCallbackQuery({
    text: 'Your cake is ordered!'
  })
  return ctx.view.enter(MainView)
})
