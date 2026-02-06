# GNS3 MikroTik Integration Diagnostic Plan

## 🎯 Objective
Systematically diagnose and resolve why GNS3 MikroTik devices are not appearing in the NetworkWeaver monitoring dashboard despite multiple troubleshooting attempts.

---

## 📋 Problem Analysis

### Current State (Discovered)
1. **Prometheus Configuration**: GNS3 targets (192.168.137.60, 192.168.137.61) are **commented out** in `/monitoring/prometheus/prometheus.yml`
2. **Ping Failure**: Terminal shows timeouts to `192.168.247.1` (different IP than documented setup)
3. **Device Registration**: No evidence devices are registered in PostgreSQL database
4. **Network Mismatch**: Documentation references `192.168.137.x` but terminal shows `192.168.247.x`

### Root Causes (Hypotheses - Ranked by Likelihood)
| # | Hypothesis | Probability | Impact |
|---|------------|-------------|--------|
| 1 | **Devices not registered in database** | 🔴 HIGH | Critical - No targets for Prometheus |
| 2 | **GNS3 IP subnet changed** (137→247) | 🔴 HIGH | Critical - Wrong IPs everywhere |
| 3 | **Docker network isolation** | 🟡 MEDIUM | High - Containers can't reach GNS3 |
| 4 | **Prometheus targets commented out** | 🟡 MEDIUM | High - Even if fixed, won't scrape |
| 5 | **SNMP port 161 blocked** | 🟢 LOW | Medium - Connectivity works, SNMP may not |

---

## 🔬 Multi-Agent Investigation Strategy

### Phase 1: Analysis (PLANNING - Current)
- **Agent**: `project-planner`
- **Task**: Create comprehensive diagnostic plan
- **Status**: ✅ Complete (this document)

### Phase 2: Deep Dive (EXECUTION - After Approval)

#### Investigation Track A: Network Connectivity
| Agent | Focus Area | Deliverables |
|-------|------------|--------------|
| **devops-engineer** | Docker network analysis | • Verify bridge network config<br>• Test container-to-host routing<br>• Diagnose IP subnet mismatch (137 vs 247) |

#### Investigation Track B: Configuration Audit
| Agent | Focus Area | Deliverables |
|-------|------------|--------------|
| **backend-specialist** | Database & API analysis | • Query devices table for GNS3 entries<br>• Check Prometheus HTTP SD endpoint<br>• Verify SNMP exporter config |

#### Investigation Track C: Root Cause Analysis
| Agent | Focus Area | Deliverables |
|-------|------------|--------------|
| **debugger** | Systematic fault isolation | • Layer-by-layer connectivity test<br>• Evidence-based diagnosis<br>• Generate fix recommendations |

---

## 🔍 Diagnostic Tasks Breakdown

### Task 1: Verify Current GNS3 Network Configuration
**Agent**: `devops-engineer`  
**Priority**: P0 (Blocker)

**INPUT**:
- GNS3 topology state
- Windows network adapter configuration
- Current IP addressing scheme

**ACTIONS**:
```powershell
# 1. Check Windows network adapters
Get-NetAdapter | Where-Object {$_.Status -eq "Up"} | Select-Object Name, InterfaceDescription, Status, MacAddress

# 2. List all IP addresses
Get-NetIPAddress | Where-Object {$_.AddressFamily -eq "IPv4"} | Select-Object IPAddress, InterfaceAlias, PrefixLength

# 3. Check GNS3 bridge state
ipconfig /all | Select-String -Pattern "192.168"
```

**OUTPUT**:
- Current active subnet (is it 137 or 247?)
- GNS3 Cloud adapter identification
- Host PC IP on GNS3 network

**VERIFY**:
- IP consistency check: Documentation vs. Reality
- GNS3 adapter is bridged and active

---

### Task 2: Test Layer 3 Connectivity
**Agent**: `debugger`  
**Priority**: P0 (Blocker)  
**Dependencies**: Task 1

**INPUT**:
- Confirmed GNS3 MikroTik IP address
- Host PC IP on same subnet

**ACTIONS**:
```powershell
# 1. Ping from Windows Host → GNS3 MikroTik
ping 192.168.247.1 -n 4

# 2. Test SNMP port (UDP 161)
Test-NetConnection -ComputerName 192.168.247.1 -Port 161 -InformationLevel Detailed

# 3. Test from Docker container
docker exec networkweaver-snmp-exporter ping -c 4 192.168.247.1

# 4. Test Docker DNS resolution
docker exec networkweaver-snmp-exporter nslookup host.docker.internal
```

**OUTPUT**:
- Ping success/failure from host
- Ping success/failure from Docker
- UDP 161 reachability

**VERIFY**:
- If host ping works but Docker fails → Docker network issue
- If both fail → GNS3/Windows firewall issue

---

### Task 3: Audit Database Device Registry
**Agent**: `backend-specialist`  
**Priority**: P0 (Blocker)

**INPUT**:
- PostgreSQL database connection
- Expected GNS3 device IPs

