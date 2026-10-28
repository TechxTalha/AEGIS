/**
 * AEGIS Production Environment File Generator
 * 
 * Safely validates required deployment secrets and serializes a systemd-compliant
 * environment file without remote shell interpolation risks.
 * 
 * Uses atomic temporary-file writes to guarantee that errors never leave a partially
 * written or corrupted environment file, and avoids deleting pre-existing files
 * before validation and generation are completely successful.
 */

const fs = require('fs');
const path = require('path');

/**
 * Serializes a value for systemd's EnvironmentFile parser.
 * In systemd double-quoted format:
 * - Backslashes are escaped as \\
 * - Double quotes are escaped as \"
 * - Literal dollar signs, single quotes, backticks, spaces, equals signs, commas, and URLs are preserved
 * - Newlines and control characters are strictly rejected to prevent injection
 */
function serializeSystemdValue(val, key = 'UNKNOWN') {
  if (val === undefined || val === null || val === '') {
    return '""';
  }

  const str = String(val);

  // Reject newlines (\r, \n) and control characters (ASCII < 32 or DEL 127)
  // These cannot be safely represented as single-line EnvironmentFile values
  // without modifying or stripping the secret value.
  if (/[\r\n\x00-\x1F\x7F]/.test(str)) {
    throw new Error(`Variable ${key} contains unsupported newline or control characters.`);
  }

  // Escape backslashes first, then double quotes
  const escaped = str.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
  return `"${escaped}"`;
}

/**
 * Validates mandatory secrets and minimum length constraints without logging values.
 */
function validateSecrets(env) {
  const mandatorySecrets = [
    { key: 'SERVER_HOST', label: 'SERVER_HOST' },
    { key: 'SPRING_DATASOURCE_URL', label: 'SPRING_DATASOURCE_URL' },
    { key: 'SPRING_DATASOURCE_USERNAME', label: 'SPRING_DATASOURCE_USERNAME' },
    { key: 'SPRING_DATASOURCE_PASSWORD', label: 'SPRING_DATASOURCE_PASSWORD' },
    { key: 'JWT_SECRET', label: 'JWT_SECRET', minLength: 32 },
    { key: 'AEGIS_SECRET_KEY', label: 'AEGIS_SECRET_KEY', minLength: 32 }
  ];

  const errors = [];

  for (const item of mandatorySecrets) {
    const val = env[item.key];
    if (!val || String(val).trim() === '') {
      errors.push(`Missing mandatory secret: ${item.label}`);
    } else if (item.minLength && String(val).length < item.minLength) {
      errors.push(`Secret ${item.label} must be at least ${item.minLength} characters long (current length: ${String(val).length})`);
    }
  }

  return errors;
}

/**
 * Builds the complete environment file content.
 */
