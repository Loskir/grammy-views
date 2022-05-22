import { Composer, Context, Middleware, MiddlewareFn, SessionFlavor } from "./deps.deno.ts"
import { View, NotDefaultState } from "./view.ts"

export interface ViewSessionData {
  current: string
  state: any
}
export interface ViewSession {
  __views: ViewSessionData
}

export type ViewStateFlavor<T> = { view: { state: T } }

export type ViewRevertFlavor = { view: { revert(): unknown } }

export class ViewContext<C extends Context & ViewBaseContextFlavor<C>> {
  constructor(
    private readonly ctx: C,
    private readonly views: Map<string, View<C, any>>,
  ) { }

  get session(): ViewSessionData {
    return this.ctx.session.__views
  }
  set session(data) {
    this.ctx.session.__views = data
  }

  get state(): unknown {
    return this.session.state || {}
  }
  set state(data) {
    this.session.state = data
  }

  get current(): View<C, any> | undefined {
    return this.views.get(this.session.current)
  }

  enter<State, D extends Partial<State>>(view: View<C, State, D>, ...params: {} extends NotDefaultState<State, D> ? [data?: NotDefaultState<State, D>] : [data: NotDefaultState<State, D>]) {
    if (!this.views.has(view.name)) {
      console.warn(`Unregistered view: ${view.name}. Local handlers will not work`)
    }
    const previousSession = JSON.parse(JSON.stringify(this.session))

    const ctx = this.ctx as C & ViewStateFlavor<State> & ViewRevertFlavor
    ctx.view.session.current = view.name
    ctx.view.state = view.enrichState(params[0]!)

    ctx.view.revert = () => {
      this.session = previousSession
    }

    return view.enter(ctx)
  }

  render() {
    // we know that current context is compatible with current view
    // @ts-ignore
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
    composer.use(
      (ctx, next) => {
        ctx.view = new ViewContext(ctx, this.views)
        return next()
      },
      super.middleware(),
    )
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