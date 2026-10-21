/**
 * Unit Tests for AEGIS Environment File Generator
 * 
 * Verifies systemd EnvironmentFile serialization, control-character rejection,
 * mandatory secret validation, and permission enforcement.
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const assert = require('assert');

const {
  serializeSystemdValue,
  validateSecrets,
  generateEnvContent,
  validateAndGenerate
} = require('./generate-env');

function runTests() {
  console.log('Running focused tests for generate-env...');
  let passed = 0;

  function test(name, fn) {
    try {
      fn();
      console.log(`  ✓ ${name}`);
      passed++;
    } catch (err) {
      console.error(`  ✗ ${name}`);
      console.error(err);
      process.exit(1);
    }
  }

  // 1. Ordinary values
  test('Ordinary values serialized with quotes', () => {
    assert.strictEqual(serializeSystemdValue('ordinaryValue', 'KEY'), '"ordinaryValue"');
    assert.strictEqual(serializeSystemdValue('8080', 'PORT'), '"8080"');
    assert.strictEqual(serializeSystemdValue('https://api.openai.com/v1', 'URL'), '"https://api.openai.com/v1"');
  });

  // 2. Values containing dollar signs
  test('Values containing dollar signs are preserved literally without expansion', () => {
    const value = 'pass$word$$with$symbols';
    const serialized = serializeSystemdValue(value, 'PASSWORD');
    assert.strictEqual(serialized, '"pass$word$$with$symbols"');
  });

  // 3. Double quotes and backslashes
  test('Double quotes and backslashes are escaped properly', () => {
    const value = 'quote"inside\\and\\backslash"';
    const serialized = serializeSystemdValue(value, 'KEY');
    assert.strictEqual(serialized, '"quote\\"inside\\\\and\\\\backslash\\""');
  });

  // 4. Spaces and equals signs
  test('Spaces and equals signs are preserved inside double quotes', () => {
    const value = 'param=value key=another value with spaces';
    const serialized = serializeSystemdValue(value, 'KEY');
    assert.strictEqual(serialized, '"param=value key=another value with spaces"');
  });

  // 5. Empty optional API keys
  test('Empty or null optional values serialize to empty double quotes', () => {
    assert.strictEqual(serializeSystemdValue('', 'EMPTY_KEY'), '""');
    assert.strictEqual(serializeSystemdValue(undefined, 'UNDEF_KEY'), '""');
    assert.strictEqual(serializeSystemdValue(null, 'NULL_KEY'), '""');
  });

  // 6. Missing mandatory variables
  test('Missing mandatory variables trigger validation errors', () => {
    const emptyEnv = {};
    const errors = validateSecrets(emptyEnv);
    assert(errors.some(e => e.includes('SERVER_HOST')), 'Expected SERVER_HOST error');
    assert(errors.some(e => e.includes('SPRING_DATASOURCE_URL')), 'Expected SPRING_DATASOURCE_URL error');
    assert(errors.some(e => e.includes('SPRING_DATASOURCE_USERNAME')), 'Expected SPRING_DATASOURCE_USERNAME error');
    assert(errors.some(e => e.includes('SPRING_DATASOURCE_PASSWORD')), 'Expected SPRING_DATASOURCE_PASSWORD error');
    assert(errors.some(e => e.includes('JWT_SECRET')), 'Expected JWT_SECRET error');
    assert(errors.some(e => e.includes('AEGIS_SECRET_KEY')), 'Expected AEGIS_SECRET_KEY error');
  });

  // 7. Secrets shorter than configured minimum length
  test('Secrets shorter than minimum length are rejected', () => {
    const shortEnv = {
      SERVER_HOST: '127.0.0.1',
      SPRING_DATASOURCE_URL: 'jdbc:mysql://localhost:3306/aegis',
      SPRING_DATASOURCE_USERNAME: 'aegis_user',
      SPRING_DATASOURCE_PASSWORD: 'password',
      JWT_SECRET: 'short_key_16_ch', // 16 chars < 32
      AEGIS_SECRET_KEY: 'short_key_16_ch' // 16 chars < 32
    };
    const errors = validateSecrets(shortEnv);
    assert(errors.some(e => e.includes('JWT_SECRET must be at least 32 characters long')), 'Expected JWT_SECRET length error');
    assert(errors.some(e => e.includes('AEGIS_SECRET_KEY must be at least 32 characters long')), 'Expected AEGIS_SECRET_KEY length error');
  });

  // 8. Newlines and unsupported control characters
  test('Newlines and control characters are strictly rejected without logging secret values', () => {
    const sensitiveNewlineValue = 'super_secret_value\nwith_newline';
    assert.throws(
      () => serializeSystemdValue(sensitiveNewlineValue, 'SECRET_KEY'),
      (err) => {
        // Must reject with variable name, must NOT leak the secret value
        assert(err.message.includes('SECRET_KEY'), 'Error must identify variable name');
        assert(err.message.includes('unsupported newline or control characters'), 'Error must specify reason');
        assert(!err.message.includes('super_secret_value'), 'Error MUST NOT leak secret value');
        return true;
      }
    );

    const sensitiveCarriageReturn = 'secret\rwith_cr';
    assert.throws(
      () => serializeSystemdValue(sensitiveCarriageReturn, 'CR_KEY'),
      /CR_KEY contains unsupported newline/
    );

    const sensitiveNullByte = 'secret\x00with_null';
    assert.throws(
      () => serializeSystemdValue(sensitiveNullByte, 'NULL_KEY'),
      /NULL_KEY contains unsupported newline or control/
    );
  });

  // 9. Existing output files with overly permissive permissions
  test('Existing output files are overwritten with secure 0600 permissions', () => {
    const testDir = fs.mkdtempSync(path.join(os.tmpdir(), 'aegis-env-test-'));
    const testFile = path.join(testDir, 'test.env');

    try {
      // Create pre-existing file with permissive permissions (0666)
      fs.writeFileSync(testFile, 'PRE_EXISTING_CONTENT=1', { mode: 0o666 });

      const mockValidEnv = {
        SERVER_HOST: '127.0.0.1',
        SPRING_DATASOURCE_URL: 'jdbc:mysql://localhost:3306/aegis',
        SPRING_DATASOURCE_USERNAME: 'aegis_user',
        SPRING_DATASOURCE_PASSWORD: 'secure_password_123',
        JWT_SECRET: 'a_very_secure_jwt_secret_key_at_least_32_characters_long',
        AEGIS_SECRET_KEY: 'a_very_secure_master_encryption_key_at_least_32_chars',
        CORS_ALLOWED_ORIGINS: 'http://localhost:3000',
        AEGIS_MODEL_PRIMARY_API_KEY: 'mock-key',
        AEGIS_MODEL_FALLBACK1_API_KEY: ''
      };

      validateAndGenerate(mockValidEnv, testFile);

      assert(fs.existsSync(testFile), 'File must exist');
      const content = fs.readFileSync(testFile, 'utf8');
      assert(content.includes('SPRING_PROFILES_ACTIVE=prod'), 'File must contain profile');
      assert(content.includes('SERVER_HOST="127.0.0.1"'), 'File must contain SERVER_HOST');
      assert(content.includes('SPRING_DATASOURCE_PASSWORD="secure_password_123"'), 'File must contain password');
      assert(content.includes('AEGIS_MODEL_FALLBACK1_API_KEY=""'), 'Optional empty key must be empty quotes');

      if (process.platform !== 'win32') {
        const stats = fs.statSync(testFile);
        const mode = stats.mode & 0o777;
        assert.strictEqual(mode, 0o600, 'File permissions must be 0600');
      }
    } finally {
      // Cleanup
      if (fs.existsSync(testFile)) fs.unlinkSync(testFile);
      if (fs.existsSync(testDir)) fs.rmdirSync(testDir);
    }
  });

  // 10. Special characters, commas, equals signs, symbols, and complex URL values
  test('Preserves commas, URLs, equals signs, dollar signs, and special symbols correctly', () => {
    const complexUrl = 'jdbc:mysql://db.prod.internal:3306/aegis?useSSL=true&serverTimezone=UTC&allowPublicKeyRetrieval=false,extraOption=true';
    assert.strictEqual(
      serializeSystemdValue(complexUrl, 'SPRING_DATASOURCE_URL'),
      `"${complexUrl}"`
    );

    const corsWithCommas = 'https://aegis.domain.com,https://admin.aegis.domain.com:8443,http://localhost:5173';
    assert.strictEqual(
      serializeSystemdValue(corsWithCommas, 'CORS_ALLOWED_ORIGINS'),
      `"${corsWithCommas}"`
    );

    // Symbols including spaces, equals, commas, dollar signs, hashes, at-signs, and punctuation
    const specialSymbols = 'P@ssw0rd$#%^&*()-_=+[]{}|;:,.<>?/~`';
    const expectedEscaped = '"P@ssw0rd$#%^&*()-_=+[]{}|;:,.<>?/~`"';
    assert.strictEqual(serializeSystemdValue(specialSymbols, 'SECRET'), expectedEscaped);

    // Value with quotes, backslashes, and dollar signs together
    const mixedVal = 'val"with\\back\\slash"and$dollar';
    const expectedMixed = '"val\\"with\\\\back\\\\slash\\"and$dollar"';
    assert.strictEqual(serializeSystemdValue(mixedVal, 'MIXED'), expectedMixed);
  });

  // 11. Long required secrets (e.g. 512-bit / 256-character JWT secrets)
  test('Long required secrets pass validation and are serialized accurately', () => {
    const longJwtSecret = 'A'.repeat(256);
    const longEncryptionKey = 'B'.repeat(128);
    const env = {
      SERVER_HOST: '127.0.0.1',
      SPRING_DATASOURCE_URL: 'jdbc:mysql://localhost:3306/aegis',
      SPRING_DATASOURCE_USERNAME: 'aegis_user',
      SPRING_DATASOURCE_PASSWORD: 'password',
      JWT_SECRET: longJwtSecret,
      AEGIS_SECRET_KEY: longEncryptionKey
    };
    const errors = validateSecrets(env);
    assert.strictEqual(errors.length, 0);

    const content = generateEnvContent(env);
    assert(content.includes(`JWT_SECRET="${longJwtSecret}"`));
    assert(content.includes(`AEGIS_SECRET_KEY="${longEncryptionKey}"`));
    assert(content.includes('SERVER_HOST="127.0.0.1"'));
  });

  // 12. Invalid control characters: ESC, DEL, backspace, vertical tab
  test('Various control characters (ESC, DEL, backspace, vertical tab) are rejected without leaking values', () => {
    const controlChars = [
      { char: '\x1b', name: 'escape' },
      { char: '\x7f', name: 'DEL' },
      { char: '\x08', name: 'backspace' },
      { char: '\x0b', name: 'vertical_tab' },
      { char: '\x07', name: 'bell' }
    ];

    for (const item of controlChars) {
      const sensitiveValue = `secret_prefix_${item.name}_${item.char}_secret_suffix`;
      assert.throws(
        () => serializeSystemdValue(sensitiveValue, 'TEST_VAR'),
        (err) => {
          assert(err.message.includes('TEST_VAR'), 'Error must mention variable name');
          assert(err.message.includes('unsupported newline or control characters'), 'Error must mention reason');
          assert(!err.message.includes('secret_prefix_'), 'Error must not leak secret value');
          return true;
        }
      );
    }
  });

  // 13. Atomic safety: Generation failure does not delete or alter pre-existing valid environment file
  test('Generation failure does not delete or overwrite pre-existing valid environment file', () => {
    const testDir = fs.mkdtempSync(path.join(os.tmpdir(), 'aegis-env-fail-test-'));
    const testFile = path.join(testDir, 'production.env');
    const originalContent = 'SPRING_PROFILES_ACTIVE=prod\nEXISTING_SECRET=preserve_me\n';

    try {
      fs.writeFileSync(testFile, originalContent, { mode: 0o600 });

      const invalidEnv = {
        SERVER_HOST: '127.0.0.1'
        // Missing other mandatory secrets
      };

      assert.throws(
        () => validateAndGenerate(invalidEnv, testFile, true),
        /Production secret validation failed/
      );

      // Pre-existing file must remain completely untouched!
      assert(fs.existsSync(testFile), 'Existing file must not be deleted');
      assert.strictEqual(fs.readFileSync(testFile, 'utf8'), originalContent, 'Original content must be preserved');
    } finally {
      if (fs.existsSync(testFile)) fs.unlinkSync(testFile);
      if (fs.existsSync(testDir)) fs.rmdirSync(testDir);
    }
  });

  // 14. Atomic safety: Control character error during serialization does not corrupt pre-existing file
  test('Generation failure due to control characters does not corrupt pre-existing file', () => {
    const testDir = fs.mkdtempSync(path.join(os.tmpdir(), 'aegis-env-ctrl-test-'));
    const testFile = path.join(testDir, 'production.env');
    const originalContent = 'PREVIOUS_VALID_FILE=1\n';

    try {
      fs.writeFileSync(testFile, originalContent, { mode: 0o600 });

      const corruptedEnv = {
        SERVER_HOST: '127.0.0.1',
        SPRING_DATASOURCE_URL: 'jdbc:mysql://localhost:3306/aegis',
        SPRING_DATASOURCE_USERNAME: 'aegis_user',
        SPRING_DATASOURCE_PASSWORD: 'password\x00with_null',
        JWT_SECRET: 'a_very_secure_jwt_secret_key_at_least_32_characters_long',
        AEGIS_SECRET_KEY: 'a_very_secure_master_encryption_key_at_least_32_chars'
      };

      assert.throws(
        () => validateAndGenerate(corruptedEnv, testFile, true),
        /SPRING_DATASOURCE_PASSWORD contains unsupported newline or control characters/
      );

      // Pre-existing file still exists and unchanged
      assert(fs.existsSync(testFile));
      assert.strictEqual(fs.readFileSync(testFile, 'utf8'), originalContent);
    } finally {
      if (fs.existsSync(testFile)) fs.unlinkSync(testFile);
      if (fs.existsSync(testDir)) fs.rmdirSync(testDir);
    }
  });

  console.log(`\nAll ${passed} tests passed successfully!`);
}

runTests();

