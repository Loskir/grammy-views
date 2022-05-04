import {Composer} from 'grammy'
import {CustomContext} from '../types/context'
import {MainView} from '../views/main'
import {ItemView} from '../views/item'


export const mainComposer = new Composer<CustomContext>()
mainComposer.use(MainView, MainView.global)
mainComposer.use(ItemView, ItemView.global)
