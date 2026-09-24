package com.aegis.core.web.model;

public class WebPageContent {
    private String url;
    private String title;
    private String content;
    private boolean sourceTracked;

    public WebPageContent() {}

    public WebPageContent(String url, String title, String content, boolean sourceTracked) {
        this.url = url;
        this.title = title;
        this.content = content;
        this.sourceTracked = sourceTracked;
    }

    public String getUrl() { return url; }
    public void setUrl(String url) { this.url = url; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getContent() { return content; }
    public void setContent(String content) { this.content = content; }
    public boolean isSourceTracked() { return sourceTracked; }
    public void setSourceTracked(boolean sourceTracked) { this.sourceTracked = sourceTracked; }
}
