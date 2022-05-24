import { Composer, Context, MiddlewareFn, SessionFlavor } from "./deps.deno.ts"
import { View, NotDefaultState } from "./view.ts"

export interface ViewSessionData {
  current?: string
  state: Record<never, never>
}
export interface ViewSession {
  __views: ViewSessionData
}

export type ViewStateFlavor<T> = { view: { state: T } }

export type ViewRevertFlavor = { view: { revert(): unknown } }

export class ViewContext<C extends Context & ViewBaseContextFlavor<C>> {
  constructor(
    private readonly ctx: C,
    private readonly views: Map<string, View<C>>,
  ) { }

  get session(): ViewSessionData {
    return this.ctx.session.__views
  }
  set session(data) {
    this.ctx.session.__views = data
  }

  get state() {
    return this.session.state || {}
  }
  set state(data) {
    this.session.state = data
  }

  get current(): View<C, Record<string, unknown>> | undefined {
    return this.session.current ? this.views.get(this.session.current) : undefined
  }

  async leave() {
    // todo leave handlers
    await Promise.resolve()
    this.ctx.view.session.current = undefined
  }

  enter<S extends Record<string, unknown>, D extends Partial<S>>(view: View<C, S, D>, ...params: Record<never, never> extends NotDefaultState<S, D> ? [data?: NotDefaultState<S, D>] : [data: NotDefaultState<S, D>]) {
    if (!this.views.has(view.name)) {
      console.warn(`Unregistered view: ${view.name}. Local handlers will not work`)
    }

    const ctx = this.ctx as C & ViewStateFlavor<S>
    ctx.view.session.current = view.name
    ctx.view.state = view.applyDefaultState(params[0]!)

    return view.enter(ctx)
  }

  render() {
    return this.current?.enter(this.ctx)
  }
}

// private type to extend in generics. not transformative
export type ViewBaseContextFlavor<C extends Context> = SessionFlavor<ViewSession> & {
  view: ViewContext<C & ViewBaseContextFlavor<C>>
}

export type ViewContextFlavor<C extends Context> = C & ViewBaseContextFlavor<C>

export class ViewController<C extends Context & ViewBaseContextFlavor<C>> extends Composer<C> {
  private views: Map<string, View<C>> = new Map()

  middleware(): MiddlewareFn<C> {
    const composer = new Composer<C>()
    composer.use((ctx, next) => {
      ctx.view = new ViewContext(ctx, this.views)
      return next()
    })
    composer.lazy((ctx) => ctx.view.current?.override ?? ((_, next) => next()))
    composer.use(super.middleware())

    composer.lazy((ctx) => ctx.view.current ?? ((_, next) => next()))
    return composer.middleware()
  }

  register(...views: View<C>[]) {
    for (const view of views) {
      if (this.views.has(view.name)) {
        throw new Error(`Duplicate view name: ${view.name}`)
      }
      this.views.set(view.name, view)
    }
    this.use(...views.map((v) => v.global))
  }
}
