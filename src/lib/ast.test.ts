import { describe, it, expect } from 'vitest';
import { getEnclosingFunction } from './ast';

describe('ast.ts function overlap', () => {
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

  it('detects standard functions', () => {
    expect(getEnclosingFunction('test.ts', 5, mockFileContent)).toBe('calculateTotal');
    expect(getEnclosingFunction('test.ts', 8, mockFileContent)).toBe('calculateTotal');
  });

  it('detects arrow functions assigned to variables', () => {
    expect(getEnclosingFunction('test.ts', 12, mockFileContent)).toBe('processOrder');
  });

  it('detects class methods', () => {
    expect(getEnclosingFunction('test.ts', 18, mockFileContent)).toBe('verifyOrder');
  });

  it('falls back to class name if no method wraps the line', () => {
    // Line 17 is "class OrderManager {"
    expect(getEnclosingFunction('test.ts', 17, mockFileContent)).toBe('OrderManager');
  });

  it('returns null for code outside any function/class', () => {
    // Line 2 is import React...
    expect(getEnclosingFunction('test.ts', 2, mockFileContent)).toBeNull();
  });

  it('returns null for non JS/TS files', () => {
    expect(getEnclosingFunction('test.py', 5, mockFileContent)).toBeNull();
  });
});