function generateEnvContent(env) {
  const errors = validateSecrets(env);
  if (errors.length > 0) {
    const msg = errors.join('\n');
    throw new Error(`Production secret validation failed:\n${msg}`);
  }

  const serverHost = String(env.SERVER_HOST).trim();
  const corsOrigins = env.CORS_ALLOWED_ORIGINS && String(env.CORS_ALLOWED_ORIGINS).trim() !== ''
    ? String(env.CORS_ALLOWED_ORIGINS).trim()
    : `http://${serverHost},https://${serverHost},http://localhost,https://localhost,http://127.0.0.1,https://127.0.0.1`;

  const lines = [
    '# =========================================================================',
    '# AEGIS Production Environment Configuration',
    '# Generated automatically by GitHub Actions CI/CD Pipeline',
    '# =========================================================================',
    'SPRING_PROFILES_ACTIVE=prod',
    'SERVER_PORT=8080',
    `SERVER_HOST=${serializeSystemdValue(serverHost, 'SERVER_HOST')}`,
    '',
    '# --- Database Configuration ---',
    `SPRING_DATASOURCE_URL=${serializeSystemdValue(env.SPRING_DATASOURCE_URL, 'SPRING_DATASOURCE_URL')}`,
    `SPRING_DATASOURCE_USERNAME=${serializeSystemdValue(env.SPRING_DATASOURCE_USERNAME, 'SPRING_DATASOURCE_USERNAME')}`,
    `SPRING_DATASOURCE_PASSWORD=${serializeSystemdValue(env.SPRING_DATASOURCE_PASSWORD, 'SPRING_DATASOURCE_PASSWORD')}`,
    '',
    '# --- Security & JWT ---',
    `JWT_SECRET=${serializeSystemdValue(env.JWT_SECRET, 'JWT_SECRET')}`,
    `AEGIS_SECRET_KEY=${serializeSystemdValue(env.AEGIS_SECRET_KEY, 'AEGIS_SECRET_KEY')}`,
    '',
    '# --- Administrative Account Seeding ---',
    `AEGIS_ADMIN_USERNAME=${serializeSystemdValue(env.AEGIS_ADMIN_USERNAME || 'Hunter', 'AEGIS_ADMIN_USERNAME')}`,
    `AEGIS_ADMIN_EMAIL=${serializeSystemdValue(env.AEGIS_ADMIN_EMAIL || 'hunter@aegis.local', 'AEGIS_ADMIN_EMAIL')}`,
    `AEGIS_ADMIN_PASSWORD=${serializeSystemdValue(env.AEGIS_ADMIN_PASSWORD || 'Dragon456#', 'AEGIS_ADMIN_PASSWORD')}`,
    '',
    '# --- CORS Allowed Origins ---',
    `CORS_ALLOWED_ORIGINS=${serializeSystemdValue(corsOrigins, 'CORS_ALLOWED_ORIGINS')}`,
    '',
    '# --- Multi-Model Gateway & Fallback Cascade ---',
    `AEGIS_MODEL_PRIMARY_PROVIDER=${serializeSystemdValue(env.AEGIS_MODEL_PRIMARY_PROVIDER || 'openai', 'AEGIS_MODEL_PRIMARY_PROVIDER')}`,
    `AEGIS_MODEL_PRIMARY_ENDPOINT=${serializeSystemdValue(env.AEGIS_MODEL_PRIMARY_ENDPOINT || 'https://api.openai.com/v1', 'AEGIS_MODEL_PRIMARY_ENDPOINT')}`,
    `AEGIS_MODEL_PRIMARY_API_KEY=${serializeSystemdValue(env.AEGIS_MODEL_PRIMARY_API_KEY, 'AEGIS_MODEL_PRIMARY_API_KEY')}`,
    `AEGIS_MODEL_PRIMARY_NAME=${serializeSystemdValue(env.AEGIS_MODEL_PRIMARY_NAME || 'gpt-4o', 'AEGIS_MODEL_PRIMARY_NAME')}`,
    '',
    `AEGIS_MODEL_FALLBACK1_PROVIDER=${serializeSystemdValue(env.AEGIS_MODEL_FALLBACK1_PROVIDER || 'groq', 'AEGIS_MODEL_FALLBACK1_PROVIDER')}`,
    `AEGIS_MODEL_FALLBACK1_ENDPOINT=${serializeSystemdValue(env.AEGIS_MODEL_FALLBACK1_ENDPOINT || 'https://api.groq.com/openai/v1', 'AEGIS_MODEL_FALLBACK1_ENDPOINT')}`,
    `AEGIS_MODEL_FALLBACK1_API_KEY=${serializeSystemdValue(env.AEGIS_MODEL_FALLBACK1_API_KEY, 'AEGIS_MODEL_FALLBACK1_API_KEY')}`,
    `AEGIS_MODEL_FALLBACK1_NAME=${serializeSystemdValue(env.AEGIS_MODEL_FALLBACK1_NAME || 'llama-3.3-70b-versatile', 'AEGIS_MODEL_FALLBACK1_NAME')}`,
    '',
    `AEGIS_MODEL_FALLBACK2_PROVIDER=${serializeSystemdValue(env.AEGIS_MODEL_FALLBACK2_PROVIDER || 'gemini', 'AEGIS_MODEL_FALLBACK2_PROVIDER')}`,
    `AEGIS_MODEL_FALLBACK2_ENDPOINT=${serializeSystemdValue(env.AEGIS_MODEL_FALLBACK2_ENDPOINT || 'https://generativelanguage.googleapis.com/v1beta/openai/', 'AEGIS_MODEL_FALLBACK2_ENDPOINT')}`,
    `AEGIS_MODEL_FALLBACK2_API_KEY=${serializeSystemdValue(env.AEGIS_MODEL_FALLBACK2_API_KEY, 'AEGIS_MODEL_FALLBACK2_API_KEY')}`,
    `AEGIS_MODEL_FALLBACK2_NAME=${serializeSystemdValue(env.AEGIS_MODEL_FALLBACK2_NAME || 'gemini-3.5-flash-lite', 'AEGIS_MODEL_FALLBACK2_NAME')}`,
    '',
    `AEGIS_MODEL_FALLBACK3_PROVIDER=${serializeSystemdValue(env.AEGIS_MODEL_FALLBACK3_PROVIDER || 'openrouter', 'AEGIS_MODEL_FALLBACK3_PROVIDER')}`,
    `AEGIS_MODEL_FALLBACK3_ENDPOINT=${serializeSystemdValue(env.AEGIS_MODEL_FALLBACK3_ENDPOINT || 'https://openrouter.ai/api/v1', 'AEGIS_MODEL_FALLBACK3_ENDPOINT')}`,
    `AEGIS_MODEL_FALLBACK3_API_KEY=${serializeSystemdValue(env.AEGIS_MODEL_FALLBACK3_API_KEY, 'AEGIS_MODEL_FALLBACK3_API_KEY')}`,
    `AEGIS_MODEL_FALLBACK3_NAME=${serializeSystemdValue(env.AEGIS_MODEL_FALLBACK3_NAME || 'meta-llama/llama-3.1-8b-instruct:free', 'AEGIS_MODEL_FALLBACK3_NAME')}`,
    ''
  ];

  return lines.join('\n');
}

