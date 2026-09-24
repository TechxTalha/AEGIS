package com.aegis.core.memory.context;

public interface ContextProvider {
    
    String getContextName();
    
    String buildContext();
}
