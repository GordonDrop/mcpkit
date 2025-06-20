#!/usr/bin/env node

/**
 * Test script for commit message validation
 */

const { validateCommitMessage } = require('./validate-commit-msg.js');

// Test cases
const testCases = [
  // Valid cases
  { message: 'feat(core): добавить новую функцию X', expected: true, description: 'Valid feat with Russian description' },
  { message: 'fix(cli, server): исправить ошибку Y', expected: true, description: 'Valid fix with multiple scopes' },
  { message: 'chore: обновить dev-зависимости', expected: true, description: 'Valid chore without scope' },
  { message: 'docs(transport-stdio): update API documentation', expected: true, description: 'Valid docs with English description' },
  { message: 'test(core): add unit tests for validation', expected: true, description: 'Valid test commit' },
  { message: 'refactor(cli): improve code structure', expected: true, description: 'Valid refactor commit' },
  { message: 'ci: update GitHub Actions workflow', expected: true, description: 'Valid CI commit without scope' },
  { message: 'perf(server): optimize request handling', expected: true, description: 'Valid performance improvement' },
  
  // Invalid cases
  { message: '', expected: false, description: 'Empty message' },
  { message: 'invalid message format', expected: false, description: 'No conventional format' },
  { message: 'feat(invalid-scope): some feature', expected: false, description: 'Invalid scope' },
  { message: 'invalidtype(core): some change', expected: false, description: 'Invalid type' },
  { message: 'feat(core):', expected: false, description: 'Missing description' },
  { message: 'feat(core): ab', expected: false, description: 'Description too short' },
  { message: 'feat(pkg-a): should not work', expected: false, description: 'Example scope should be rejected' },
  { message: 'feat(core, invalid): mixed valid and invalid scopes', expected: false, description: 'Mixed valid/invalid scopes' },
];

console.log('🧪 Testing commit message validation...\n');

let passed = 0;
let failed = 0;

testCases.forEach((testCase, index) => {
  const result = validateCommitMessage(testCase.message);
  const success = result.success === testCase.expected;
  
  if (success) {
    console.log(`✅ Test ${index + 1}: ${testCase.description}`);
    passed++;
  } else {
    console.log(`❌ Test ${index + 1}: ${testCase.description}`);
    console.log(`   Message: "${testCase.message}"`);
    console.log(`   Expected: ${testCase.expected ? 'valid' : 'invalid'}`);
    console.log(`   Got: ${result.success ? 'valid' : 'invalid'}`);
    if (!result.success) {
      console.log(`   Error: ${result.error}`);
    }
    console.log('');
    failed++;
  }
});

console.log(`\n📊 Test Results: ${passed} passed, ${failed} failed`);

if (failed === 0) {
  console.log('🎉 All tests passed!');
  process.exit(0);
} else {
  console.log('💥 Some tests failed!');
  process.exit(1);
}
