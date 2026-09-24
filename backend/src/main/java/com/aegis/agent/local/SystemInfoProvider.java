package com.aegis.agent.local;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.fasterxml.jackson.databind.node.ArrayNode;
import org.springframework.stereotype.Component;
import oshi.SystemInfo;
import oshi.hardware.CentralProcessor;
import oshi.hardware.GlobalMemory;
import oshi.hardware.HardwareAbstractionLayer;
import oshi.software.os.OperatingSystem;
import oshi.software.os.OSProcess;

import java.util.List;

@Component
public class SystemInfoProvider {
    
    private final SystemInfo systemInfo;
    private final HardwareAbstractionLayer hal;
    private final OperatingSystem os;
    private final ObjectMapper mapper;
    private final AgentAuditLogger auditLogger;

    public SystemInfoProvider(AgentAuditLogger auditLogger) {
        this.auditLogger = auditLogger;
        this.systemInfo = new SystemInfo();
        this.hal = systemInfo.getHardware();
        this.os = systemInfo.getOperatingSystem();
        this.mapper = new ObjectMapper();
    }

    public String getMemoryInfo(String agentId) {
        auditLogger.log(agentId, "sys.info.memory", "Queried memory info", "SUCCESS");
        GlobalMemory memory = hal.getMemory();
        ObjectNode node = mapper.createObjectNode();
        node.put("total", memory.getTotal());
        node.put("available", memory.getAvailable());
        node.put("used", memory.getTotal() - memory.getAvailable());
        return node.toString();
    }

    public String getCpuInfo(String agentId) {
        auditLogger.log(agentId, "sys.info.cpu", "Queried CPU info", "SUCCESS");
        CentralProcessor cpu = hal.getProcessor();
        ObjectNode node = mapper.createObjectNode();
        node.put("logicalCoreCount", cpu.getLogicalProcessorCount());
        node.put("physicalCoreCount", cpu.getPhysicalProcessorCount());
        node.put("modelName", cpu.getProcessorIdentifier().getName());
        return node.toString();
    }

    public String getDiskInfo(String agentId) {
        auditLogger.log(agentId, "sys.info.disk", "Queried disk info", "SUCCESS");
        ArrayNode arr = mapper.createArrayNode();
        for (oshi.hardware.HWDiskStore disk : hal.getDiskStores()) {
            ObjectNode dNode = mapper.createObjectNode();
            dNode.put("name", disk.getName());
            dNode.put("model", disk.getModel());
            dNode.put("size", disk.getSize());
            dNode.put("reads", disk.getReads());
            dNode.put("writes", disk.getWrites());
            arr.add(dNode);
        }
        return arr.toString();
    }

    public String getNetworkInfo(String agentId) {
        auditLogger.log(agentId, "sys.info.network", "Queried network info", "SUCCESS");
        ArrayNode arr = mapper.createArrayNode();
        for (oshi.hardware.NetworkIF netIF : hal.getNetworkIFs()) {
            ObjectNode nNode = mapper.createObjectNode();
            nNode.put("name", netIF.getName());
            nNode.put("displayName", netIF.getDisplayName());
            nNode.put("macaddr", netIF.getMacaddr());
            ArrayNode ipArr = mapper.createArrayNode();
            for (String ip : netIF.getIPv4addr()) ipArr.add(ip);
            nNode.set("ipv4", ipArr);
            arr.add(nNode);
        }
        return arr.toString();
    }

    public String getServicesInfo(String agentId) {
        auditLogger.log(agentId, "sys.info.services", "Queried services info", "SUCCESS");
        ArrayNode arr = mapper.createArrayNode();
        for (oshi.software.os.OSService s : os.getServices()) {
            ObjectNode sNode = mapper.createObjectNode();
            sNode.put("name", s.getName());
            sNode.put("state", s.getState().name());
            sNode.put("pid", s.getProcessID());
            arr.add(sNode);
        }
        return arr.toString();
    }

    public String getProcessesInfo(String agentId) {
        auditLogger.log(agentId, "sys.info.processes", "Queried processes info", "SUCCESS");
        List<OSProcess> processes = os.getProcesses(null, oshi.software.os.OperatingSystem.ProcessSorting.CPU_DESC, 20);
        ArrayNode arr = mapper.createArrayNode();
        for (OSProcess p : processes) {
            ObjectNode pNode = mapper.createObjectNode();
            pNode.put("pid", p.getProcessID());
            pNode.put("name", p.getName());
            pNode.put("cpuUsage", p.getProcessCpuLoadBetweenTicks(p));
            pNode.put("memoryUsage", p.getResidentSetSize());
            pNode.put("state", p.getState().name());
            arr.add(pNode);
        }
        return arr.toString();
    }
}
