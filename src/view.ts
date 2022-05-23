import { MiddlewareFn, Context, Composer, run } from './deps.deno.ts'
import { ViewBaseContextFlavor, ViewRevertFlavor, ViewStateFlavor } from './viewController.ts'

type MaybeArray<T> = T | T[]

type RenderContextType<C, State> = C & ViewStateFlavor<State> & ViewRevertFlavor

type RequiredKeys<T extends Record<string, any>> = NonNullable<{ [key in keyof T]: undefined extends T[key] ? never : key }[keyof T]>

export type NotDefaultState<S extends Record<string, any>, D extends Partial<S> = {}> = Omit<S, RequiredKeys<D>> & Partial<Pick<S, keyof S>>

export class View<
  C extends Context & ViewBaseContextFlavor<C> = Context & ViewBaseContextFlavor<Context>,
  State extends Record<string, any> = Record<never, never>,
  DefaultState extends Partial<State> = Record<never, never>,
  ExtraFlavor extends ViewStateFlavor<State> = ViewStateFlavor<State>,
  > extends Composer<C & ExtraFlavor> {
  protected renderComposer: Composer<C & ExtraFlavor & ViewRevertFlavor>
  public global: Composer<C>
  public override: Composer<C>

  constructor(
    public name: string,
    protected defaultState: () => DefaultState,
  ) {
    super()
    this.renderComposer = new Composer()
    this.global = new Composer()
    this.override = new Composer()
  }

  render(...fn: MiddlewareFn<C & ExtraFlavor & ViewRevertFlavor>[]) {
    this.renderComposer.use(...fn)
  }

  enter(ctx: C & ExtraFlavor & ViewRevertFlavor) {
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

export type PossibleTransitionsFlavor<C extends Context & ViewBaseContextFlavor<C>, V extends GenericView<C>> = {
  view: {
    enter2(view: V, ...params: V extends View<C, infer S, infer D> ? ({} extends NotDefaultState<S, D> ? [data?: NotDefaultState<S, D>] : [data: NotDefaultState<S, D>]) : never): Promise<void>
  }
}

export class StrictView<
  C extends Context & ViewBaseContextFlavor<C> = Context & ViewBaseContextFlavor<Context>,
  State extends Record<string, any> = Record<never, never>,
  DefaultState extends Partial<State> = Record<never, never>,
  PossibleTransitions extends GenericView<C> = never,
  ExtraFlavor extends ViewStateFlavor<State> & PossibleTransitionsFlavor<C, PossibleTransitions> = ViewStateFlavor<State> & PossibleTransitionsFlavor<C, PossibleTransitions>,
  > extends View<C, State, DefaultState, ExtraFlavor> {
  protected renderComposer: Composer<C & ExtraFlavor & ViewRevertFlavor>
  public global: Composer<C>
  public override: Composer<C>

  constructor(
    public name: string,
    protected defaultState: () => DefaultState,
  ) {
    super(name, defaultState)
    this.renderComposer = new Composer()
    this.global = new Composer()
    this.override = new Composer()
  }

  render(...fn: MiddlewareFn<C & ExtraFlavor & ViewRevertFlavor>[]) {
    this.renderComposer.use(...fn)
  }

  enter(ctx: C & ExtraFlavor & ViewRevertFlavor) {
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
export function createStrictView<
  C extends Context & ViewBaseContextFlavor<C>,
  State extends Record<string, any> = Record<never, never>,
  PossibleTransitions extends GenericView<C> = never,
  >(
    name: string,
) {
  return new StrictView<C, State, Record<never, never>, PossibleTransitions>(name, () => ({}))
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