/**
 * Validates secrets, generates configuration, and safely writes to output path using
 * atomic temporary-file replacement and verified 0600 file mode.
 */
function validateAndGenerate(env = process.env, customOutputPath = null, throwOnError = false) {
  const outputPath = customOutputPath || env.OUTPUT_PATH || path.join(__dirname, '../../deploy-package/production.env');

  let content;
  try {
    content = generateEnvContent(env);
  } catch (err) {
    console.error('====================================================');
    console.error(' FATAL: Production Secret Validation Failed');
    console.error('====================================================');
    console.error(err.message);
    console.error('Ensure all required secrets are configured in GitHub Repository Settings.');
    if (throwOnError) {
      throw err;
    }
    process.exit(1);
  }

  const targetDir = path.dirname(outputPath);
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true, mode: 0o755 });
  }

  // Ensure directory permissions allow traversal (0755)
  try {
    fs.chmodSync(targetDir, 0o755);
  } catch (_) {
    // Non-fatal if OS doesn't support chmod on directory (e.g. Windows)
  }

  // Atomic write pattern:
  // Write to a temporary file in the same directory, enforce 0600 permissions,
  // verify integrity, and atomically rename over destination.
  // This guarantees an existing production.env is never prematurely deleted
  // or left partially written if an error occurs.
  const tempPath = path.join(targetDir, `.env.tmp.${process.pid}.${Date.now()}`);

  try {
    fs.writeFileSync(tempPath, content, { mode: 0o600, flag: 'wx' });

    // Explicitly enforce chmod 0600 on the temp file
    try {
      fs.chmodSync(tempPath, 0o600);
    } catch (e) {
      throw new Error(`Failed to set 0600 mode on temp file: ${e.message}`);
    }

    // Verify temp file permissions on POSIX systems before atomic move
    if (process.platform !== 'win32') {
      const stats = fs.statSync(tempPath);
      const actualMode = stats.mode & 0o777;
      if (actualMode !== 0o600) {
        throw new Error(`Insecure permissions detected on temp file: ${actualMode.toString(8)}, expected 0600.`);
      }
    }

    // Atomically replace destination file
    fs.renameSync(tempPath, outputPath);

    // Verify final file mode
    try {
      fs.chmodSync(outputPath, 0o600);
    } catch (_) {}

    if (process.platform !== 'win32') {
      const finalStats = fs.statSync(outputPath);
      const finalMode = finalStats.mode & 0o777;
      if (finalMode !== 0o600) {
        throw new Error(`Insecure permissions detected on final output file: ${finalMode.toString(8)}, expected 0600.`);
      }
    }
  } catch (err) {
    // Clean up temporary file if it was left behind
    if (fs.existsSync(tempPath)) {
      try {
        fs.unlinkSync(tempPath);
      } catch (_) {}
    }
    console.error(`FATAL: Failed to write environment file securely: ${err.message}`);
    if (throwOnError) {
      throw err;
    }
    process.exit(1);
  }

  const stat = fs.statSync(outputPath);
  console.log(`[CI/CD] Validated secrets and generated secure production environment file at ${outputPath}`);
  console.log(`[CI/CD] Restrictive file permissions enforced (0600). File size: ${stat.size} bytes.`);
}

if (require.main === module) {
  validateAndGenerate();
}

module.exports = {
  serializeSystemdValue,
  validateSecrets,
  generateEnvContent,
  validateAndGenerate
};
