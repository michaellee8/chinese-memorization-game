import { bench, expect, test } from "vitest"
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

test("heap test remove 0", () => {
  let h = new MyHeap()
  for (let i = 0; i < 10; i++) {
    h.push(i)
  }
  h.verify(0)

  while (h.len() > 0) {
    let i = h.len() - 1
    let x = heap.remove(h, i)
    expect(x).toBe(i)
    h.verify(0)
  }
})

test("heap test remove 1", () => {
  let h = new MyHeap()
  for (let i = 0; i < 10; i++) {
    h.push(i)
  }
  h.verify(0)

  for (let i = 0; h.len() > 0; i++) {
    let x = heap.remove(h, 0)
    expect(x).toBe(i)
    h.verify(0)
  }
})

test("heap test remove 2", () => {
  let N = 10

  let h = new MyHeap()
  for (let i = 0; i < N; i++) {
    h.push(i)
  }
  h.verify(0)

  let m = new Map<number, boolean>()
  while (h.len() > 0) {
    m.set(heap.remove(h, Math.trunc((h.len() - 1) / 2)), true)
    h.verify(0)
  }
  expect(m.size).toEqual(N)
  for (let i = 0; i < m.size; i++) {
    expect(m.get(i)).toBe(true)
  }
})

test("heap test fix", () => {
  let h = new MyHeap()
  h.verify(0)

  for (let i = 200; i > 0; i -= 10) {
    heap.push(h, i)
  }
  h.verify(0)

  expect(h.arr[0]).toEqual(10)
  h.arr[0] = 210
  heap.fix(h, 0)
  h.verify(0)

  for (let i = 100; i > 0; i--) {
    let elem = Math.floor(Math.random() * h.len())
    if ((i & 1) === 0) {
      h.arr[elem] *= 2
    } else {
      h.arr[elem] /= 2
    }
    heap.fix(h, elem)
    h.verify(0)
  }
})
