package com.aegis.core.memory.context;

import org.springframework.stereotype.Component;

@Component
public class MachineContextProvider implements ContextProvider {

    @Override
    public String getContextName() {
        return "Machine Context";
    }

    @Override
    public String buildContext() {
        String osName = System.getProperty("os.name");
        String osVersion = System.getProperty("os.version");
        String osArch = System.getProperty("os.arch");
        String userDir = System.getProperty("user.dir");
        String userName = System.getProperty("user.name");

        return String.format(
            "OS: %s (%s) %s\n" +
            "Current User: %s\n" +
            "Working Directory: %s",
            osName, osVersion, osArch, userName, userDir
        );
    }
}
