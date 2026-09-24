package com.aegis.core.database.service;

import org.springframework.stereotype.Component;

import java.util.regex.Pattern;

@Component
public class SqlQueryAnalyzer {

    // Matches destructive operations or anything that's not clearly a read statement.
    private static final Pattern DESTRUCTIVE_PATTERN = Pattern.compile(
            "(?i)\\b(INSERT|UPDATE|DELETE|DROP|ALTER|TRUNCATE|GRANT|REVOKE|EXEC|EXECUTE|CALL|CREATE|REPLACE|MERGE|UPSERT|INTO|RENAME|LOCK)\\b"
    );

    public boolean isSafeReadOnlyQuery(String query) {
        if (query == null || query.trim().isEmpty()) {
            return false;
        }

        String normalized = query.trim().toUpperCase();

        // Strictly must start with a read keyword (ignoring leading whitespace/comments might be needed in a full parser, 
        // but for safety, we require it to start directly with SELECT/SHOW/DESCRIBE/EXPLAIN)
        if (!(normalized.startsWith("SELECT ") || 
              normalized.startsWith("SHOW ") || 
              normalized.startsWith("DESCRIBE ") || 
              normalized.startsWith("EXPLAIN ") || 
              normalized.startsWith("WITH "))) {
            return false;
        }

        // Ensure no destructive keywords exist anywhere in the query.
        // Even if someone does "SELECT * FROM users WHERE name = 'DROP TABLE'", 
        // it will be blocked by this regex. This is extremely conservative but safe.
        if (DESTRUCTIVE_PATTERN.matcher(normalized).find()) {
            return false;
        }

        return true;
    }
}
