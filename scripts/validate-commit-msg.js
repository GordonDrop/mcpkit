#!/usr/bin/env node

/**
 * Validates commit messages against conventional commit format
 * for the mcpkit project.
 * 
 * Required format: <type>(<scope>): <description>
 * - Type: feat, fix, chore, docs, style, refactor, test, ci, etc.
 * - Scope: Must be one of the actual package names (cli, core, server, transport-stdio)
 *   or multiple scopes separated by commas
 * - Description: Brief description in any language (Russian/English acceptable)
 * 
 * Examples:
 * - feat(core): добавить новую функцию X
 * - fix(cli, server): исправить ошибку Y  
 * - chore: обновить dev-зависимости
 */

const fs = require('fs');
const path = require('path');

// Valid commit types
const VALID_TYPES = [
  'feat',     // New feature
  'fix',      // Bug fix
  'chore',    // Maintenance tasks
  'docs',     // Documentation changes
  'style',    // Code style changes (formatting, etc.)
  'refactor', // Code refactoring
  'test',     // Adding or updating tests
  'ci',       // CI/CD changes
  'perf',     // Performance improvements
  'build',    // Build system changes
  'revert'    // Reverting previous commits
];

// Valid package scopes based on actual packages in this project
const VALID_SCOPES = [
  'cli',
  'core', 
  'server',
  'transport-stdio'
];

/**
 * Validates a commit message against the conventional commit format
 * @param {string} message - The commit message to validate
 * @returns {object} - Validation result with success flag and error message
 */
function validateCommitMessage(message) {
  // Remove any leading/trailing whitespace
  message = message.trim();
  
  // Check if message is empty
  if (!message) {
    return {
      success: false,
      error: 'Commit message cannot be empty'
    };
  }

  // Regex pattern for conventional commit format
  // Supports: type(scope): description OR type: description
  const conventionalCommitRegex = /^(\w+)(\(([^)]+)\))?: (.+)$/;
  
  const match = message.match(conventionalCommitRegex);
  
  if (!match) {
    return {
      success: false,
      error: `Commit message does not follow conventional commit format.
Expected: <type>(<scope>): <description> or <type>: <description>
Got: "${message}"`
    };
  }

  const [, type, , scopeString, description] = match;

  // Validate type
  if (!VALID_TYPES.includes(type)) {
    return {
      success: false,
      error: `Invalid commit type: "${type}".
Valid types: ${VALID_TYPES.join(', ')}`
    };
  }

  // Validate scope if present
  if (scopeString) {
    const scopes = scopeString.split(',').map(s => s.trim());
    const invalidScopes = scopes.filter(scope => !VALID_SCOPES.includes(scope));
    
    if (invalidScopes.length > 0) {
      return {
        success: false,
        error: `Invalid scope(s): "${invalidScopes.join(', ')}".
Valid scopes: ${VALID_SCOPES.join(', ')}
You can also use multiple scopes separated by commas: feat(cli, core): description`
      };
    }
  }

  // Validate description
  if (!description || description.length < 3) {
    return {
      success: false,
      error: 'Commit description must be at least 3 characters long'
    };
  }

  return {
    success: true,
    message: 'Commit message is valid'
  };
}

/**
 * Main function to validate commit message from file or command line
 */
function main() {
  let commitMessage;

  // Check if commit message file path is provided as argument (used by git hooks)
  if (process.argv[2]) {
    const commitMsgFile = process.argv[2];
    try {
      commitMessage = fs.readFileSync(commitMsgFile, 'utf8');
    } catch (error) {
      console.error(`Error reading commit message file: ${error.message}`);
      process.exit(1);
    }
  } else {
    // For testing purposes, read from stdin or use test message
    console.error('Usage: node validate-commit-msg.js <commit-msg-file>');
    process.exit(1);
  }

  // Extract the first line (actual commit message, ignore comments)
  const firstLine = commitMessage.split('\n')[0];
  
  const result = validateCommitMessage(firstLine);
  
  if (result.success) {
    console.log('✅ Commit message is valid');
    process.exit(0);
  } else {
    console.error('❌ Invalid commit message:');
    console.error(result.error);
    console.error('\nExamples of valid commit messages:');
    console.error('  feat(core): добавить новую функцию X');
    console.error('  fix(cli, server): исправить ошибку Y');
    console.error('  chore: обновить dev-зависимости');
    console.error('  docs(transport-stdio): update API documentation');
    process.exit(1);
  }
}

// Export for testing
if (require.main === module) {
  main();
} else {
  module.exports = { validateCommitMessage, VALID_TYPES, VALID_SCOPES };
}
