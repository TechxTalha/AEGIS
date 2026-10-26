#!/usr/bin/env bash
set -Eeuo pipefail

# =========================================================================
# AEGIS Automated Remote Production Deployment Script
# Safe release activation, checksum validation, and atomic rollback.
# =========================================================================

RELEASE_ID="${1:?Missing release ID argument}"
STAGING_DIR="${2:?Missing staging directory argument}"
SERVER_HOST="${3:-${SERVER_HOST:-}}"

TARGET_BACKEND_BASE="/opt/aegis"
TARGET_FRONTEND_BASE="/var/www/aegis"
NEW_BACKEND_RELEASE="$TARGET_BACKEND_BASE/releases/$RELEASE_ID"
NEW_FRONTEND_RELEASE="$TARGET_FRONTEND_BASE/releases/$RELEASE_ID"

# Deployment state tracking
ACTIVATION_STARTED=false
ROLLBACK_IN_PROGRESS=false
DEPLOYMENT_SUCCESSFUL=false
PREV_RELEASE_ID=""

echo "======================================================="
echo " AEGIS Atomic Release Deployment: $RELEASE_ID"
echo "======================================================="

# --- Rollback Implementation ---
rollback() {
    # Guard against recursive rollback execution
    if [ "$ROLLBACK_IN_PROGRESS" = "true" ]; then
        echo "Warning: Rollback already in progress; preventing recursive loop."
        return
    fi
    ROLLBACK_IN_PROGRESS=true

    echo "======================================================="
    echo " CRITICAL FAILURE: Initiating Application Rollback"
    echo "======================================================="

    # Output recent service logs for immediate diagnosis (avoiding secrets)
    echo "Recent service logs (last 50 lines):"
    journalctl -u aegis-backend -n 50 --no-pager || true

    if [ -n "$PREV_RELEASE_ID" ] && [ -d "$TARGET_BACKEND_BASE/releases/$PREV_RELEASE_ID" ]; then
        echo "Restoring previous release: $PREV_RELEASE_ID..."

        # Revert backend symlinks atomically
        ln -sfn "$TARGET_BACKEND_BASE/releases/$PREV_RELEASE_ID" "$TARGET_BACKEND_BASE/current_tmp"
        mv -Tf "$TARGET_BACKEND_BASE/current_tmp" "$TARGET_BACKEND_BASE/current"

        ln -sfn "$TARGET_BACKEND_BASE/current/backend.jar" "$TARGET_BACKEND_BASE/backend.jar_tmp"
        mv -Tf "$TARGET_BACKEND_BASE/backend.jar_tmp" "$TARGET_BACKEND_BASE/backend.jar"

        ln -sfn "$TARGET_BACKEND_BASE/current/.env" "$TARGET_BACKEND_BASE/.env_tmp"
        mv -Tf "$TARGET_BACKEND_BASE/.env_tmp" "$TARGET_BACKEND_BASE/.env"

        # Revert frontend symlinks atomically
        if [ -d "$TARGET_FRONTEND_BASE/releases/$PREV_RELEASE_ID" ]; then
            ln -sfn "$TARGET_FRONTEND_BASE/releases/$PREV_RELEASE_ID" "$TARGET_FRONTEND_BASE/current_tmp"
            mv -Tf "$TARGET_FRONTEND_BASE/current_tmp" "$TARGET_FRONTEND_BASE/current"

            ln -sfn "$TARGET_FRONTEND_BASE/current" "$TARGET_FRONTEND_BASE/dist_tmp"
            mv -Tf "$TARGET_FRONTEND_BASE/dist_tmp" "$TARGET_FRONTEND_BASE/dist"
        fi

        # Restart backend service
        systemctl restart aegis-backend || true

        # Test and reload Nginx
        if nginx -t >/dev/null 2>&1; then
            systemctl reload nginx || true
        fi

        # Verify restored release health
        echo "Verifying health of restored release ($PREV_RELEASE_ID)..."
        local restored_ok=false
        for r in $(seq 1 10); do
            sleep 3
            local health_json
            health_json=$(curl -s -m 4 http://127.0.0.1:8080/actuator/health || true)
            if echo "$health_json" | grep -q '"status":"UP"'; then
                restored_ok=true
                break
            fi
        done

        if [ "$restored_ok" = "true" ]; then
            echo "✓ Rollback verified: Previous release ($PREV_RELEASE_ID) restored and healthy."
        else
            echo "FATAL: Rollback executed but restored release failed health check!"
        fi
    else
        echo "======================================================="
        echo " Notice: No previous working release available for rollback."
        echo " Initial deployment failed. Leaving server in documented, recoverable state:"
        echo " - Release artifacts preserved at: $NEW_BACKEND_RELEASE and $NEW_FRONTEND_RELEASE"
        echo " - Service stopped to prevent crash loops."
        echo " - Staging directory cleared."
        echo " Check journalctl -u aegis-backend for runtime error details."
        echo "======================================================="
        systemctl stop aegis-backend || true
    fi

    # Mark failed release to ensure it is not picked as usable
    touch "$NEW_BACKEND_RELEASE/FAILED" 2>/dev/null || true

    # Safely clean up staging directory
    if [ -n "$STAGING_DIR" ] && [ -d "$STAGING_DIR" ]; then
        rm -rf "$STAGING_DIR" || true
    fi

    exit 1
}

# Trap unexpected script errors after activation has begun
handle_exit() {
    local exit_code=$?
    if [ $exit_code -ne 0 ] && [ "$ACTIVATION_STARTED" = "true" ] && [ "$ROLLBACK_IN_PROGRESS" = "false" ] && [ "$DEPLOYMENT_SUCCESSFUL" = "false" ]; then
        echo "FATAL: Unhandled failure (exit code $exit_code) encountered after release activation began."
        rollback
    fi
}
trap handle_exit EXIT

# --- Phase 1: Environment & Dependency Validation ---
echo "[1/8] Verifying server environment and prerequisites..."

if ! command -v java >/dev/null 2>&1; then
    echo "FATAL: Java is not installed or not in PATH."
    exit 1
fi

JAVA_VERSION_RAW=$(java -version 2>&1 | awk -F '"' '/version/ {print $2}')
JAVA_MAJOR=$(echo "$JAVA_VERSION_RAW" | awk -F '.' '{print $1}')
if [ -z "$JAVA_MAJOR" ] || [ "$JAVA_MAJOR" -lt 21 ]; then
    echo "FATAL: Java version must be 21 or higher. Detected version: $JAVA_VERSION_RAW"
    exit 1
fi
echo "✓ Java runtime verified: $JAVA_VERSION_RAW"

if ! command -v nginx >/dev/null 2>&1; then
    echo "FATAL: Nginx is not installed or not in PATH."
    exit 1
fi
echo "✓ Nginx web server verified"

# Ensure system user and group exist
if ! id aegis >/dev/null 2>&1; then
    echo "Creating system user 'aegis'..."
    useradd -r -s /bin/false -d /opt/aegis aegis || true
fi
if ! getent group www-data >/dev/null 2>&1; then
    groupadd www-data || true
fi

# Ensure systemd service unit is installed or updated
if [ -f "$STAGING_DIR/aegis-backend.service" ]; then
    if [ ! -f /etc/systemd/system/aegis-backend.service ] || ! cmp -s "$STAGING_DIR/aegis-backend.service" /etc/systemd/system/aegis-backend.service; then
        echo "Installing/updating systemd service unit /etc/systemd/system/aegis-backend.service..."
        cp "$STAGING_DIR/aegis-backend.service" /etc/systemd/system/aegis-backend.service
        chmod 644 /etc/systemd/system/aegis-backend.service
        systemctl daemon-reload
        systemctl enable aegis-backend || true
        echo "✓ Systemd service unit configured and enabled"
    fi
fi

# --- Phase 2: Staged Artifacts & Checksum Validation ---
echo "[2/8] Validating staged artifacts and SHA-256 checksums..."

if [ ! -d "$STAGING_DIR" ]; then
    echo "FATAL: Staging directory $STAGING_DIR does not exist."
    exit 1
fi

STAGED_JAR="$STAGING_DIR/backend/backend-0.0.1-SNAPSHOT.jar"
STAGED_SHA="$STAGING_DIR/backend/backend.sha256"
STAGED_ENV="$STAGING_DIR/production.env"
STAGED_FE_DIR="$STAGING_DIR/frontend"

# Refuse to overwrite an existing release directory for the same release ID
if [ -d "$NEW_BACKEND_RELEASE" ] || [ -d "$NEW_FRONTEND_RELEASE" ]; then
    echo "FATAL: Release directory already exists for release ID '$RELEASE_ID'. Refusing to overwrite existing release."
    exit 1
fi

if [ ! -f "$STAGED_JAR" ] || [ ! -s "$STAGED_JAR" ]; then
    echo "FATAL: Staged backend JAR is missing or empty."
    exit 1
fi

JAR_SIZE=$(stat -c%s "$STAGED_JAR" 2>/dev/null || wc -c < "$STAGED_JAR")
if [ "$JAR_SIZE" -lt 1000000 ]; then
    echo "FATAL: Staged backend JAR is suspiciously small ($JAR_SIZE bytes). Corrupt build artifact."
    exit 1
fi

# Mandatory SHA-256 validation: backend.sha256 must exist, be non-empty, and contain a valid 64-hex digest
if [ ! -f "$STAGED_SHA" ] || [ ! -s "$STAGED_SHA" ]; then
    echo "FATAL: backend.sha256 is missing or empty. Artifact verification cannot proceed."
    exit 1
fi

EXPECTED_HASH=$(awk '{print $1}' "$STAGED_SHA" | tr -d '[:space:]')
if ! echo "$EXPECTED_HASH" | grep -Eq '^[0-9a-fA-F]{64}$'; then
    echo "FATAL: backend.sha256 does not contain a valid 64-character SHA-256 hexadecimal digest: '$EXPECTED_HASH'"
    exit 1
fi

ACTUAL_HASH=$(sha256sum "$STAGED_JAR" | awk '{print $1}' | tr -d '[:space:]')
if [ "$EXPECTED_HASH" != "$ACTUAL_HASH" ]; then
    echo "FATAL: Checksum mismatch! Expected: $EXPECTED_HASH, Actual: $ACTUAL_HASH"
    exit 1
fi
echo "✓ SHA-256 checksum validated: $ACTUAL_HASH"

if [ ! -f "$STAGED_ENV" ] || [ ! -s "$STAGED_ENV" ]; then
    echo "FATAL: Staged production environment configuration is missing or empty."
    exit 1
fi

# Discover SERVER_HOST from staged env if not provided
if [ -z "$SERVER_HOST" ]; then
    SERVER_HOST=$(grep "^SERVER_HOST=" "$STAGED_ENV" 2>/dev/null | cut -d'=' -f2- | tr -d '"' || true)
fi
if [ -z "$SERVER_HOST" ]; then
    SERVER_HOST="127.0.0.1"
fi

# Verify mandatory environment keys are present without leaking sensitive values
REQUIRED_ENV_KEYS=(
    "SPRING_PROFILES_ACTIVE"
    "SERVER_PORT"
    "SPRING_DATASOURCE_URL"
    "SPRING_DATASOURCE_USERNAME"
    "SPRING_DATASOURCE_PASSWORD"
    "JWT_SECRET"
    "AEGIS_SECRET_KEY"
)

for req_key in "${REQUIRED_ENV_KEYS[@]}"; do
    if ! grep -q "^${req_key}=" "$STAGED_ENV"; then
        echo "FATAL: Staged production environment configuration is missing required key: ${req_key}"
        exit 1
    fi
done
echo "✓ Staged production environment configuration validated"

if [ ! -f "$STAGED_FE_DIR/index.html" ] || [ ! -s "$STAGED_FE_DIR/index.html" ]; then
    echo "FATAL: Staged frontend bundle is missing index.html or empty."
    exit 1
fi

if [ ! -d "$STAGED_FE_DIR/assets" ]; then
    echo "FATAL: Staged frontend bundle is missing assets directory."
    exit 1
fi
echo "✓ Staged artifacts verified successfully"

# --- Phase 3: Stage New Versioned Release Directories ---
echo "[3/8] Preparing versioned release directories..."

mkdir -p "$TARGET_BACKEND_BASE/releases" "$TARGET_BACKEND_BASE/logs"
mkdir -p "$TARGET_FRONTEND_BASE/releases"
mkdir -p "$NEW_BACKEND_RELEASE" "$NEW_FRONTEND_RELEASE"
chown aegis:aegis "$TARGET_BACKEND_BASE" 2>/dev/null || true
chown aegis:www-data "$TARGET_FRONTEND_BASE" 2>/dev/null || true

# Copy backend release artifacts
cp "$STAGED_JAR" "$NEW_BACKEND_RELEASE/backend.jar"
cp "$STAGED_ENV" "$NEW_BACKEND_RELEASE/.env"
cp "$STAGED_SHA" "$NEW_BACKEND_RELEASE/backend.sha256"

# Copy frontend release artifacts
cp -r "$STAGED_FE_DIR/"* "$NEW_FRONTEND_RELEASE/"

# Record deployment metadata
echo "RELEASE_ID=$RELEASE_ID" > "$NEW_BACKEND_RELEASE/RELEASE_INFO"
echo "DEPLOYED_AT=$(date -u +"%Y-%m-%dT%H:%M:%SZ")" >> "$NEW_BACKEND_RELEASE/RELEASE_INFO"

# Secure permissions
chmod 600 "$NEW_BACKEND_RELEASE/.env"
chmod 755 "$NEW_BACKEND_RELEASE/backend.jar"
chmod -R 755 "$NEW_FRONTEND_RELEASE"
chown -R aegis:aegis "$NEW_BACKEND_RELEASE" "$TARGET_BACKEND_BASE/logs"
chown -R aegis:www-data "$NEW_FRONTEND_RELEASE"
echo "✓ Release $RELEASE_ID staged and permissions secured"

# --- Phase 4: Identify Previous Working Release for Rollback ---
echo "[4/8] Capturing rollback reference..."

if [ -L "$TARGET_BACKEND_BASE/current" ]; then
    CURRENT_LINK=$(readlink -f "$TARGET_BACKEND_BASE/current" 2>/dev/null || true)
    if [ -d "$CURRENT_LINK" ]; then
        PREV_RELEASE_ID=$(basename "$CURRENT_LINK")
    fi
elif [ -f "$TARGET_BACKEND_BASE/backend.jar" ] && [ ! -L "$TARGET_BACKEND_BASE/backend.jar" ]; then
    # Legacy migration: capture unversioned files into a baseline rollback release
    echo "Migrating legacy unversioned files into baseline rollback release..."
    PREV_RELEASE_ID="legacy_$(date +%Y%m%d%H%M%S)"
    MIGRATION_BACKEND="$TARGET_BACKEND_BASE/releases/$PREV_RELEASE_ID"
    MIGRATION_FRONTEND="$TARGET_FRONTEND_BASE/releases/$PREV_RELEASE_ID"
    mkdir -p "$MIGRATION_BACKEND" "$MIGRATION_FRONTEND"
    cp "$TARGET_BACKEND_BASE/backend.jar" "$MIGRATION_BACKEND/backend.jar"
    [ -f "$TARGET_BACKEND_BASE/.env" ] && cp "$TARGET_BACKEND_BASE/.env" "$MIGRATION_BACKEND/.env"
    if [ -d "$TARGET_FRONTEND_BASE/dist" ] && [ ! -L "$TARGET_FRONTEND_BASE/dist" ]; then
        cp -r "$TARGET_FRONTEND_BASE/dist/"* "$MIGRATION_FRONTEND/" 2>/dev/null || true
    fi
    chown -R aegis:aegis "$MIGRATION_BACKEND"
    chown -R aegis:www-data "$MIGRATION_FRONTEND"
fi

if [ -n "$PREV_RELEASE_ID" ]; then
    echo "✓ Rollback target identified: $PREV_RELEASE_ID"
else
    echo "Notice: Initial deployment (no prior release found for rollback)."
fi

# --- Phase 5: Atomic Release Activation ---
echo "[5/8] Activating release via atomic symlink switch..."
ACTIVATION_STARTED=true

# Backend symlink activation
ln -sfn "$NEW_BACKEND_RELEASE" "$TARGET_BACKEND_BASE/current_tmp"
mv -Tf "$TARGET_BACKEND_BASE/current_tmp" "$TARGET_BACKEND_BASE/current"

ln -sfn "$TARGET_BACKEND_BASE/current/backend.jar" "$TARGET_BACKEND_BASE/backend.jar_tmp"
mv -Tf "$TARGET_BACKEND_BASE/backend.jar_tmp" "$TARGET_BACKEND_BASE/backend.jar"

ln -sfn "$TARGET_BACKEND_BASE/current/.env" "$TARGET_BACKEND_BASE/.env_tmp"
mv -Tf "$TARGET_BACKEND_BASE/.env_tmp" "$TARGET_BACKEND_BASE/.env"

# Frontend symlink activation
# Handle legacy non-symlink dist directory if present
if [ -d "$TARGET_FRONTEND_BASE/dist" ] && [ ! -L "$TARGET_FRONTEND_BASE/dist" ]; then
    rm -rf "$TARGET_FRONTEND_BASE/dist"
fi

ln -sfn "$NEW_FRONTEND_RELEASE" "$TARGET_FRONTEND_BASE/current_tmp"
mv -Tf "$TARGET_FRONTEND_BASE/current_tmp" "$TARGET_FRONTEND_BASE/current"

ln -sfn "$TARGET_FRONTEND_BASE/current" "$TARGET_FRONTEND_BASE/dist_tmp"
mv -Tf "$TARGET_FRONTEND_BASE/dist_tmp" "$TARGET_FRONTEND_BASE/dist"

echo "✓ Symlinks switched atomically to release $RELEASE_ID"

# --- Phase 6: Service Restart & Nginx Reload ---
echo "[6/8] Restarting backend service and reloading Nginx..."

if ! systemctl restart aegis-backend; then
    echo "FATAL: Failed to restart aegis-backend service."
    rollback
fi

if ! nginx -t; then
    echo "FATAL: Nginx configuration test failed."
    rollback
fi

if ! systemctl reload nginx; then
    echo "FATAL: Failed to reload Nginx configuration."
    rollback
fi
echo "✓ Services restarted and reloaded successfully"

# --- Phase 7: Production Health & Verification ---
echo "[7/8] Running production health and readiness checks..."

# Backend health verification via Spring Boot Actuator
BACKEND_UP=false
for attempt in $(seq 1 30); do
    sleep 3
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" -m 5 http://127.0.0.1:8080/actuator/health || true)
    if [ "$HTTP_CODE" = "200" ]; then
        HEALTH_RESPONSE=$(curl -s -m 5 http://127.0.0.1:8080/actuator/health || true)
        if echo "$HEALTH_RESPONSE" | grep -q '"status":"UP"'; then
            BACKEND_UP=true
            echo "✓ Backend health check passed on attempt $attempt (HTTP 200, status: UP)"
            break
        fi
    fi
    echo "Attempt $attempt/30: Backend not healthy yet (HTTP $HTTP_CODE)..."
done

if [ "$BACKEND_UP" != "true" ]; then
    echo "FATAL: Backend health verification failed after 90 seconds."
    rollback
fi

# Mandatory frontend verification
echo "Validating active frontend distribution..."
if [ ! -s "$TARGET_FRONTEND_BASE/dist/index.html" ]; then
    echo "FATAL: Active frontend dist/index.html is missing or empty."
    rollback
fi

# Extract at least one actual referenced static asset from index.html
REFERENCED_ASSET=$(grep -oE 'assets/[^"'\'' ]+\.(js|css)' "$TARGET_FRONTEND_BASE/dist/index.html" | head -n 1 || true)
if [ -z "$REFERENCED_ASSET" ] && [ -d "$TARGET_FRONTEND_BASE/dist/assets" ]; then
    FIRST_ASSET=$(ls -1 "$TARGET_FRONTEND_BASE/dist/assets" 2>/dev/null | head -n 1 || true)
    if [ -n "$FIRST_ASSET" ]; then
        REFERENCED_ASSET="assets/$FIRST_ASSET"
    fi
fi

if [ -z "$REFERENCED_ASSET" ] || [ ! -f "$TARGET_FRONTEND_BASE/dist/$REFERENCED_ASSET" ]; then
    echo "FATAL: Unable to resolve referenced static asset in frontend distribution."
    rollback
fi
echo "✓ Verified physical static asset: $REFERENCED_ASSET"

# Helper function to test an Nginx HTTP route with hostname and HTTPS/redirect support
verify_nginx_route() {
    local target_path="$1"
    local check_label="$2"
    local expected_substr="${3:-}"

    echo "Probing Nginx route for $check_label ($target_path)..."

    local resolved_ok=false
    local last_code=""
    local body=""
    local response=""

    # Build curl flags to resolve configured SERVER_HOST to loopback 127.0.0.1
    # This ensures virtual host matching, follows HTTP->HTTPS redirects locally,
    # and allows self-signed/internal SSL certificates via -k.
    local curl_resolve_flags=()
    if [[ "$SERVER_HOST" =~ [a-zA-Z] ]]; then
        curl_resolve_flags=(--resolve "${SERVER_HOST}:80:127.0.0.1" --resolve "${SERVER_HOST}:443:127.0.0.1")
    fi

    # Strategy 1: Using SERVER_HOST with Host header and loopback resolution
    local url="http://${SERVER_HOST}/${target_path#/}"
    response=$(curl -s -k -L -m 8 -w "\n%{http_code}" "${curl_resolve_flags[@]}" -H "Host: ${SERVER_HOST}" "$url" 2>/dev/null || true)
    last_code=$(echo "$response" | tail -n 1)
    body=$(echo "$response" | sed '$d')

    if [ "$last_code" = "200" ]; then
        if [ -z "$expected_substr" ] || echo "$body" | grep -q "$expected_substr"; then
            resolved_ok=true
        fi
    fi

    # Strategy 2: Fallback to direct 127.0.0.1 with Host header
    if [ "$resolved_ok" != "true" ]; then
        url="http://127.0.0.1/${target_path#/}"
        response=$(curl -s -k -L -m 8 -w "\n%{http_code}" "${curl_resolve_flags[@]}" -H "Host: ${SERVER_HOST}" "$url" 2>/dev/null || true)
        last_code=$(echo "$response" | tail -n 1)
        body=$(echo "$response" | sed '$d')

        if [ "$last_code" = "200" ]; then
            if [ -z "$expected_substr" ] || echo "$body" | grep -q "$expected_substr"; then
                resolved_ok=true
            fi
        fi
    fi

    # Strategy 3: Direct 127.0.0.1 without custom Host header (default Nginx server block)
    if [ "$resolved_ok" != "true" ]; then
        url="http://127.0.0.1/${target_path#/}"
        response=$(curl -s -k -L -m 8 -w "\n%{http_code}" "$url" 2>/dev/null || true)
        last_code=$(echo "$response" | tail -n 1)
        body=$(echo "$response" | sed '$d')

        if [ "$last_code" = "200" ]; then
            if [ -z "$expected_substr" ] || echo "$body" | grep -q "$expected_substr"; then
                resolved_ok=true
            fi
        fi
    fi

    if [ "$resolved_ok" = "true" ]; then
        echo "✓ Route verified for $check_label (HTTP 200)"
        return 0
    else
        echo "FATAL: Route verification failed for $check_label ($target_path). Last response code: ${last_code:-none}"
        return 1
    fi
}

# Mandatory check: Frontend root index.html via Nginx
if ! verify_nginx_route "/" "Frontend Root" "<div id=\"root\""; then
    echo "FATAL: Frontend root route verification failed."
    rollback
fi

# Mandatory check: Referenced static asset via Nginx
if ! verify_nginx_route "/$REFERENCED_ASSET" "Frontend Static Asset ($REFERENCED_ASSET)" ""; then
    echo "FATAL: Frontend static asset route verification failed for $REFERENCED_ASSET."
    rollback
fi

echo "✓ Frontend routing and static assets verified successfully"
DEPLOYMENT_SUCCESSFUL=true

# --- Phase 8: Retention Cleanup ---
echo "[8/8] Cleaning up staging directory and pruning old releases..."

# Safely prune releases keeping active + 4 previous usable releases (5 total)
prune_releases() {
    local base_dir="${1:?Missing base directory for pruning}"
    local active_release="${2:?Missing active release ID}"
    local rollback_target="${3:-}"

    local releases_dir="$base_dir/releases"
    if [ ! -d "$releases_dir" ]; then
        return 0
    fi

    # Validate that base_dir is strictly within expected paths to prevent accidental deletion
    case "$base_dir" in
        /opt/aegis|/var/www/aegis) ;;
        *)
            echo "ERROR: Refusing to prune releases in unexpected path: $base_dir"
            return 1
            ;;
    esac

    echo "Pruning older releases in $releases_dir..."

    # Resolve active canonical release directory from symlink if available
    local active_canonical=""
    if [ -L "$base_dir/current" ]; then
        active_canonical=$(readlink -f "$base_dir/current" 2>/dev/null || true)
    fi

    # Read all release directories sorted by name descending (timestamp based)
    local all_releases=()
    while IFS= read -r rel; do
        [ -n "$rel" ] && all_releases+=("$rel")
    done < <(find "$releases_dir" -mindepth 1 -maxdepth 1 -type d -exec basename {} \; | sort -r)

    local kept_count=0
    for rel_id in "${all_releases[@]}"; do
        local rel_path="$releases_dir/$rel_id"

        # Protection Rule 1: NEVER delete the currently active release
        if [ "$rel_id" = "$active_release" ] || { [ -n "$active_canonical" ] && [ "$rel_path" = "$active_canonical" ]; }; then
            echo "  [Keep] Active release: $rel_id"
            continue
        fi

        # Protection Rule 2: NEVER delete the rollback target
        if [ -n "$rollback_target" ] && [ "$rel_id" = "$rollback_target" ]; then
            echo "  [Keep] Rollback target: $rel_id"
            continue
        fi

        # If release was marked FAILED, clean it up immediately
        if [ -f "$rel_path/FAILED" ]; then
            echo "  [Prune] Failed release: $rel_id"
            rm -rf "$rel_path"
            continue
        fi

        # Retain previous usable releases up to 4
        kept_count=$((kept_count + 1))
        if [ "$kept_count" -le 4 ]; then
            echo "  [Keep] Previous usable release ($kept_count/4): $rel_id"
        else
            echo "  [Prune] Older release ($kept_count > 4): $rel_id"
            rm -rf "$rel_path"
        fi
    done
}

prune_releases "$TARGET_BACKEND_BASE" "$RELEASE_ID" "$PREV_RELEASE_ID"
prune_releases "$TARGET_FRONTEND_BASE" "$RELEASE_ID" "$PREV_RELEASE_ID"

# Remove staging directory safely
if [ -n "$STAGING_DIR" ] && [ -d "$STAGING_DIR" ]; then
    rm -rf "$STAGING_DIR"
fi

echo "======================================================="
echo " 🎉 Release $RELEASE_ID deployed and verified healthy!"
echo "======================================================="
