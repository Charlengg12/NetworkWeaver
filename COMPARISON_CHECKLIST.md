# File-by-File Integration Checklist

## Backend Files

### main.py
- [ ] Compare imports
- [ ] Check for conflicting route names
- [ ] Verify database model compatibility
- [ ] Check middleware conflicts
- [ ] Compare CORS settings
- [ ] Verify authentication patterns

**Conflict Resolution Strategy:**
- Create `routers/routeros` as separate router module.
- Merge directly into `main.py` using `include_router`.

### requirements.txt
- [x] `routeros-api` (Already present)
- [ ] `prometheus-client` (Check if needed, `prometheus` service is used)

## Frontend Files

### App.jsx
- [ ] Check for state management conflicts
- [ ] Verify routing structure compatibility
- [ ] Check component naming conflicts (Avoid `Devices` naming collision)

**Conflict Resolution Strategy:**
- Use `/routeros` base path for all RouterOS related pages.
- Create `RouterOS` directory in components.

### package.json
- [ ] List new dependencies (`lucide-react` is already present)

## Database Files

### models.py
- [ ] Check for table name conflicts
- [ ] Verify foreign key compatibility

**Conflict Resolution Strategy:**
- Use `routeros_` prefix for new tables.

## Configuration Files

### docker-compose.yml
- [x] Port 3000 (Grafana) - **CONFLICT**: Existing Grafana uses 3000. SOP suggests 3001.
- [x] Port 9090 (Prometheus) - **CONFLICT**: Existing Prometheus uses 9090.
- [x] Port 5432 (Postgres) - **CONFLICT**: Existing Postgres uses 5432.

**Conflict Resolution Strategy:**
- Use `routeros-postgres` on 5433.
- Use `routeros-grafana` on 3001.
- Use `routeros-prometheus` on 9091 (SOP says 9090, but I should shift if running parallel).
- **BETTER STRATEGY**: Reuse existing services if possible, adding configuration to them. HOWEVER, SOP advises "Merge services... Rename conflicting services". I will likely follow SOP to ensure isolation first, or ask user. Given the prompt "check and apply the llm-integration-sop.md", I should strictly follow the SOP's safe integration path (separate services).

