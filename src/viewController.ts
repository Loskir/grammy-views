import { Composer, Context, MiddlewareFn, SessionFlavor } from "./deps.deno.ts";
import { GenericView, View } from "./view.ts";

type ViewBaseState = Record<never, never>;

export interface ViewSessionData {
    current?: string;
    state?: ViewBaseState;
}
export type ViewSession = {
    __views?: ViewSessionData;
} | undefined;

export type ViewRenderFlavor = {
    view: {
        render(): Promise<void>;
    };
};

export type ViewNoLeaveFlavor = { view: { leave: never } };

export type ViewStateFlavor<T> = { view: { state: T } };

interface ViewContext {
    get state(): ViewBaseState;
    set state(data: ViewBaseState);

    leave(): Promise<void>;
}

export type ViewContextFlavor = SessionFlavor<ViewSession> & {
    view: ViewContext;
};

export class ViewController<
    C extends Context & ViewContextFlavor,
> extends Composer<C> {
    private views: Map<string, View<C>> = new Map();

    private getCurrentView(ctx: C): GenericView<C> | undefined {
        return ctx.session?.__views?.current
            ? this.views.get(ctx.session.__views.current)
            : undefined;
    }

    middleware(): MiddlewareFn<C> {
        const composer = new Composer<C>();
        composer.lazy((ctx) => {
            if (!("session" in ctx)) {
                throw new Error("Cannot use views without session");
            }
            try {
                ctx.session;
            } catch (_) {
                // bypass views if session is unavailable
                return super.middleware();
            }
            ctx.view = {
                get state() {
                    return ctx.session?.__views?.state ?? {};
                },
                set state(data) {
                    if (!ctx.session) {
                        ctx.session = {};
                    }
                    if (!ctx.session.__views) {
                        ctx.session.__views = {};
                    }
                    ctx.session.__views.state = data;
                },
                leave: async () => {
                    const currentView = this.getCurrentView(ctx);
                    // you cannot call leave inside leave, it doesn't make sense
                    // we don't actually remove this method, just hide it from typescript
                    // in a hacky way (yes i feel bad about it)
                    const ctx_ = ctx as C & ViewNoLeaveFlavor;
                    await currentView?._leave(ctx_);
                    delete ctx_.session?.__views;
                },
            };

            const currentView = this.getCurrentView(ctx);
            if (!currentView) {
                return super.middleware();
            }
            const c = new Composer<C>();
            c
                .filter((_ctx): _ctx is C & ViewRenderFlavor => true)
                .use((ctx, next) => {
                    // we know that the current state is compatible with currentView
                    // but we have no type-level proof
                    // todo check this
                    ctx.view.render = async () => {
                        const currentView = this.getCurrentView(ctx);
                        await currentView?._render(ctx);
                    };
                    return next();
                })
                .use(currentView.override);
            c.use(super.middleware());
            c
                .filter((_ctx): _ctx is C & ViewRenderFlavor => true)
                .use((ctx, next) => {
                    ctx.view.render = async () => {
                        const currentView = this.getCurrentView(ctx);
                        await currentView?._render(ctx);
                    };
                    return next();
                })
                .use(currentView);
            return c;
        });
        // composer.lazy((ctx) => this.getCurrentView(ctx)?.override ?? ((_, next) => next()))
        // composer.use(super.middleware())

        // composer.lazy((ctx) => this.getCurrentView(ctx) ?? ((_, next) => next()))
        return composer.middleware();
    }

    register(...views: GenericView<C>[]) {
        for (const view of views) {
            if (this.views.has(view.name)) {
                throw new Error(`Duplicate view name: ${view.name}`);
            }
            this.views.set(view.name, view);
        }
        this.use(...views.map((v) => v.global));
    }

    enter(ctx: C, name: string, ...params: any[]) {
        const view = this.views.get(name);
        if (!view) {
            throw new Error(`The view '${name}' has not been registered!`);
        }
        return view.enter(ctx, ...params);
    }
}
