package com.aegis.core.web.service;

import com.aegis.core.web.model.WebPageContent;
import com.aegis.core.web.model.WebSearchResult;
import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.jsoup.nodes.Element;
import org.jsoup.select.Elements;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;

@Service
public class WebResearchService {
    private static final Logger logger = LoggerFactory.getLogger(WebResearchService.class);
    private static final String USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

    public List<WebSearchResult> search(String query) {
        List<WebSearchResult> results = new ArrayList<>();
        try {
            String encodedQuery = URLEncoder.encode(query, StandardCharsets.UTF_8.toString());
            // DuckDuckGo html search
            String url = "https://html.duckduckgo.com/html/?q=" + encodedQuery;
            
            Document doc = Jsoup.connect(url)
                    .userAgent(USER_AGENT)
                    .timeout(10000)
                    .get();

            Elements resultNodes = doc.select(".result");
            for (Element node : resultNodes) {
                Element titleNode = node.selectFirst(".result__title a");
                Element snippetNode = node.selectFirst(".result__snippet");
                
                if (titleNode != null && snippetNode != null) {
                    String title = titleNode.text();
                    String link = titleNode.attr("href");
                    if (link.startsWith("//")) {
                        link = "https:" + link;
                    }
                    String snippet = snippetNode.text();
                    results.add(new WebSearchResult(title, link, snippet));
                }
                if (results.size() >= 10) break; // Limit to 10 results
            }
        } catch (Exception e) {
            logger.error("Search failed for query: {}", query, e);
        }
        return results;
    }

    public WebPageContent extractPageContent(String url) {
        try {
            if (url != null && !url.startsWith("http://") && !url.startsWith("https://")) {
                url = "https://" + url;
            }
            
            Document doc = Jsoup.connect(url)
                    .userAgent(USER_AGENT)
                    .timeout(15000)
                    .get();

            return extractFromDocument(doc, url);
        } catch (Exception e) {
            logger.error("Content extraction failed for url: {}", url, e);
            return new WebPageContent(url, "Error", "Failed to retrieve content: " + e.getMessage(), false);
        }
    }

    public WebPageContent extractFromHtml(String html, String url) {
        Document doc = Jsoup.parse(html, url);
        return extractFromDocument(doc, url);
    }

    private WebPageContent extractFromDocument(Document doc, String url) {
        String title = doc.title();
        
        // Remove non-content elements
        doc.select("script, style, noscript, nav, footer, header, aside").remove();

        // Extract plain text
        String text = doc.body() != null ? doc.body().text() : doc.text();
        
        return new WebPageContent(url, title, text, true);
    }
}