**ACTIONS**:
```powershell
# 1. Query devices table
docker exec networkweaver-db psql -U user -d networkweaver -c "SELECT id, name, ip_address, snmp_community FROM devices;"

# 2. Check if GNS3 devices exist
docker exec networkweaver-db psql -U user -d networkweaver -c "SELECT * FROM devices WHERE ip_address LIKE '192.168.%';"

# 3. Test backend API
curl http://localhost:8000/devices/

# 4. Check Prometheus HTTP SD endpoint
curl http://localhost:8000/monitoring/targets
```

**OUTPUT**:
- List of registered devices in database
- Whether GNS3 MikroTik is registered
- Current Prometheus target list from NetworkWeaver API

**VERIFY**:
- If GNS3 devices are NOT in database → **PRIMARY ROOT CAUSE**
- If devices exist but not in Prometheus targets → Service discovery issue

---

### Task 4: Validate Prometheus Scrape Configuration
**Agent**: `backend-specialist`  
**Priority**: P1 (High)  
**Dependencies**: Task 3

**INPUT**:
- Prometheus configuration files
- Registered device list from database

**ACTIONS**:
```bash
# 1. Check Docker Prometheus config
docker exec networkweaver-prometheus cat /etc/prometheus/prometheus.yml

# 2. Check targets status
curl http://localhost:9090/api/v1/targets | jq '.data.activeTargets'

# 3. Test SNMP exporter directly
curl "http://localhost:9116/snmp?target=192.168.247.1&module=mikrotik"
```

**OUTPUT**:
- Current Prometheus scrape config
- Active targets and their status (UP/DOWN)
- SNMP exporter response

**VERIFY**:
- Prometheus config references correct IPs
- SNMP exporter can reach target
- Targets show in Prometheus UI at `http://localhost:9090/targets`

---

### Task 5: Verify GNS3 MikroTik SNMP Configuration
**Agent**: `debugger`  
**Priority**: P1 (High)  
**Dependencies**: Task 2

**INPUT**:
- GNS3 MikroTik console access
- Expected SNMP community string

**ACTIONS** (Run in MikroTik console):
```bash
# 1. Check SNMP status
/snmp print

# 2. List SNMP communities
/snmp community print

# 3. Check interface IPs
/ip address print

# 4. Test connectivity to host
ping 192.168.247.X count=4  # Replace X with host IP

# 5. Check firewall rules (if any)
/ip firewall filter print
```

**OUTPUT**:
- SNMP enabled status
- Community string configuration
- Interface status and IPs
- Firewall rules blocking SNMP

**VERIFY**:
- SNMP is enabled
- Community "public" exists
- No firewall blocking port 161

---

### Task 6: Integrate Findings & Recommend Fixes
**Agent**: `debugger`  
**Priority**: P2 (Normal)  
**Dependencies**: Tasks 1-5

**INPUT**:
- Results from all diagnostic tasks
- Root cause identification

**ACTIONS**:
- Synthesize evidence from all investigations
- Map failures to specific configuration gaps
- Generate prioritized fix list

**OUTPUT**:
- Root cause report (Evidence-based)
- Prioritized fix recommendations
- Rollback strategy for each fix

**VERIFY**:
- All hypotheses tested
- Fixes address identified root causes
- No conflicting recommendations

---

## 📊 Data Collection Checkpoints

### Evidence Matrix
| Layer | Test | Expected | Actual | Status |
|-------|------|----------|--------|--------|
| **L2** | GNS3 bridge active | Yes | ? | ⏳ |
| **L3** | Host → MikroTik ping | Success | Timeout | ❌ |
| **L3** | Docker → MikroTik ping | Success | ? | ⏳ |
| **L4** | SNMP port 161 open | Open | ? | ⏳ |
| **L7** | SNMP query response | Data | ? | ⏳ |
| **App** | Device in database | Yes | ? | ⏳ |
| **App** | Prometheus targets | UP | ? | ⏳ |

---

## 🎯 Success Criteria

### Definition of Done
- [ ] GNS3 MikroTik reachable via ping from Windows host
- [ ] GNS3 MikroTik reachable via ping from Docker containers
- [ ] SNMP port 161 accessible from SNMP exporter container
- [ ] Device registered in `devices` table with correct IP
- [ ] Prometheus shows target as **UP** in `/targets` page
- [ ] Grafana dashboard displays MikroTik metrics
- [ ] NetworkWeaver frontend shows device in Monitoring tab

---

## 🚨 Known Issues from Previous Conversations

From conversation `007e3cfb-15b4-49cb-a8cb-fe4844b61f89`:
- **Asymmetric connectivity**: MikroTik could ping Windows, but Windows couldn't reach MikroTik
- **Firewall suspicion**: Windows Firewall likely blocking inbound SNMP/HTTP
- **GNS3 bridging complexity**: Cloud node configuration issues

---

## 🔄 Rollback Strategy

If changes break existing monitoring:
1. Restore original `prometheus.yml` from git
2. Restart Prometheus container: `docker compose restart prometheus`
3. Flush iptables if Docker network modified
4. Restart GNS3 topology if cloud bridge changed

---

## 📝 Notes

- **DO NOT** modify production configs until root cause confirmed
- **DO** collect all evidence before proposing fixes
- **DO** test each fix individually to isolate effects
- **DO NOT** assume documentation is accurate (verify IPs in reality)

