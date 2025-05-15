# 📦 Publishing the Swap Package

Follow these steps to publish the `@microchain/swap` package to npm.

---

### 1. 🔼 Bump the Version

Update the version number in `libs/swap/package.json` to reflect a new release:

```json
"version": "0.0.X" // ⬅️ Increase this number
```

---

### 2. 🔧 Build the Package

Run the following command to build the package using Nx:

```bash
pnpm nx build swap
```

---

### 3. 🚀 Publish to npm

Navigate to the build output directory and publish:

```bash
cd dist/libs/swap
npm login        # Only if not already logged in
npm publish
```

> ✅ Make sure you have the correct permissions on the npm registry for `@microchain/swap`.
