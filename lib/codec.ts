import { Context, Filter, matchFilter } from 'grammy'

export type CodecMatchFlavor<T> = { codec: T }

type Encoder<T> = (data: T) => string
type Decoder<T> = (s: string) => T | null

const combineFilters = <C extends Context, A extends C, B extends A>(a: (ctx: C) => ctx is A, b: (ctx: A) => ctx is B) => {
  return (ctx: C): ctx is B => {
    return a(ctx) && b(ctx)
  }
}

export class Codec<T> {
  public encode: Encoder<T>
  public decode: Decoder<T>

  constructor({ encode, decode }: { encode: Encoder<T>, decode: Decoder<T> }) {
    this.encode = encode
    this.decode = decode
  }

  // why not method? this is required for `bot.filter(codec.filter)` to work
  // because otherwise `this` would be lost
  get filter() {
    // it scares me, but it works
    return <C extends Context>(ctx: C): ctx is Filter<C, 'callback_query:data'> & CodecMatchFlavor<T> => combineFilters<C, Filter<C, 'callback_query:data'>, Filter<C, 'callback_query:data'> & CodecMatchFlavor<T>>(
      matchFilter<C, 'callback_query:data'>('callback_query:data'),
      <C extends Filter<Context, 'callback_query:data'>>(ctx: C): ctx is C & CodecMatchFlavor<T> => {
        const decoded = this.decode(ctx.callbackQuery.data)
        if (decoded === null) {
          return false
        }
        (ctx as C & CodecMatchFlavor<T>).codec = decoded
        return true
      }
    )(ctx)
  }
}

export class ConstantCodec extends Codec<void> {
  constructor(string: string) {
    super({
      encode() {
        return string
      },
      decode(s) {
        if (s !== string) {
          return null
        }
      },
    })
  }
}
