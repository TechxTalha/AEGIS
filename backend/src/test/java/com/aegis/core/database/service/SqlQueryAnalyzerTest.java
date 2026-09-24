package com.aegis.core.database.service;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class SqlQueryAnalyzerTest {

    private final SqlQueryAnalyzer analyzer = new SqlQueryAnalyzer();

    @Test
    void testSafeQueries() {
        assertTrue(analyzer.isSafeReadOnlyQuery("SELECT * FROM users"));
        assertTrue(analyzer.isSafeReadOnlyQuery("select id, name from products where price > 100"));
        assertTrue(analyzer.isSafeReadOnlyQuery("SHOW TABLES"));
        assertTrue(analyzer.isSafeReadOnlyQuery("describe users"));
        assertTrue(analyzer.isSafeReadOnlyQuery("EXPLAIN SELECT * FROM orders"));
        assertTrue(analyzer.isSafeReadOnlyQuery("SELECT a, b FROM table1 JOIN table2 ON table1.id = table2.id"));
        assertTrue(analyzer.isSafeReadOnlyQuery("WITH cte AS (SELECT * FROM foo) SELECT * FROM cte"));
    }

    @Test
    void testDestructiveQueries() {
        assertFalse(analyzer.isSafeReadOnlyQuery("INSERT INTO users (name) VALUES ('test')"));
        assertFalse(analyzer.isSafeReadOnlyQuery("UPDATE users SET name = 'test'"));
        assertFalse(analyzer.isSafeReadOnlyQuery("DELETE FROM users"));
        assertFalse(analyzer.isSafeReadOnlyQuery("DROP TABLE users"));
        assertFalse(analyzer.isSafeReadOnlyQuery("ALTER TABLE users ADD COLUMN age INT"));
        assertFalse(analyzer.isSafeReadOnlyQuery("TRUNCATE TABLE logs"));
        assertFalse(analyzer.isSafeReadOnlyQuery("GRANT ALL PRIVILEGES ON *.* TO 'user'"));
        assertFalse(analyzer.isSafeReadOnlyQuery("REVOKE ALL ON db.* FROM 'user'"));
        assertFalse(analyzer.isSafeReadOnlyQuery("CALL my_procedure()"));
        assertFalse(analyzer.isSafeReadOnlyQuery("EXEC my_procedure"));
        assertFalse(analyzer.isSafeReadOnlyQuery("EXECUTE my_procedure"));
        assertFalse(analyzer.isSafeReadOnlyQuery("SELECT * INTO new_table FROM users"));
        assertFalse(analyzer.isSafeReadOnlyQuery("RENAME TABLE users TO old_users"));
        assertFalse(analyzer.isSafeReadOnlyQuery("LOCK TABLES users WRITE"));
    }

    @Test
    void testSneakyQueries() {
        // Sub-queries with destructive keywords
        assertFalse(analyzer.isSafeReadOnlyQuery("SELECT * FROM users WHERE name = 'DROP TABLE'")); // Extremely conservative, blocks literal string match
        assertFalse(analyzer.isSafeReadOnlyQuery("select * from (insert into foo values (1)) as t"));
        
        // Missing SELECT keyword at start
        assertFalse(analyzer.isSafeReadOnlyQuery("; SELECT * FROM users")); // Blocked due to semi-colon start
        assertFalse(analyzer.isSafeReadOnlyQuery("/* comment */ SELECT * FROM users")); // Blocked due to strict start requirement
    }

    @Test
    void testEmptyOrNull() {
        assertFalse(analyzer.isSafeReadOnlyQuery(null));
        assertFalse(analyzer.isSafeReadOnlyQuery(""));
        assertFalse(analyzer.isSafeReadOnlyQuery("   "));
    }
}
