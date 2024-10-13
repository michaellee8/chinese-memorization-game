import { expect, test } from "vitest"
import { heap } from "./Heap"

// ported from https://cs.opensource.google/go/go/+/refs/tags/go1.23.2:src/container/heap/heap_test.go

class MyHeap implements heap.Heap<number> {
  arr: number[] = []

  less(i: number, j: number): boolean {
    return this.arr[i] < this.arr[j]
  }

  swap(i: number, j: number): void {
    ;[this.arr[i], this.arr[j]] = [this.arr[j], this.arr[i]]
  }

  len(): number {
    return this.arr.length
  }

  pop(): number {
    const v = this.arr.pop()
    if (v === undefined) {
      throw new Error("array is empty")
    }
    return v
  }

  push(x: number): void {
    this.arr.push(x)
  }

  verify(i: number): void {
    const n = this.len()
    let j1 = 2 * i + 1
    let j2 = 2 * i + 2
    if (j1 < n) {
      expect(this.less(j1, i)).toBe(false)
      this.verify(j1)
    }
    if (j2 < n) {
      expect(this.less(j2, i)).toBe(false)
      this.verify(j2)
    }
  }
}

test("heap init 0", () => {
  let h = new MyHeap()
  for (let i = 20; i > 0; i--) {
    h.push(0)
  }
  heap.init(h)
  h.verify(0)
  for (let i = 1; h.len() > 0; i++) {
    let x = heap.pop(h)
    h.verify(0)
    expect(x).toBe(0)
  }
})

test("heap init 1", () => {
  let h = new MyHeap()
  for (let i = 20; i > 0; i--) {
    h.push(i)
  }
  heap.init(h)
  h.verify(0)
  for (let i = 1; h.len() > 0; i++) {
    let x = heap.pop(h)
    h.verify(0)
    expect(x).toBe(i)
  }
})

test("heap test", () => {
  let h = new MyHeap()
  h.verify(0)

  for (let i = 20; i > 10; i--) {
    heap.push(h, i)
  }

  heap.init(h)
  h.verify(0)

  for (let i = 10; i > 0; i--) {
    heap.push(h, i)
    h.verify(0)
  }

  for (let i = 1; h.len() > 0; i++) {
    let x = heap.pop(h)
    if (i < 20) {
      heap.push(h, 20 + i)
    }
    h.verify(0)
    expect(x).toBe(i)
  }
})
