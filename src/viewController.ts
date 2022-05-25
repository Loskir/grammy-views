import { Composer, Context, MiddlewareFn, SessionFlavor } from "./deps.deno.ts"
import { View, GenericView } from "./view.ts"

type MaybePromise<T> = T | Promise<T>

export interface ViewSessionData {
  current?: string
  state: Record<never, never>
}
export interface ViewSession {
  __views: ViewSessionData
}

export type ViewRenderFlavor = {
  view: {
    render(): MaybePromise<unknown>
  }
}

export type ViewStateFlavor<T> = { view: { state: T } }

export type ViewRevertFlavor = { view: { revert(): unknown } }

export class ViewContext<C extends SessionFlavor<ViewSession>> {
  constructor(
    private readonly ctx: C,
    // private readonly views: Map<string, View<C>>,
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

  // get current(): View<C> | undefined {
  //   return this.session.current ? this.views.get(this.session.current) : undefined
  // }


  // enter<S extends Record<string, unknown>, D extends Partial<S>>(view: View<C, S, D>, ...params: Record<never, never> extends NotDefaultState<S, D> ? [data?: NotDefaultState<S, D>] : [data: NotDefaultState<S, D>]) {
  //   if (!this.views.has(view.name)) {
  //     console.warn(`Unregistered view: ${view.name}. Local handlers will not work`)
  //   }
  //   return view.enter(this.ctx, ...params)
  // }

  // render() {
  //   return this.current?.enter(this.ctx)
  // }

  async leave() {
    // todo leave handlers
    await Promise.resolve()
    this.session.current = undefined
  }
}

// private type to extend in generics. not transformative
export type ViewBaseContextFlavor = SessionFlavor<ViewSession> & {
  view: ViewContext<SessionFlavor<ViewSession>>
  // view: {
  //   state: Record<never, never>
  // }
}

export type ViewContextFlavor<C extends Context> = C & ViewBaseContextFlavor

export class ViewController<C extends Context & ViewBaseContextFlavor> extends Composer<C> {
  private views: Map<string, View<C>> = new Map()

  private getCurrentView(ctx: C): View<C> | undefined {
    return ctx.session.__views.current ? this.views.get(ctx.session.__views.current) : undefined
  }

  middleware(): MiddlewareFn<C> {
    const composer = new Composer<C>()
    composer.use((ctx, next) => {
      ctx.view = new ViewContext(ctx)
      return next()
    })
    composer.lazy((ctx) => {
      const currentView = this.getCurrentView(ctx)
      if (!currentView) {
        return super.middleware()
      }
      const c = new Composer<C>()
      c
        .filter((_ctx): _ctx is C & ViewRenderFlavor => true)
        .use((ctx, next) => {
          // we know that the current state is compatible with currentView
          // but we have no type-level proof
          // todo check this
          ctx.view.render = () => currentView.reenter(ctx)
          return next()
        })
        .use(currentView.override)
      c.use(super.middleware())
      c
        .filter((_ctx): _ctx is C & ViewRenderFlavor => true)
        .use((ctx, next) => {
          ctx.view.render = () => currentView.reenter(ctx)
          return next()
        })
        .use(currentView)
      return c
    })
    // composer.lazy((ctx) => this.getCurrentView(ctx)?.override ?? ((_, next) => next()))
    // composer.use(super.middleware())

    // composer.lazy((ctx) => this.getCurrentView(ctx) ?? ((_, next) => next()))
    return composer.middleware()
  }

  register(...views: GenericView<C>[]) {
    for (const view of views) {
      if (this.views.has(view.name)) {
        throw new Error(`Duplicate view name: ${view.name}`)
      }
      this.views.set(view.name, view)
    }
    this.use(...views.map((v) => v.global))
  }
}
