## LPG Agency Frontend (React Order UI)

This folder contains the existing static marketing site **plus** a React “order cylinder” experience mounted as an island (no layout rewrite).

### Running locally

1. Install dependencies:

```bash
npm install
```

2. Start dev server:

```bash
npm run dev
```

### Notes

- **No real backend calls** are implemented. Coupon validation + order submission are mocked async functions (see `src/order-ui/utils/mock-api.ts`).
- The React entry is mounted from `index.html` via:
  - `src/order-ui/main.tsx`
- UI is mobile-first:
  - **≤768px**: bottom sheet order panel
  - **>768px**: right slide-over order panel


