import { MiddlewareFn, Context, Composer, run } from './deps.deno.ts'
import { ViewBaseContextFlavor, ViewRevertFlavor, ViewStateFlavor } from './viewController.ts'

type MaybeArray<T> = T | T[]

type RenderContextType<C, State> = C & ViewStateFlavor<State> & ViewRevertFlavor

type RequiredKeys<T extends Record<string, any>> = NonNullable<{[key in keyof T]: undefined extends T[key] ? never : key}[keyof T]>

export type NotDefaultState<S extends Record<string, any>, D extends Partial<S> = {}> = Omit<S, RequiredKeys<D>> & Partial<Pick<S, keyof S>>

// todo: make defaultState optional only if DefaultState is not {}
export class View<
  C extends Context & ViewBaseContextFlavor<C>,
  State extends Record<string, any> = Record<never, never>,
  DefaultState extends Partial<State> = Record<never, never>,
  > extends Composer<C & ViewStateFlavor<State>> {
  private renderComposer: Composer<RenderContextType<C, State>>
  public global: Composer<C>

  constructor(
    public name: string,
    public defaultState?: () => DefaultState,
  ) {
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

  enrichState(state: NotDefaultState<State, DefaultState>): State {
    // nothing can go wrong riiiiiight?
    return Object.assign({}, this.defaultState ? this.defaultState() : {}, state) as State
  }
}

export type GenericView<C extends Context & ViewBaseContextFlavor<C>> = View<C, any, any>

// class A {
//   a(): {a: string} {
//     console.log('A')
//     return {a: 'a'}
//   }
//   call() {
//     return this.a()
//   }
// }
// class B extends A {
//   override a(): {a: string, b: number} {
//     return {a: 'b', b: 1}
//   }

//   fn(): this {
//     return this
//   }
// }
// const b = new B()
// b.call()

// class A {
//   a(): {a: string} {
//     return {a: 'a'}
//   }

//   call() {
//     type F = ThisType<>
//     return this.a() as ReturnType<this['a']>;
//   }
// }

// class B extends A {
//   a(): {a: string, b: number} {
//     return {a: 'b', b: 1};
//   }
// }

// const b = new B();
// console.log(b.call());

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
