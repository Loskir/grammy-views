import { Composer, Context, Middleware, MiddlewareFn } from "grammy"
import { View } from "./view"

export class ViewContext<C extends Context & { view: ViewContext<C> }> {
  public state: unknown
  
  constructor(
    private readonly ctx: C,
  ) { }

  async enter<State>(view: View<C, State>, ...params: State extends undefined ? [] : [data: State]) {
    return view.enter(this.ctx, ...params)
  }
}

export type ViewContextFlavor<C extends Context> = C & {
  view: ViewContext<ViewContextFlavor<C>>
}

export class ViewController<C extends Context & { view: ViewContext<C> }> extends Composer<C> {
  middleware(): MiddlewareFn<C> {
    return (ctx, next) => {
      ctx.view = new ViewContext(ctx)
      return next()
    }
  }

  register(...views: (View<C, any> | View<C, never>)[]) {
    // todo make these handlers local
    this.use(...views)
    this.use(...views.map((v) => v.global))
  }
}
