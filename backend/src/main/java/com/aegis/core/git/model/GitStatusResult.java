package com.aegis.core.git.model;

import java.util.List;

public class GitStatusResult {
    private String branch;
    private List<String> modified;
    private List<String> untracked;
    private List<String> staged;
    private boolean isClean;

    public GitStatusResult() {}

    public GitStatusResult(String branch, List<String> modified, List<String> untracked, List<String> staged, boolean isClean) {
        this.branch = branch;
        this.modified = modified;
        this.untracked = untracked;
        this.staged = staged;
        this.isClean = isClean;
    }

    public String getBranch() { return branch; }
    public void setBranch(String branch) { this.branch = branch; }
    public List<String> getModified() { return modified; }
    public void setModified(List<String> modified) { this.modified = modified; }
    public List<String> getUntracked() { return untracked; }
    public void setUntracked(List<String> untracked) { this.untracked = untracked; }
    public List<String> getStaged() { return staged; }
    public void setStaged(List<String> staged) { this.staged = staged; }
    public boolean isClean() { return isClean; }
    public void setClean(boolean clean) { isClean = clean; }
}
