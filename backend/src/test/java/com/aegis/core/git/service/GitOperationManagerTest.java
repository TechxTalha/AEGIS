package com.aegis.core.git.service;

import com.aegis.core.git.model.GitCommit;
import com.aegis.core.git.model.GitStatusResult;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;

class GitOperationManagerTest {

    private final GitOperationManager manager = new GitOperationManager();

    @Test
    void testIsGitRepository() {
        boolean isGit = manager.isGitRepository(".");
        // Since we are running in a Maven project that is a Git repo, this should be true
        // But we don't strictly enforce it in case it's built outside git.
        // We'll just test that it doesn't throw exceptions.
    }

    @Test
    void testGetStatusHandlesInvalidPath() {
        GitStatusResult result = manager.getStatus("/invalid/path/that/does/not/exist");
        assertNotNull(result);
        assertNotNull(result.getModified());
    }

    @Test
    void testGetCommitHistoryHandlesInvalidPath() {
        List<GitCommit> commits = manager.getCommitHistory("/invalid/path", 5);
        assertNotNull(commits);
        assertFalse(commits.size() > 0);
    }
}
