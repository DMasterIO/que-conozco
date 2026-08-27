class MemoryStorage {
  private store = new Map<string, string>()

  getItem(key: string): string | null {
    return this.store.has(key) ? this.store.get(key)! : null
  }

  setItem(key: string, value: string): void {
    this.store.set(key, value)
  }

  removeItem(key: string): void {
    this.store.delete(key)
  }

  clear(): void {
    this.store.clear()
  }

  key(index: number): string | null {
    return Array.from(this.store.keys())[index] ?? null
  }

  get length(): number {
    return this.store.size
  }
}

globalThis.localStorage = new MemoryStorage() as unknown as Storage
globalThis.window = globalThis as unknown as Window & typeof globalThis
