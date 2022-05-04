import {MiddlewareFn, Context, Composer, NextFunction, Filter} from 'grammy'
import {Codec} from './codec'

export type DataFlavor<T> = { data: T }

type MaybeArray<T> = T | T[]

export class View<C extends Context = Context, Flavor = {}> extends Composer<C> {
  private renderComposer: Composer<C & Flavor>
  public global: Composer<C>

  constructor(public name: string) {
    super()
    this.renderComposer = new Composer()
    this.global = new Composer()
  }

  render(...fn: MiddlewareFn<C & Flavor>[]) {
    this.renderComposer.use(...fn)
  }

  enter(ctx: C & Flavor, next: NextFunction) {
    return this.renderComposer.middleware()(ctx, next)
  }

  codec<T>(codec: Codec<T>, ...middlewares: MiddlewareFn<Filter<C, 'callback_query:data'> & DataFlavor<T>>[]): Composer<Filter<C, 'callback_query:data'> & DataFlavor<T>> {
    return this
      .on('callback_query:data')
      .filter(codec.filter, ...middlewares)
  }
}

// class A<V, Values extends V[]> {
//   values: V[]
//
//   constructor(values?: Values) {
//     this.values = values || []
//   }
//
//   addValue<T extends V>(v: T): A<V, [...Values, T]> {
//     return new A([...this.values, v])
//   }
// }
//
// const a = new A<string, []>().addValue('v').addValue('ggs').addValue('wre')
