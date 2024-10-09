export interface PQValuer {
  pqValue(): number
}

interface Item<T extends PQValuer> {
  v: T
  index: number
}

export class PriorityQueue<T extends PQValuer> {
  arr: Item<T> = []
}
