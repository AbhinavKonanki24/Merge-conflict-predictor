"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const ast_1 = require("./ast");
(0, vitest_1.describe)('ast.ts function overlap', () => {
    const mockFileContent = `
import React from 'react';

function calculateTotal(items) {
  let total = 0;
  for (const item of items) {
    total += item.price;
  }
  return total;
}

const processOrder = (order) => {
  const total = calculateTotal(order.items);
  console.log(total);
};

class OrderManager {
  verifyOrder() {
    return true;
  }
}

export default { calculateTotal, processOrder };
`;
    (0, vitest_1.it)('detects standard functions', () => {
        (0, vitest_1.expect)((0, ast_1.getEnclosingFunction)('test.ts', 5, mockFileContent)).toBe('calculateTotal');
        (0, vitest_1.expect)((0, ast_1.getEnclosingFunction)('test.ts', 8, mockFileContent)).toBe('calculateTotal');
    });
    (0, vitest_1.it)('detects arrow functions assigned to variables', () => {
        (0, vitest_1.expect)((0, ast_1.getEnclosingFunction)('test.ts', 12, mockFileContent)).toBe('processOrder');
    });
    (0, vitest_1.it)('detects class methods', () => {
        (0, vitest_1.expect)((0, ast_1.getEnclosingFunction)('test.ts', 18, mockFileContent)).toBe('verifyOrder');
    });
    (0, vitest_1.it)('falls back to class name if no method wraps the line', () => {
        // Line 17 is "class OrderManager {"
        (0, vitest_1.expect)((0, ast_1.getEnclosingFunction)('test.ts', 17, mockFileContent)).toBe('OrderManager');
    });
    (0, vitest_1.it)('returns null for code outside any function/class', () => {
        // Line 2 is import React...
        (0, vitest_1.expect)((0, ast_1.getEnclosingFunction)('test.ts', 2, mockFileContent)).toBeNull();
    });
    (0, vitest_1.it)('returns null for non JS/TS files', () => {
        (0, vitest_1.expect)((0, ast_1.getEnclosingFunction)('test.py', 5, mockFileContent)).toBeNull();
    });
});
