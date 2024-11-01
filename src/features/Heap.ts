interface Sort {
  len(): number
  less(i: number, j: number): boolean
  swap(i: number, j: number): void
}

// ported from https://cs.opensource.google/go/go/+/refs/tags/go1.23.2:src/container/heap/heap.go
export namespace heap {
  export interface Heap<T> extends Sort {
    push(x: T): void
    pop(): T
  }
  export function init<T>(h: Heap<T>): void {
    const n = h.len()
    for (let i = Math.trunc(n / 2) - 1; i >= 0; i--) {
      down(h, i, n)
    }
  }
  export function push<T>(h: Heap<T>, x: T): void {
    h.push(x)
    up(h, h.len() - 1)
  }
  export function pop<T>(h: Heap<T>): T {
    let n = h.len() - 1
    h.swap(0, n)
    down(h, 0, n)
    return h.pop()
  }
  export function remove<T>(h: Heap<T>, i: number): T {
    let n = h.len() - 1
    if (n !== i) {
      h.swap(i, n)
      if (!down(h, i, n)) {
        up(h, i)
      }
    }
    return h.pop()
  }
  export function fix<T>(h: Heap<T>, i: number): void {
    if (!down(h, i, h.len())) {
      up(h, i)
    }
  }

  function up<T>(h: Heap<T>, j: number): void {
    while (true) {
      let i = Math.trunc((j - 1) / 2)
      if (i === j || !h.less(j, i)) {
        break
      }
      h.swap(i, j)
      j = i
    }
  }

  function down<T>(h: Heap<T>, i0: number, n: number): boolean {
    let i = i0
    while (true) {
      let j1 = 2 * i + 1
      if (j1 >= n || j1 < 0) {
        break
      }
      let j = j1
      let j2 = j1 + 1
      if (j2 < n && h.less(j2, j1)) {
        j = j2
      }
      if (!h.less(j, i)) {
        break
      }
      h.swap(i, j)
      i = j
    }
    return i > i0
  }
}
