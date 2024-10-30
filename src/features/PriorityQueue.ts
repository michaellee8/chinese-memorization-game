import { heap } from "./Heap"

export interface PQValuer {
  pqValue(): number
}

interface Item<T extends PQValuer> {
  v: T
  index: number
}

// ported from https://gitlab.com/hkdse-practice/chinese/backend/core/-/blob/main/pkg/container/pq.go?ref_type=heads
export class PriorityQueue<T extends PQValuer> implements heap.Heap<Item<T>> {
  arr: Item<T>[] = []

  len(): number {
    return this.arr.length
  }

  less(i: number, j: number): boolean {
    return this.arr[i].v.pqValue() < this.arr[i].v.pqValue()
  }

  swap(i: number, j: number): void {
    ;[this.arr[i], this.arr[j]] = [this.arr[j], this.arr[i]]
    this.arr[i].index = i
    this.arr[j].index = j
  }

  push(item: Item<T>): void {
    let n = this.arr.length
    item.index = n
    this.arr.push(item)
  }

  pop(): Item<T> {
    let item = this.arr.pop()
    if (item === undefined || item === null) {
      throw new Error("PriorityQueue is empty, not possible to pop.")
    }
    item.index = -1
    return item
  }

  constructor(ts: T[]) {
    ts.forEach((v, idx) => {
      this.arr.push({ v, index: idx })
    })
    heap.init(this)
  }

  gUpdate(item: Item<T>, value: T): void {
    item.v = value
    heap.fix(this, item.index)
  }

  gPush(value: T): void {
    let item: Item<T> = { v: value, index: -1 }
    heap.push(this, item)
  }

  gPop(): T {
    let item = heap.pop(this)
    return item.v
  }

  gTop(): T {
    return this.arr[0].v
  }

  gLen(): number {
    return this.arr.length
  }

  gPopAt(idx: number): T {
    return heap.remove(this, idx).v
  }
}
