/**
 * Test file for conditional logic
 * Run with: node tests/conditionalLogic.test.js
 */

import { shouldShowQuestion } from '../utils/conditionalLogic.js';

// Test cases
const tests = [
  {
    name: 'No rules - should show',
    rules: null,
    answers: {},
    expected: true
  },
  {
    name: 'Empty conditions - should show',
    rules: { logic: 'AND', conditions: [] },
    answers: {},
    expected: true
  },
  {
    name: 'AND logic - both true',
    rules: {
      logic: 'AND',
      conditions: [
        { questionKey: 'role', operator: 'equals', value: 'Engineer' },
        { questionKey: 'experience', operator: 'equals', value: 'Senior' }
      ]
    },
    answers: { role: 'Engineer', experience: 'Senior' },
    expected: true
  },
  {
    name: 'AND logic - one false',
    rules: {
      logic: 'AND',
      conditions: [
        { questionKey: 'role', operator: 'equals', value: 'Engineer' },
        { questionKey: 'experience', operator: 'equals', value: 'Senior' }
      ]
    },
    answers: { role: 'Engineer', experience: 'Junior' },
    expected: false
  },
  {
    name: 'OR logic - one true',
    rules: {
      logic: 'OR',
      conditions: [
        { questionKey: 'role', operator: 'equals', value: 'Engineer' },
        { questionKey: 'role', operator: 'equals', value: 'Designer' }
      ]
    },
    answers: { role: 'Engineer' },
    expected: true
  },
  {
    name: 'OR logic - both false',
    rules: {
      logic: 'OR',
      conditions: [
        { questionKey: 'role', operator: 'equals', value: 'Engineer' },
        { questionKey: 'role', operator: 'equals', value: 'Designer' }
      ]
    },
    answers: { role: 'Manager' },
    expected: false
  },
  {
    name: 'Contains - array',
    rules: {
      logic: 'AND',
      conditions: [
        { questionKey: 'skills', operator: 'contains', value: 'JavaScript' }
      ]
    },
    answers: { skills: ['JavaScript', 'Python', 'React'] },
    expected: true
  },
  {
    name: 'Contains - string',
    rules: {
      logic: 'AND',
      conditions: [
        { questionKey: 'description', operator: 'contains', value: 'engineer' }
      ]
    },
    answers: { description: 'I am a software engineer' },
    expected: true
  },
  {
    name: 'Missing answer - should not show',
    rules: {
      logic: 'AND',
      conditions: [
        { questionKey: 'role', operator: 'equals', value: 'Engineer' }
      ]
    },
    answers: {},
    expected: false
  },
  {
    name: 'Not equals',
    rules: {
      logic: 'AND',
      conditions: [
        { questionKey: 'role', operator: 'notEquals', value: 'Manager' }
      ]
    },
    answers: { role: 'Engineer' },
    expected: true
  }
];

// Run tests
console.log('Running conditional logic tests...\n');

let passed = 0;
let failed = 0;

tests.forEach((test, index) => {
  const result = shouldShowQuestion(test.rules, test.answers);
  const success = result === test.expected;
  
  if (success) {
    passed++;
    console.log(`✓ Test ${index + 1}: ${test.name}`);
  } else {
    failed++;
    console.log(`✗ Test ${index + 1}: ${test.name}`);
    console.log(`  Expected: ${test.expected}, Got: ${result}`);
  }
});

console.log(`\nResults: ${passed} passed, ${failed} failed`);

if (failed === 0) {
  console.log('All tests passed! ✅');
  process.exit(0);
} else {
  console.log('Some tests failed ❌');
  process.exit(1);
}

