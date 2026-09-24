package com.aegis.core.model.gateway.provider;

import com.aegis.core.model.gateway.dto.*;
import com.aegis.core.tool.model.ToolDefinition;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.web.client.RestTemplate;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.*;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withStatus;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withSuccess;

class OpenAICompatibleProviderTest {

    private RestTemplate restTemplate;
    private MockRestServiceServer mockServer;
    private ObjectMapper objectMapper;
    private OpenAICompatibleProvider provider;

    @BeforeEach
    void setUp() {
        restTemplate = new RestTemplate();
        mockServer = MockRestServiceServer.createServer(restTemplate);
        objectMapper = new ObjectMapper();
        provider = new OpenAICompatibleProvider(restTemplate, objectMapper, "https://api.mock.com/v1", "test-key", "gpt-4o");
    }

    @Test
    void testGenerateSuccess() throws Exception {
        ModelRequest request = new ModelRequest();
        request.setMessages(List.of(ModelMessage.user("Hello")));

        String mockResponseJson = "{\n" +
                "  \"id\": \"chatcmpl-123\",\n" +
                "  \"object\": \"chat.completion\",\n" +
                "  \"created\": 1677652288,\n" +
                "  \"model\": \"gpt-4o\",\n" +
                "  \"choices\": [{\n" +
                "    \"index\": 0,\n" +
                "    \"message\": {\n" +
                "      \"role\": \"assistant\",\n" +
                "      \"content\": \"Hello there!\"\n" +
                "    },\n" +
                "    \"finish_reason\": \"stop\"\n" +
                "  }],\n" +
                "  \"usage\": {\n" +
                "    \"prompt_tokens\": 9,\n" +
                "    \"completion_tokens\": 12,\n" +
                "    \"total_tokens\": 21\n" +
                "  }\n" +
                "}";

        mockServer.expect(requestTo("https://api.mock.com/v1/chat/completions"))
                .andExpect(method(HttpMethod.POST))
                .andExpect(header("Authorization", "Bearer test-key"))
                .andExpect(jsonPath("$.model").value("gpt-4o"))
                .andExpect(jsonPath("$.messages[0].role").value("user"))
                .andExpect(jsonPath("$.messages[0].content").value("Hello"))
                .andRespond(withSuccess(mockResponseJson, MediaType.APPLICATION_JSON));

        ModelResponse response = provider.generate(request);

        assertNotNull(response);
        assertEquals("Hello there!", response.getContent());
        assertEquals(9, response.getUsage().getPromptTokens());
        assertEquals(12, response.getUsage().getCompletionTokens());
        assertEquals(21, response.getUsage().getTotalTokens());

        mockServer.verify();
    }

    @Test
    void testToolCallResponse() throws Exception {
        ModelRequest request = new ModelRequest();
        request.setMessages(List.of(ModelMessage.user("Use tool")));
        
        ToolDefinition td = new ToolDefinition();
        td.setId("my_tool");
        td.setDescription("Does a thing");
        td.setInputSchema("{\"type\":\"object\",\"properties\":{\"arg1\":{\"type\":\"string\"}}}");
        request.setTools(List.of(td));

        String mockResponseJson = "{\n" +
                "  \"choices\": [{\n" +
                "    \"message\": {\n" +
                "      \"role\": \"assistant\",\n" +
                "      \"content\": null,\n" +
                "      \"tool_calls\": [{\n" +
                "        \"id\": \"call_123\",\n" +
                "        \"type\": \"function\",\n" +
                "        \"function\": {\n" +
                "          \"name\": \"my_tool\",\n" +
                "          \"arguments\": \"{\\\"arg1\\\":\\\"val1\\\"}\"\n" +
                "        }\n" +
                "      }]\n" +
                "    }\n" +
                "  }],\n" +
                "  \"usage\": {\n" +
                "    \"prompt_tokens\": 10,\n" +
                "    \"completion_tokens\": 15,\n" +
                "    \"total_tokens\": 25\n" +
                "  }\n" +
                "}";

        mockServer.expect(requestTo("https://api.mock.com/v1/chat/completions"))
                .andExpect(method(HttpMethod.POST))
                .andRespond(withSuccess(mockResponseJson, MediaType.APPLICATION_JSON));

        ModelResponse response = provider.generate(request);

        assertNotNull(response);
        assertNotNull(response.getToolCalls());
        assertEquals(1, response.getToolCalls().size());
        assertEquals("call_123", response.getToolCalls().get(0).getId());
        assertEquals("my_tool", response.getToolCalls().get(0).getName());
        assertEquals("val1", response.getToolCalls().get(0).getArguments().get("arg1"));

        mockServer.verify();
    }

    @Test
    void testMissingSchemaAndTrailingSlash() throws Exception {
        // Re-init with trailing slash endpoint
        provider = new OpenAICompatibleProvider(restTemplate, objectMapper, "https://api.mock.com/v1/", "test-key", "gpt-4o");

        ModelRequest request = new ModelRequest();
        request.setMessages(List.of(ModelMessage.user("Do something")));
        
        ToolDefinition td = new ToolDefinition();
        td.setId("no_schema_tool");
        td.setDescription("Tool with no schema");
        td.setInputSchema(null); // null schema
        request.setTools(List.of(td));

        String mockResponseJson = "{\n" +
                "  \"choices\": [{\n" +
                "    \"message\": {\n" +
                "      \"role\": \"assistant\",\n" +
                "      \"content\": \"Done\"\n" +
                "    }\n" +
                "  }]\n" +
                "}";

        // The URL should not have double slashes
        mockServer.expect(requestTo("https://api.mock.com/v1/chat/completions"))
                .andExpect(method(HttpMethod.POST))
                // Check that properties is empty object for parameters
                .andExpect(jsonPath("$.tools[0].function.parameters.type").value("object"))
                .andExpect(jsonPath("$.tools[0].function.parameters.properties").isEmpty())
                .andRespond(withSuccess(mockResponseJson, MediaType.APPLICATION_JSON));

        ModelResponse response = provider.generate(request);

        assertNotNull(response);
        assertEquals("Done", response.getContent());

        mockServer.verify();
    }
}
