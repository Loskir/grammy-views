import type { Context, SessionFlavor } from 'grammy'
import { ViewContextFlavor } from '../lib/viewController'
import { Cake } from './cake'

export type CustomContext = ViewContextFlavor<Context & SessionFlavor<{
  cart: Cake[]
}>>
