import { MiddlewareFn, Context, Composer } from 'grammy'
import { run } from 'grammy/out/composer'
import { ViewBaseContextFlavor, ViewStateFlavor } from './viewController'

type MaybeArray<T> = T | T[]

export class View<C extends Context & ViewBaseContextFlavor<C>, State = undefined> extends Composer<C & ViewStateFlavor<State>> {
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

  enter(ctx: C & ViewStateFlavor<State>) {
    return run(this.renderComposer.middleware(), ctx)
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
