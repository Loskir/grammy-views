import { MiddlewareFn, Context, Composer } from 'grammy'
import { run } from 'grammy/out/composer'
import { ViewBaseContextFlavor, ViewRevertFlavor, ViewStateFlavor } from './viewController'

type MaybeArray<T> = T | T[]

type RenderContextType<C, State> = C & ViewStateFlavor<State> & ViewRevertFlavor
export class View<C extends Context & ViewBaseContextFlavor<C>, State = undefined> extends Composer<C & ViewStateFlavor<State>> {
  private renderComposer: Composer<RenderContextType<C, State>>
  public global: Composer<C>

  constructor(public name: string) {
    super()
    this.renderComposer = new Composer()
    this.global = new Composer()
  }

  render(...fn: MiddlewareFn<RenderContextType<C, State>>[]) {
    this.renderComposer.use(...fn)
  }

  enter(ctx: RenderContextType<C, State>) {
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
