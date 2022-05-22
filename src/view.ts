import { MiddlewareFn, Context, Composer, run } from './deps.deno.ts'
import { ViewBaseContextFlavor, ViewRevertFlavor, ViewStateFlavor } from './viewController.ts'

type MaybeArray<T> = T | T[]

type RenderContextType<C, State> = C & ViewStateFlavor<State> & ViewRevertFlavor

type RequiredKeys<T extends Record<string, any>> = NonNullable<{ [key in keyof T]: undefined extends T[key] ? never : key }[keyof T]>

export type NotDefaultState<S extends Record<string, any>, D extends Partial<S> = {}> = Omit<S, RequiredKeys<D>> & Partial<Pick<S, keyof S>>

// todo: make state optional only if State is not {}
export class View<
  C extends Context & ViewBaseContextFlavor<C> = Context & ViewBaseContextFlavor<Context>,
  State extends Record<string, any> = Record<never, never>,
  DefaultState extends Partial<State> = Record<never, never>,
  > extends Composer<C & ViewStateFlavor<State>> {
  private renderComposer: Composer<RenderContextType<C, State>>
  public global: Composer<C>
  public override: Composer<C>

  constructor(
    public name: string,
    private defaultState: () => DefaultState,
  ) {
    super()
    this.renderComposer = new Composer()
    this.global = new Composer()
    this.override = new Composer()
  }

  render(...fn: MiddlewareFn<RenderContextType<C, State>>[]) {
    this.renderComposer.use(...fn)
  }

  enter(ctx: RenderContextType<C, State>) {
    return run(this.renderComposer.middleware(), ctx)
  }

  applyDefaultState(input: NotDefaultState<State, DefaultState>): State {
    // nothing can go wrong riiiiiight?
    // fixme
    return Object.assign({}, this.defaultState(), input) as State
  }

  setDefaultState<D extends Partial<State>>(defaultState: () => D): View<C, State, D> {
    return new View<C, State, D>(
      this.name,
      defaultState,
    )
  }
}

export type GenericView<C extends Context & ViewBaseContextFlavor<C>> = View<C, any, any>

export function createView<
  C extends Context & ViewBaseContextFlavor<C>,
  State extends Record<string, any> = Record<never, never>,
  >(
    name: string,
) {
  return new View<C, State, Record<never, never>>(name, () => ({}))
}

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
