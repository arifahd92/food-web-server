# Food Ordering System - Testing Guide

## Quick Test Commands

```bash
# Run all tests
npm test

# Run tests with coverage report
npm run test:cov

# Run tests in watch mode
npm run test:watch
```

## Test Results Summary

✅ **All 16 tests passing**
- 5 test suites
- 62.22% code coverage
- All critical business logic tested

## What's Tested

### Order Management
- ✅ Order creation with price calculation
- ✅ Idempotency handling
- ✅ Concurrent request handling
- ✅ Status transitions (RECEIVED → PREPARING → OUT_FOR_DELIVERY → DELIVERED)
- ✅ Invalid transition prevention
- ✅ Menu item validation

### Admin Features
- ✅ Cursor-based pagination
- ✅ Order listing
- ✅ Status updates

### Menu Operations
- ✅ Menu item retrieval
- ✅ Error handling

## Coverage Report

After running `npm run test:cov`, open:
```
./coverage/lcov-report/index.html
```

## Test Files Location

```
src/
├── menu/
│   ├── menu.controller.spec.ts
│   └── menu.service.spec.ts
├── orders/
│   ├── orders.controller.spec.ts
│   └── orders.service.spec.ts
└── app.controller.spec.ts
```

## For Assignment Reviewers

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Run tests:**
   ```bash
   npm test
   ```

3. **View coverage:**
   ```bash
   npm run test:cov
   ```

4. **Start the application:**
   ```bash
   npm run start:dev
   ```

5. **View API documentation:**
   ```
   http://localhost:3000/api/docs
   ```

---

**Test Framework:** Jest  
**Last Updated:** February 9, 2026
