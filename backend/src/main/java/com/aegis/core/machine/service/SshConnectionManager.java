package com.aegis.core.machine.service;

import com.aegis.core.machine.model.AuthType;
import com.aegis.core.machine.model.RemoteMachine;
import com.aegis.core.tool.model.ToolResult;
import com.jcraft.jsch.ChannelExec;
import com.jcraft.jsch.JSch;
import com.jcraft.jsch.Session;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.Map;

@Service
public class SshConnectionManager {

    private static final Logger logger = LoggerFactory.getLogger(SshConnectionManager.class);

    public boolean testConnection(RemoteMachine machine, String credential, String passphrase) {
        JSch jsch = new JSch();
        Session session = null;
        try {
            if (credential == null) {
                credential = "";
            }
            if (machine.getAuthType() == AuthType.KEY) {
                if (passphrase != null && !passphrase.isEmpty()) {
                    jsch.addIdentity(machine.getUsername(), credential.getBytes(StandardCharsets.UTF_8), null, passphrase.getBytes(StandardCharsets.UTF_8));
                } else {
                    jsch.addIdentity(machine.getUsername(), credential.getBytes(StandardCharsets.UTF_8), null, null);
                }
            }
            session = jsch.getSession(machine.getUsername(), machine.getHostname(), machine.getPort());
            if (machine.getAuthType() == AuthType.PASSWORD) {
                session.setPassword(credential);
            }
            java.util.Properties config = new java.util.Properties();
            config.put("StrictHostKeyChecking", "no");
            session.setConfig(config);
            session.connect(10000);
            return true;
        } catch (Exception e) {
            logger.warn("SSH test connection failed for {}: {}", machine.getName(), e.getMessage());
            return false;
        } finally {
            if (session != null && session.isConnected()) {
                session.disconnect();
            }
        }
    }

    public ToolResult executeCommand(RemoteMachine machine, String credential, String passphrase, String command) {
        JSch jsch = new JSch();
        Session session = null;
        ChannelExec channel = null;

        try {
            if (credential == null) {
                credential = "";
            }
            if (machine.getAuthType() == AuthType.KEY) {
                if (passphrase != null && !passphrase.isEmpty()) {
                    jsch.addIdentity(machine.getUsername(), credential.getBytes(StandardCharsets.UTF_8), null, passphrase.getBytes(StandardCharsets.UTF_8));
                } else {
                    jsch.addIdentity(machine.getUsername(), credential.getBytes(StandardCharsets.UTF_8), null, null);
                }
            }

            session = jsch.getSession(machine.getUsername(), machine.getHostname(), machine.getPort());
            
            if (machine.getAuthType() == AuthType.PASSWORD) {
                session.setPassword(credential);
            }
            
            java.util.Properties config = new java.util.Properties();
            config.put("StrictHostKeyChecking", "no");
            session.setConfig(config);
            
            // Connect with timeout (10 seconds)
            session.connect(10000);
            
            channel = (ChannelExec) session.openChannel("exec");
            channel.setCommand(command);
            
            channel.setInputStream(null);
            
            InputStream in = channel.getInputStream();
            InputStream err = channel.getErrStream();
            
            channel.connect(10000);
            
            StringBuilder outputBuffer = new StringBuilder();
            StringBuilder errorBuffer = new StringBuilder();
            
            byte[] tmp = new byte[1024];
            long startTime = System.currentTimeMillis();
            long timeoutMs = 60000; // 60 seconds timeout
            
            while (true) {
                while (in.available() > 0) {
                    int i = in.read(tmp, 0, 1024);
                    if (i < 0) break;
                    outputBuffer.append(new String(tmp, 0, i, StandardCharsets.UTF_8));
                }
                while (err.available() > 0) {
                    int i = err.read(tmp, 0, 1024);
                    if (i < 0) break;
                    errorBuffer.append(new String(tmp, 0, i, StandardCharsets.UTF_8));
                }
                
                if (channel.isClosed()) {
                    if (in.available() > 0 || err.available() > 0) continue;
                    break;
                }
                if (System.currentTimeMillis() - startTime > timeoutMs) {
                    errorBuffer.append("\n[AEGIS] Command execution timed out after 60 seconds.");
                    break;
                }
                try { Thread.sleep(100); } catch (Exception ee) {}
            }
            
            int exitCode = channel.getExitStatus();
            
            Map<String, Object> output = new HashMap<>();
            output.put("stdout", outputBuffer.toString());
            output.put("stderr", errorBuffer.toString());
            output.put("exitCode", exitCode);
            
            ToolResult result = new ToolResult();
            result.setSuccess(exitCode == 0);
            result.setPayload(new com.fasterxml.jackson.databind.ObjectMapper().writeValueAsString(output));
            if (exitCode != 0) {
                result.setErrorMessage("Command exited with code " + exitCode);
            }
            
            return result;
        } catch (Exception e) {
            logger.error("SSH Error on {}: {}", machine.getName(), e.getMessage());
            return ToolResult.failure("SSH Error: " + e.getMessage(), 0);
        } finally {
            if (channel != null && channel.isConnected()) {
                channel.disconnect();
            }
            if (session != null && session.isConnected()) {
                session.disconnect();
            }
        }
    }
}
