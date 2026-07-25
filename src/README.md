# Adawaty Tool Core

Sprint 4 closes with a single public entry point:

```js
import {
    createToolKernel,
    ToolValidator,
} from './src/tools/core/index.js';

const kernel = createToolKernel({
    namespace: 'adawaty',
    language: 'ar',
});

const required = ToolValidator.required();
kernel.validator.use(required);

const result = await kernel.run(
    {
        execute(input) {
            return { success: true, input };
        },
    },
    { value: 42 },
);

console.log(result);
console.log(kernel.diagnostics());

kernel.dispose();
```

## Core modules

```text
tool-context.js
tool-runner.js
tool-cache.js
tool-events.js
tool-validator.js
tool-loader.js
tool-kernel.js
index.js
```

## Runtime guarantees

- ES Modules only.
- No runtime dependencies.
- Browser and Vite compatible.
- GitHub Pages compatible.
- Shared namespace isolation.
- Explicit cleanup and disposal.
- Structured errors and diagnostics.

// END OF FILE
