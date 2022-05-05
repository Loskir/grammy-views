import {MiddlewareFn, Context, Composer, NextFunction} from 'grammy'

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
