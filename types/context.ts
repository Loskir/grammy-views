import type {Context, SessionFlavor} from 'grammy'
import { ViewContextFlavor } from '../lib/viewController'

export type CustomContext = ViewContextFlavor<Context>
