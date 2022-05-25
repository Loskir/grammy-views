import { MiddlewareFn, Context, Composer } from './deps.deno.ts'
import { ViewBaseContextFlavor, ViewStateFlavor, ViewRenderFlavor } from './viewController.ts'

type MaybePromise<T> = T | Promise<T>

type RequiredKeys<T extends Record<string, unknown>> = NonNullable<{ [key in keyof T]: undefined extends T[key] ? never : key }[keyof T]>

export type NotDefaultState<S extends Record<string, unknown>, D extends Partial<S> = Record<never, never>> = Omit<S, RequiredKeys<D>> & Partial<Pick<S, keyof S>>

export class View<
  C extends Context & ViewBaseContextFlavor = Context & ViewBaseContextFlavor,
  State extends Record<string, unknown> = Record<never, never>,
  DefaultState extends Partial<State> = Record<never, never>,
  > extends Composer<C & ViewStateFlavor<State> & ViewRenderFlavor> {
  private renderComposer: Composer<C & ViewStateFlavor<State> & ViewRenderFlavor>
  public global: Composer<C>
  public override: Composer<C & ViewStateFlavor<State> & ViewRenderFlavor>

  constructor(
    public name: string,
    private defaultState: () => DefaultState,
  ) {
    super()
    this.renderComposer = new Composer()
    this.global = new Composer()
    this.override = new Composer()
  }

  render(...fn: MiddlewareFn<C & ViewStateFlavor<State>>[]) {
    this.renderComposer.use(...fn)
  }

  enter(ctx: C, ...params: Record<never, never> extends NotDefaultState<State, DefaultState> ? [data?: NotDefaultState<State, DefaultState>] : [data: NotDefaultState<State, DefaultState>]): MaybePromise<unknown> {
    const ctx_ = ctx as C & ViewStateFlavor<State> & ViewRenderFlavor
    ctx_.session.__views.current = this.name
    ctx_.view.state = this.applyDefaultState(params[0]!)
    return this.renderComposer.middleware()(ctx_, () => Promise.resolve())
  }

  reenter(ctx: C & ViewStateFlavor<State> & ViewRenderFlavor) {
    return this.renderComposer.middleware()(ctx, () => Promise.resolve())
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

export function createView<
  C extends Context & ViewBaseContextFlavor,
  State extends Record<string, unknown> = Record<never, never>,
  >(
    name: string,
) {
  return new View<C, State, Record<never, never>>(name, () => ({}))
}

export type GenericView<C extends Context & ViewBaseContextFlavor = Context & ViewBaseContextFlavor> = View<C, any>
