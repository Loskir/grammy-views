import { MiddlewareFn, Context, Composer } from 'grammy'
import { ViewContext } from './viewController'

export type ViewStateFlavor<T> = { view: { state: T } }

type MaybeArray<T> = T | T[]

export class View<C extends Context & { view: ViewContext<C> }, State = never> extends Composer<C> {
  private renderComposer: Composer<C & ViewStateFlavor<State>>
  public global: Composer<C>

  constructor(public name: string) {
    super()
    this.renderComposer = new Composer()
    this.global = new Composer()
  }

  render(...fn: MiddlewareFn<C & ViewStateFlavor<State>>[]) {
    this.renderComposer.use(...fn)
  }

  enter(ctx: C, ...params: State extends undefined ? [] : [data: State]) {
    const ctx2 = ctx as C & ViewStateFlavor<State>
    ctx2.view.state = params[0]!
    return this.renderComposer.middleware()(ctx2, () => Promise.resolve())
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
