import "@testing-library/jest-dom";

// Node 22 has the WHATWG Fetch API (Request, Response, Headers, fetch) built-in.
// No polyfills needed. Next.js Route Handler tests need Node test environment —
// see individual test files that import next/server for environment overrides.
