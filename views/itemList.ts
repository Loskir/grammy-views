import { Codec, ConstantCodec } from "../lib/codec";
import { View } from "../lib/view";
import { CustomContext } from "../types/context";
import { answer } from "../utils/answer";
import { goToItem, ItemView } from "./item";
import { goToMainMenu } from "./main";

const ItemListCodec = new ConstantCodec('item-list')
export const goToItemList = () => ItemListCodec.encode()

const ItemListPageCodec = new Codec<{ page: number }>({
  encode(data) {
    return `item-list-page-${data.page}`
  },
  decode(s) {
    const match = s.match(/^item-list-page-(\d+)$/)
    if (!match) {
      return null
    }
    return {
      page: Number(match[1]),
    }
  },
})
const goToPage = (page: number) => ItemListPageCodec.encode({ page })

const prevPage = 'prev-page'
const nextPage = 'next-page'

export const ItemListView = new View<CustomContext, { page: number }, { page: number }>(
  'item-list',
  () => ({ page: 0 }),
)
ItemListView.global.filter(ItemListCodec.filter, (ctx) => ctx.view.enter(ItemListView))

const ITEMS_PER_PAGE = 3

ItemListView.render((ctx) => {
  const pageNumber = ctx.view.state.page
  const startIndex = pageNumber * ITEMS_PER_PAGE
  const endIndex = startIndex + ITEMS_PER_PAGE
  const items = ctx.session.items.slice(Math.max(ctx.session.items.length - endIndex, 0), ctx.session.items.length - startIndex).reverse()

  const paginationRow = []
  const paginationRowLocal = []

  if (pageNumber > 0) {
    // we have prev page
    paginationRow.push({
      text: '<',
      callback_data: goToPage(pageNumber - 1),
    })
    paginationRowLocal.push({
      text: '<',
      callback_data: prevPage,
    })
  }

  if (endIndex < ctx.session.items.length) {
    // we have next page
    paginationRow.push({
      text: '>',
      callback_data: goToPage(pageNumber + 1),
    })
    paginationRowLocal.push({
      text: '>',
      callback_data: nextPage,
    })
  }

  return answer(ctx)(`List of items, page ${pageNumber}`, {
    parse_mode: 'HTML',
    reply_markup: {
      inline_keyboard: [
        ...items.map((item, i) => [{
          text: `Go to item ${item}`,
          callback_data: goToItem(i),
        }]),
        paginationRow,
        paginationRowLocal,
        [{
          text: 'Back',
          callback_data: goToMainMenu(),
        }],
      ]
    },
  })
})

ItemListView.callbackQuery(prevPage, (ctx) => {
  ctx.view.state.page--
  return ctx.view.render()
})
ItemListView.callbackQuery(nextPage, (ctx) => {
  ctx.view.state.page++
  return ctx.view.render()
})

ItemListView.global.filter(ItemListPageCodec.filter, (ctx) => ctx.view.enter(ItemListView, {page: ctx.codec.page}))
