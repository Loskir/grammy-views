import {Composer} from 'grammy'
import {CustomContext} from '../types/context'
import {ItemView, MainView} from '../view'

export const mainComposer = new Composer<CustomContext>()
mainComposer.use(MainView, MainView.global)
mainComposer.use(ItemView, ItemView.global)
