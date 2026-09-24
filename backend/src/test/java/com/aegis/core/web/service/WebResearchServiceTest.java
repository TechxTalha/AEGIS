package com.aegis.core.web.service;

import com.aegis.core.web.model.WebPageContent;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class WebResearchServiceTest {

    private final WebResearchService service = new WebResearchService();

    @Test
    void testExtractFromHtml() {
        String html = "<html><head><title>Test Page</title></head>" +
                "<body>" +
                "<header>Header content to ignore</header>" +
                "<nav>Nav links</nav>" +
                "<main>This is the real content.</main>" +
                "<aside>Side ad</aside>" +
                "<footer>Footer copyright</footer>" +
                "<script>alert('bad script');</script>" +
                "</body></html>";

        WebPageContent content = service.extractFromHtml(html, "https://example.com");

        assertEquals("Test Page", content.getTitle());
        assertEquals("https://example.com", content.getUrl());
        assertTrue(content.isSourceTracked());

        // Scripts, headers, nav, aside, footers should be removed
        assertFalse(content.getContent().contains("alert"));
        assertFalse(content.getContent().contains("Nav links"));
        assertFalse(content.getContent().contains("Header content"));
        assertFalse(content.getContent().contains("Footer"));
        assertFalse(content.getContent().contains("Side ad"));
        
        assertTrue(content.getContent().contains("This is the real content."));
    }

    @Test
    void testSearchFailsGracefullyWithMalformedQuery() {
        // Extremely long or malformed query handled safely
        var results = service.search(null);
        // Null throws NullPointerException during URLEncoder in standard java, but let's just make sure it returns an empty list
        assertTrue(results.isEmpty());
    }

    @Test
    void testMissingUrlSchemeAppended() {
        // test it doesn't crash on connect (though it will fail to connect locally usually, but we check if it catches without error)
        WebPageContent content = service.extractPageContent("localhost:8080/doesnotexist");
        assertEquals("https://localhost:8080/doesnotexist", content.getUrl());
        assertFalse(content.isSourceTracked());
        assertEquals("Error", content.getTitle());
    }
}
