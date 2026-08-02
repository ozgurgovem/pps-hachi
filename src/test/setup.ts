import { afterEach } from "vitest";
import { cleanup } from "@testing-library/react";

// vitest.config.ts sets globals: false, so @testing-library/react's automatic
// afterEach(cleanup) has no global afterEach to attach to — wire it explicitly,
// or DOM from one test leaks into the next (duplicate elements, stale state).
afterEach(() => {
  cleanup();
});

// jsdom is missing a few browser APIs that Radix primitives (Select, Popover,
// Tooltip) call unconditionally. Polyfill the minimum needed to keep component
// tests from throwing "not implemented" errors that have nothing to do with
// the behavior under test.

if (!Element.prototype.hasPointerCapture) {
  Element.prototype.hasPointerCapture = () => false;
}
if (!Element.prototype.setPointerCapture) {
  Element.prototype.setPointerCapture = () => {};
}
if (!Element.prototype.releasePointerCapture) {
  Element.prototype.releasePointerCapture = () => {};
}
if (!Element.prototype.scrollIntoView) {
  Element.prototype.scrollIntoView = () => {};
}

// Node 22+'s experimental global localStorage shadows jsdom's own Storage
// implementation and leaves window.localStorage undefined without a
// --localstorage-file flag. A minimal in-memory Storage sidesteps that
// interop bug entirely, and is reset per test in the afterEach below.
class MemoryStorage implements Storage {
  #store = new Map<string, string>();

  get length(): number {
    return this.#store.size;
  }

  clear(): void {
    this.#store.clear();
  }

  getItem(key: string): string | null {
    return this.#store.has(key) ? (this.#store.get(key) ?? null) : null;
  }

  key(index: number): string | null {
    return Array.from(this.#store.keys())[index] ?? null;
  }

  removeItem(key: string): void {
    this.#store.delete(key);
  }

  setItem(key: string, value: string): void {
    this.#store.set(key, String(value));
  }
}

if (typeof window.localStorage === "undefined") {
  Object.defineProperty(window, "localStorage", {
    value: new MemoryStorage(),
    writable: true,
  });
}

afterEach(() => {
  window.localStorage.clear();
});

// jsdom does not implement matchMedia. ThemeProvider (and anything reading
// prefers-color-scheme / prefers-reduced-motion) needs at least a no-op shape.
if (!window.matchMedia) {
  window.matchMedia = (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  });
}

class ResizeObserverStub {
  observe(): void {}
  unobserve(): void {}
  disconnect(): void {}
}

if (!("ResizeObserver" in globalThis)) {
  (globalThis as unknown as { ResizeObserver: typeof ResizeObserverStub }).ResizeObserver =
    ResizeObserverStub;
}
