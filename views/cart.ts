import { Codec, ConstantCodec } from "../lib/codec";
import { View } from "../lib/view";
import { CustomContext } from "../types/context";
import { answer } from "../utils/answer";
import { goToMainMenu } from "./main";

const CartCodec = new ConstantCodec('cart')
export const goToCart = () => CartCodec.encode()

const CartPageCodec = new Codec<number>({
  encode(page) {
    return `cart-page-${page}`
  },
  decode(s) {
    const match = s.match(/^cart-page-(\d+)$/)
    if (!match) {
      return null
    }
    return Number(match[1])
  },
})
const goToCartPage = (page: number) => CartPageCodec.encode(page)

const sliceBack = <T>(items: T[], start: number, end: number): T[] => {
  return items.slice().reverse().slice(start, end)
}

const ITEMS_PER_PAGE = 3

export const CartView = new View<CustomContext, { page: number }, { page: number }>(
  'cart',
  () => ({ page: 0 }),
)
CartView.global.filter(CartPageCodec.filter, (ctx) => ctx.view.enter(CartView, { page: ctx.codec }))
CartView.global.filter(CartCodec.filter, (ctx) => ctx.view.enter(CartView, { page: 0 }))

CartView.render((ctx) => {
  const pageNumber = ctx.view.state.page
  const startIndex = pageNumber * ITEMS_PER_PAGE
  const endIndex = startIndex + ITEMS_PER_PAGE
  const itemsEntries = sliceBack(ctx.session.cart.map((item, i) => [i, item] as const), startIndex, endIndex)

  const paginationRow = []

  if (pageNumber > 0) {
    // we have prev page
    paginationRow.push({
      text: '<',
      callback_data: goToCartPage(pageNumber - 1),
    })
  }

  if (endIndex < ctx.session.cart.length) {
    // we have next page
    paginationRow.push({
      text: '>',
      callback_data: goToCartPage(pageNumber + 1),
    })
  }

  return answer(ctx)('Here you can see your previous orders', {
    parse_mode: 'HTML',
    reply_markup: {
      inline_keyboard: [
        ...itemsEntries.map(([i, item]) => [{
          text: item.created_at.toString(),
          callback_data: goToItem(i),
        }]),
        paginationRow,
        [{
          text: '‹ Back',
          callback_data: goToMainMenu(),
        }],
      ],
    },
  })
})

const CartItemCodec = new Codec<number>({
  encode(id) {
    return `cart-item-${id}`
  },
  decode(s) {
    const match = s.match(/^cart-item-(\d+)$/)
    if (!match) {
      return null
    }
    return Number(match[1])
  },
})
const goToItem = (id: number) => CartItemCodec.encode(id)

export const CartItemView = new View<CustomContext, { id: number }>('cart-item')
CartItemView.global.filter(CartItemCodec.filter, (ctx) => ctx.view.enter(CartItemView, { id: ctx.codec }))

CartItemView.render((ctx) => {
  const item = ctx.session.cart[ctx.view.state.id]
  if (!item) {
    ctx.answerCallbackQuery({ text: 'Order not found :(' })
    return ctx.view.revert()
  }
  return answer(ctx)(`Order #${ctx.view.state.id}
  
Dough: <b>${item.dough}</b>
Fillings: <b>${item.fillings.join('</b>, <b>')}</b>
Comment: ${item.comment ? `<b>${item.comment}</b>` : '<i>No comment</i>'}

Created at: ${item.created_at}`, {
    parse_mode: 'HTML',
    reply_markup: {
      inline_keyboard: [
        [{text: '‹ Back', callback_data: goToCart()}],
      ],
    },
  })
})
