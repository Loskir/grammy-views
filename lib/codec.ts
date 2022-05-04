import {Context, Filter} from 'grammy'
import {DataFlavor} from './view'

type Encoder<T> = (data: T) => string
type Decoder<T> = (s: string) => T | null

export class Codec<T> {
  public encode: Encoder<T>
  public decode: Decoder<T>

  constructor({encode, decode}: { encode: Encoder<T>, decode: Decoder<T> }) {
    this.encode = encode
    this.decode = decode
  }

  filter<C extends Filter<Context, 'callback_query:data'>>(ctx: C): ctx is C & DataFlavor<T> {
    const decoded = this.decode(ctx.callbackQuery.data)
    if (decoded === null) {
      return false
    }
    // @ts-ignore
    ctx.data = decoded
    return true
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
