import { items } from "../data/items";
import { ConstantCodec } from "../lib/codec";
import { View } from "../lib/view";
import { CustomContext } from "../types/context";
import { answer } from "../utils/answer";
import { goToCreateItem } from "./createItem";
import { goToItem } from "./item";
import { goToMainMenu } from "./main";

const ItemListCodec = new ConstantCodec('item-list')
export const goToItemList = () => ItemListCodec.encode()

export const ItemListView = new View<CustomContext>('item-list')
ItemListView.global.filter(ItemListCodec.filter, (ctx) => ctx.view.enter(ItemListView))

ItemListView.render((ctx) => {
  return answer(ctx)('List of items', {
    parse_mode: 'HTML',
    reply_markup: {
      inline_keyboard: [
        ...items.map((item, i) => [{
          text: `Go to item ${i}`,
          callback_data: goToItem(i),
        }]),
        [{
          text: 'Go to item 999',
          callback_data: goToItem(999),
        }],
        [{
          text: 'Back',
          callback_data: goToMainMenu(),
        }],
      ]
    },
  })
})
