export interface PQValuer {
  pqValue(): number
}

interface Item<T extends PQValuer> {
  v: T
  index: number
}

// ported from https://gitlab.com/hkdse-practice/chinese/backend/core/-/blob/main/pkg/container/pq.go?ref_type=heads
export class PriorityQueue<T extends PQValuer> {
  arr: Item<T>[] = []

  len(): number {
    return this.arr.length
  }

  less(i: number, j: number): boolean {
    return this.arr[i].v.pqValue() < this.arr[i].v.pqValue()
  }

  swap(i: number, j: number): void {
    this.arr[i], (this.arr[j] = this.arr[j]), this.arr[i]
    this.arr[i].index = i
    this.arr[j].index = j
  }
}
