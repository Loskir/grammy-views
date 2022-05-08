export enum Dough {
  biscuit = 'biscuit',
  shortbread = 'shortbread',
  puff = 'puff',
}

export enum Filling {
  strawberry = 'strawberry',
  cherry = 'cherry',
  pineapple = 'pineapple',
}

export interface Cake {
  dough: Dough
  fillings: Filling[]
  comment?: string
  created_at: Date
}