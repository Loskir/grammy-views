import { Composer, Context, MiddlewareFn } from "./deps.deno.ts";
import {
    ViewContextFlavor,
    ViewRenderFlavor,
    ViewStateFlavor,
} from "./viewController.ts";

type MaybePromise<T> = T | Promise<T>;

type OptionalKeys<
    State extends Record<string, unknown>,
    DefaultState extends Partial<State>,
> = NonNullable<
    {
        [key in keyof State]: undefined extends DefaultState[key] ? key : never;
    }[keyof State]
>;

// Set as optional those keys that are required in DefaultState
// For example:
// State = {a: string, b: string, c: string, d?: string}
// DefaultState = {a: string, b?: string}
// NotDefaultState = {a?: string, b: string, c: string, d?: string}
type NotDefaultState<
    State extends Record<string, unknown>,
    DefaultState extends Partial<State>,
> =
    & Partial<State>
    & {
        [K in (keyof State & OptionalKeys<State, DefaultState>)]: State[K];
    };

type OnlyHasOptionalKeys<T extends Record<string, unknown>> =
    { [K in keyof T]: undefined } extends T ? true : false;

type Test = NotDefaultState<{ v: string; a?: string[] }, Record<never, never>>;
// type Test2 = OptionalKeys<{ a: never[] }>

export class View<
    C extends Context & ViewContextFlavor = Context & ViewContextFlavor,
    State extends Record<string, unknown> = Record<never, never>,
    DefaultState extends Partial<State> = Record<never, never>,
> extends Composer<C & ViewStateFlavor<State> & ViewRenderFlavor> {
    private renderComposer: Composer<
        C & ViewStateFlavor<State> & ViewRenderFlavor
    >;
    public global: Composer<C>;
    public override: Composer<C & ViewStateFlavor<State> & ViewRenderFlavor>;

    constructor(
        public name: string,
        private defaultState: () => DefaultState,
    ) {
        super();
        this.renderComposer = new Composer<
            C & ViewStateFlavor<State> & ViewRenderFlavor
        >();
        this.global = new Composer<C>();
        this.override = new Composer<
            C & ViewStateFlavor<State> & ViewRenderFlavor
        >();
    }

    render(...fn: MiddlewareFn<C & ViewStateFlavor<State>>[]) {
        this.renderComposer.use(...fn);
    }

    enter(
        ctx: C,
        ...params:
            OnlyHasOptionalKeys<NotDefaultState<State, DefaultState>> extends
                true ? [data?: NotDefaultState<State, DefaultState>]
                : [data: NotDefaultState<State, DefaultState>]
    ): MaybePromise<unknown> {
        const ctx_ = ctx as C & ViewStateFlavor<State> & ViewRenderFlavor;
        if (!ctx_.session.__views) {
            ctx_.session.__views = {};
        }
        ctx_.session.__views.current = this.name;
        ctx_.view.state = this.applyDefaultState(params[0]!);
        return this.renderComposer.middleware()(ctx_, () => Promise.resolve());
    }

    reenter(ctx: C & ViewStateFlavor<State> & ViewRenderFlavor) {
        return this.renderComposer.middleware()(ctx, () => Promise.resolve());
    }

    private applyDefaultState(
        input: NotDefaultState<State, DefaultState>,
    ): State {
        // @ts-ignore: typescript fails here, but i'm pretty sure that DefaultState & NotDefaultState === State. Help wanted
        return Object.assign({}, this.defaultState(), input);
    }

    setDefaultState<D extends Partial<State>>(
        defaultState: () => D,
    ): View<C, State, D> {
        return new View<C, State, D>(
            this.name,
            defaultState,
        );
    }
}

export function createView<
    C extends Context & ViewContextFlavor,
    State extends Record<string, unknown> = Record<never, never>,
>(
    name: string,
) {
    return new View<C, State, Record<never, never>>(name, () => ({}));
}

export type GenericView<
    C extends Context & ViewContextFlavor = Context & ViewContextFlavor,
> = View<C, any>;
