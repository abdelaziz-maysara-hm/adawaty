# Contributing to Adawaty

Thanks for your interest in contributing! Adawaty is a static-site collection of client-side tools generated from JS definitions. To keep the project maintainable we follow a small workflow:

- Clone the repository and create a feature branch from main:
  ```bash
  git clone https://github.com/abdelaziz-maysara-hm/adawaty.git
  git checkout -b improvements/your-change
  ```

- Install dependencies and prepare the media runtime (Node 20+):
  ```bash
  npm ci --ignore-scripts
  npm run prepare:media-runtime
  ```

- Regenerate pages after editing definitions or generator scripts:
  ```bash
  npm run generate:product
  ```

- Run syntax checks and tests locally:
  ```bash
  npm run check
  npm test
  ```

How to add a new tool

1. Add a new entry to a file under `src/product/definitions/` following the existing pattern. Each definition is data-first and describes UI, inputs, outputs and the implementation.
2. Run `npm run generate:product` to regenerate static pages (tools/, categories/, sitemap.xml).
3. Add or update tests in `tests/` for any new behavior.
4. Open a pull request against `main` and describe the change.

Server-side / Vercel endpoints

We maintain a small serverless surface under `api/` for tasks that require server reliability (heavy processing, proxies). These are optional and carefully added: prefer client-side first, move to server-side only for performance or reliability needs.

Code style and tests

- The project uses plain ES Modules and Node 20.
- Keep tests lightweight and dependency-free where possible (the repo includes a custom test runner in `scripts/run-tests.mjs`).

Thank you — every improvement helps make Adawaty a better toolset for Arabic and English users.