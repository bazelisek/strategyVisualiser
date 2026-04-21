import "@testing-library/jest-dom";

class MockIntersectionObserver implements IntersectionObserver {
  readonly root = null;
  readonly rootMargin = "";
  readonly thresholds = [];

  disconnect() {}

  observe() {}

  takeRecords(): IntersectionObserverEntry[] {
    return [];
  }

  unobserve() {}
}

const globalTarget = globalThis as typeof globalThis & {
  IntersectionObserver?: typeof MockIntersectionObserver;
  matchMedia?: (query: string) => MediaQueryList;
};

Object.defineProperty(globalTarget, "IntersectionObserver", {
  writable: true,
  configurable: true,
  value: MockIntersectionObserver,
});

if (typeof window !== "undefined" && window !== globalThis) {
  Object.defineProperty(window, "IntersectionObserver", {
    writable: true,
    configurable: true,
    value: MockIntersectionObserver,
  });
}

const matchMediaMock = (query: string) =>
  ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  }) as MediaQueryList;

Object.defineProperty(globalTarget, "matchMedia", {
  writable: true,
  configurable: true,
  value: matchMediaMock,
});

if (typeof window !== "undefined" && window !== globalThis) {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    configurable: true,
    value: matchMediaMock,
  });
}
