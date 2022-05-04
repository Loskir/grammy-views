import {MiddlewareFn} from 'grammy'

type Encoder<T> = (data: T) => string
type Decoder<T> = (s: string) => T | null

export class Codec<T> {
  public encode: Encoder<T>
  public decode: Decoder<T>

  constructor({encode, decode}: { encode: Encoder<T>, decode: Decoder<T> }) {
    this.encode = encode
    this.decode = decode
  }

  middleware(): MiddlewareFn {
    return (ctx, next) => {
      if (!ctx.callbackQuery?.data) {
        return next()
      }
      const match = this.decode(ctx.callbackQuery.data)
      if (match === null) {
        return next()
      }

    }
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
