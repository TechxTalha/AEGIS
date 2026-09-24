package com.aegis.core.model.gateway.provider;

import com.aegis.core.model.gateway.dto.ModelRequest;
import com.aegis.core.model.gateway.dto.ModelResponse;
import com.aegis.core.model.gateway.exception.ModelGatewayException;

public interface ModelProvider {
    
    String getProviderName();

    ModelResponse generate(ModelRequest request) throws ModelGatewayException;
}
