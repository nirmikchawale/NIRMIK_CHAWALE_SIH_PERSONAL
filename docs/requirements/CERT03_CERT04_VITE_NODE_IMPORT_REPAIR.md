# CERT-03 / CERT-04 test-runner import correction

GitHub Actions exact SHA 1b00dc16 workflow 39143830778 failed before tests were collected. Real static GLORYS preflight PASSED. Playwright Node test runner loaded frontend/src/pilot-main-block-loader.ts to exercise unchanged genuine March/July frame converters but the top-level module accessed Vite-only `import.meta.env.BASE_URL` while `import.meta.env` does not exist in Node. The isolated CERT02 also failed at its `npm run e2e:live -- --list` step for this reason; actual TypeScript/React build, Uvicorn and original scientific tests had already passed.

Fix top-level asset URL to use optional chaining `import.meta.env?.BASE_URL ?? "./"`. Browser asset URLs remain exactly the same in Vite (BASE_URL supplied). Node pure converter imports no longer throw before Playwright can discover tests. This is not a mock or a changed scientific value. Rerun full exact-SHA CERT02, CERT03 and 108 screenshot workflows.
