import { MiddlewareFn, Context, Composer, run } from './deps.deno.ts'
import { ViewBaseContextFlavor, ViewStateFlavor } from './viewController.ts'

type RequiredKeys<T extends Record<string, unknown>> = NonNullable<{ [key in keyof T]: undefined extends T[key] ? never : key }[keyof T]>

export type NotDefaultState<S extends Record<string, unknown>, D extends Partial<S> = Record<never, never>> = Omit<S, RequiredKeys<D>> & Partial<Pick<S, keyof S>>

export class View<
  C extends Context & ViewBaseContextFlavor<C> = Context & ViewBaseContextFlavor<Context>,
  State extends Record<string, unknown> = Record<never, never>,
  DefaultState extends Partial<State> = Record<never, never>,
  > extends Composer<C & ViewStateFlavor<State>> {
  private renderComposer: Composer<C & ViewStateFlavor<State>>
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

  render(...fn: MiddlewareFn<C & ViewStateFlavor<State>>[]) {
    this.renderComposer.use(...fn)
  }

  enter(ctx: C & ViewStateFlavor<State>) {
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

export function createView<
  C extends Context & ViewBaseContextFlavor<C>,
  State extends Record<string, unknown> = Record<never, never>,
  >(
    name: string,
) {
  return new View<C, State, Record<never, never>>(name, () => ({}))
}
