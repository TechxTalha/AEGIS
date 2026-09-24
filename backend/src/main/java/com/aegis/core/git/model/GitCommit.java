package com.aegis.core.git.model;

public class GitCommit {
    private String hash;
    private String author;
    private String date;
    private String message;

    public GitCommit() {}

    public GitCommit(String hash, String author, String date, String message) {
        this.hash = hash;
        this.author = author;
        this.date = date;
        this.message = message;
    }

    public String getHash() { return hash; }
    public void setHash(String hash) { this.hash = hash; }
    public String getAuthor() { return author; }
    public void setAuthor(String author) { this.author = author; }
    public String getDate() { return date; }
    public void setDate(String date) { this.date = date; }
    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }
}
