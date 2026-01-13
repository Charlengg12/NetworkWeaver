# SOP: Integrating RouterOS Management System into Existing Project

## Purpose
This Standard Operating Procedure (SOP) provides step-by-step instructions for safely integrating the RouterOS management system into your existing project, with special emphasis on preventing code overwrites and maintaining project integrity.

---

## Phase 1: Pre-Integration Assessment

### 1.1 Document Current Project State

**Action Items:**
- [ ] Create a new Git branch: `git checkout -b feature/routeros-integration`
- [ ] Take a full backup of your project: `tar -czf backup-$(date +%Y%m%d).tar.gz /path/to/project`
- [ ] Document current project structure:
  ```bash
  tree -L 3 -I 'node_modules|venv|__pycache__' > project-structure-before.txt
  ```
- [ ] List all existing dependencies:
  ```bash
  # Frontend
  cat package.json > dependencies-before-frontend.json
  
  # Backend
  pip freeze > dependencies-before-backend.txt
  ```

### 1.2 Identify Potential Conflicts

**Check for existing files that might conflict:**

```bash
# Check if these files already exist
find . -name "main.py" -o -name "App.jsx" -o -name "docker-compose.yml"
```

**Critical Files to Check:**
- [ ] `backend/main.py` - Backend entry point
- [ ] `frontend/src/App.jsx` - Frontend main component
- [ ] `docker-compose.yml` - Container orchestration
- [ ] `prometheus/prometheus.yml` - Monitoring config
- [ ] Database models/schemas

**Decision Matrix:**

| File Exists? | Action |
|--------------|--------|
| ✅ Yes | Create integration file (e.g., `main_routeros.py`) or merge manually |
| ❌ No | Use provided code directly |

---

## Phase 2: Preparing for LLM Integration

### 2.1 Create Integration Context Document

**File: `INTEGRATION_CONTEXT.md`**

```markdown
# RouterOS Integration Context

## Current Project Overview
- **Tech Stack**: [List your current stack]
- **Backend Framework**: [FastAPI/Django/Express/etc.]
- **Frontend Framework**: [React/Vue/Angular/etc.]
- **Database**: [PostgreSQL/MySQL/MongoDB/etc.]
- **Existing Features**: [List existing features]

## Integration Goals
- [ ] Add RouterOS device management
- [ ] Integrate Grafana monitoring
- [ ] Add SNMP metrics collection
- [ ] Implement config execution

## Files That Must NOT Be Modified
- `path/to/existing/critical/file1.py`
- `path/to/existing/critical/file2.jsx`
- `config/production.yml`
- [Add all files you want to protect]

## Integration Constraints
- Must maintain existing API endpoints
- Database changes must be additive only (no drops)
- Frontend routes must not conflict
- Port allocations: [List used ports]

## Existing Patterns to Follow
- Authentication: [Describe your auth system]
- API Structure: [Describe your API patterns]
- State Management: [Redux/Context/Zustand/etc.]
- Error Handling: [Your error handling approach]
```

### 2.2 Create File Comparison Checklist

**File: `COMPARISON_CHECKLIST.md`**

```markdown
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
- If conflicts: Create `routers/routeros.py` as separate router module
- If no conflicts: Merge directly

### requirements.txt
- [ ] List new dependencies
- [ ] Check for version conflicts
- [ ] Test compatibility with existing packages

**New Dependencies:**
```
routeros-api==0.17.0
prometheus-client==0.19.0
```

**Conflicts Found:** [List any conflicts]
**Resolution:** [How you'll resolve them]

## Frontend Files

### App.jsx
- [ ] Check for state management conflicts
- [ ] Verify routing structure compatibility
- [ ] Check component naming conflicts
- [ ] Compare API call patterns
- [ ] Verify authentication flow compatibility

**Conflict Resolution Strategy:**
- If conflicts: Create separate `RouterOSModule.jsx` component
- If no conflicts: Merge into existing structure

### package.json
- [ ] List new dependencies
- [ ] Check for version conflicts

**New Dependencies:**
```
lucide-react: ^0.263.1
```

**Conflicts Found:** [List any conflicts]
**Resolution:** [How you'll resolve them]

## Database Files

### models.py / schema.sql
- [ ] Check for table name conflicts
- [ ] Verify foreign key compatibility
- [ ] Check for column name conflicts
- [ ] Verify data type compatibility

**New Tables:**
- users (if not exists)
- devices
- config_logs

**Conflict Resolution Strategy:**
- Add prefix if conflicts: `routeros_devices`, `routeros_logs`

## Configuration Files

### docker-compose.yml
- [ ] Check for service name conflicts
- [ ] Verify port conflicts
- [ ] Check volume name conflicts
- [ ] Verify network name conflicts

**Conflict Resolution Strategy:**
- Merge services into existing docker-compose
- Rename conflicting services with `routeros_` prefix
```

---

## Phase 3: LLM Prompting Strategy

### 3.1 Prompt Template for Code Integration

**Copy this prompt when asking other LLMs:**

```
I need to integrate RouterOS management functionality into my existing project. 
Here's what you need to know:

## My Current Project Structure
[Paste your INTEGRATION_CONTEXT.md here]

## Integration Request
I have RouterOS integration code that includes:
1. FastAPI backend with device management
2. React frontend with monitoring UI
3. Prometheus + Grafana setup
4. PostgreSQL database schema

## Critical Requirements
1. DO NOT overwrite these existing files: [List protected files]
2. If there are conflicts, create separate modules with "routeros_" prefix
3. Preserve all existing functionality
4. Use my existing authentication system: [Describe your auth]
5. Follow my project's code style and patterns

## Specific Integration Tasks
Please help me with:
- [ ] Identify all potential conflicts with my existing code
- [ ] Suggest file names for new modules to avoid conflicts
- [ ] Show me how to merge database models without breaking existing tables
- [ ] Provide step-by-step integration instructions
- [ ] Create migration scripts for database changes

## Code to Integrate
[Paste the specific code section you want to integrate]

Please analyze for conflicts FIRST before suggesting integration steps.
```

### 3.2 Specialized Prompts for Different Components

#### **Backend Integration Prompt**
```
I need to integrate RouterOS backend code into my existing FastAPI application.

EXISTING STRUCTURE:
- Main file: backend/app.py (DO NOT MODIFY)
- Routers: backend/routers/*.py
- Models: backend/models/*.py
- Auth: [Describe your auth system]

INTEGRATION REQUEST:
Please create a new router module at `backend/routers/routeros.py` that:
1. Uses my existing database session from `backend/database.py`
2. Uses my existing auth dependency from `backend/auth.py`
3. Follows my existing API structure: /api/v1/{resource}
4. Does not conflict with existing endpoints

Here's the RouterOS code to integrate:
[Paste backend code]

Please provide:
1. The adapted router module code
2. Import statements for main.py
3. Any new database models with "RouterOS" prefix
4. Migration script for new tables
```

#### **Frontend Integration Prompt**
```
I need to integrate RouterOS frontend components into my existing React app.

EXISTING STRUCTURE:
- Main App: src/App.jsx (DO NOT MODIFY core routing)
- Components: src/components/*
- Pages: src/pages/*
- State Management: [Redux/Context/Zustand]
- API calls: [axios/fetch from src/api/*]

INTEGRATION REQUEST:
Please create separate components in `src/components/RouterOS/` that:
1. Use my existing authentication context
2. Use my existing API client setup
3. Match my existing component patterns
4. Use my existing UI library: [Material-UI/Tailwind/etc.]

Here's the RouterOS frontend code to integrate:
[Paste frontend code]

Please provide:
1. Directory structure for new components
2. Modified routing configuration
3. Integration points with existing app
4. State management integration
```

#### **Docker Integration Prompt**
```
I need to add RouterOS monitoring services to my existing docker-compose.yml.

EXISTING SERVICES:
[Paste your current docker-compose.yml services section]

INTEGRATION REQUEST:
Please merge these new services without conflicts:
- prometheus (needs port 9090)
- grafana (needs port 3001)
- snmp-exporter (needs port 9116)

Here's the new docker-compose configuration:
[Paste docker-compose code]

Please provide:
1. Merged docker-compose.yml
2. Any port conflict resolutions
3. Network configuration that connects to existing services
4. Volume management that doesn't conflict
```

#### **Database Integration Prompt**
```
I need to add RouterOS database tables to my existing PostgreSQL database.

EXISTING SCHEMA:
[Paste your current database schema or models]

INTEGRATION REQUEST:
Please create migration scripts that:
1. Add new tables without dropping existing ones
2. Use "routeros_" prefix if table names might conflict
3. Create foreign keys to my existing user table: [table name]
4. Follow my existing naming conventions: [snake_case/camelCase/etc.]

Here's the new schema to integrate:
[Paste database models]

Please provide:
1. Alembic/SQL migration script
2. Updated models file
3. Rollback script
4. Data seeding script (if needed)
```

---

## Phase 4: Integration Execution

### 4.1 Backend Integration Steps

**Step 1: Create New Router Module**

```bash
# Create RouterOS router directory
mkdir -p backend/routers/routeros

# Create module files
touch backend/routers/routeros/__init__.py
touch backend/routers/routeros/devices.py
touch backend/routers/routeros/config.py
touch backend/routers/routeros/metrics.py
```

**Step 2: Compare and Merge**

```python
# backend/routers/routeros/devices.py
# Use this template to adapt the provided code

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
# Import from YOUR existing modules
from backend.database import get_db
from backend.auth import get_current_user
from backend.models import User

router = APIRouter(prefix="/api/routeros/devices", tags=["RouterOS Devices"])

# Paste adapted RouterOS device management code here
# Make sure to replace any conflicting imports with your existing ones
```

**Step 3: Update Main Application**

```python
# backend/main.py (or your main file)
# ADD these lines, don't replace existing code

from backend.routers.routeros import devices, config, metrics

# Add to your existing app configuration
app.include_router(devices.router)
app.include_router(config.router)
app.include_router(metrics.router)
```

**Step 4: Verify No Conflicts**

```bash
# Run your application in test mode
python -m pytest tests/

# Check all existing endpoints still work
curl http://localhost:8000/docs  # Should show both old and new endpoints
```

### 4.2 Database Integration Steps

**Step 1: Create Migration**

```bash
# If using Alembic
alembic revision --autogenerate -m "Add RouterOS tables"

# Review the generated migration file
# Make sure it only has CREATE statements, no DROP/ALTER to existing tables
```

**Step 2: Review Migration**

```python
# migrations/versions/xxxxx_add_routeros_tables.py
# MANUALLY REVIEW THIS FILE

def upgrade():
    # ✅ GOOD: Only creates new tables
    op.create_table('routeros_devices',
        sa.Column('id', sa.Integer(), nullable=False),
        # ...
    )
    
    # ❌ BAD: Modifies existing table
    # op.alter_column('users', 'email')  # REMOVE THIS
    
    # ❌ BAD: Drops existing table
    # op.drop_table('existing_table')  # REMOVE THIS

def downgrade():
    # Should only drop NEW tables
    op.drop_table('routeros_devices')
    # DO NOT drop existing tables
```

**Step 3: Test Migration**

```bash
# Test on development database first
export DATABASE_URL="postgresql://user:pass@localhost/dev_db"
alembic upgrade head

# Verify existing data is intact
psql dev_db -c "SELECT COUNT(*) FROM existing_table;"

# Rollback to test downgrade
alembic downgrade -1

# Re-apply
alembic upgrade head
```

**Step 4: Apply to Production**

```bash
# Backup first!
pg_dump production_db > backup_before_routeros_$(date +%Y%m%d).sql

# Apply migration
export DATABASE_URL="postgresql://user:pass@localhost/production_db"
alembic upgrade head
```

### 4.3 Frontend Integration Steps

**Step 1: Create Component Structure**

```bash
# Create RouterOS components directory
mkdir -p frontend/src/components/RouterOS
mkdir -p frontend/src/pages/RouterOS
mkdir -p frontend/src/services/routeros

# Create files
touch frontend/src/components/RouterOS/DeviceList.jsx
touch frontend/src/components/RouterOS/ConfigExecutor.jsx
touch frontend/src/components/RouterOS/MetricsView.jsx
touch frontend/src/pages/RouterOS/index.jsx
touch frontend/src/services/routeros/api.js
```

**Step 2: Adapt API Client**

```javascript
// frontend/src/services/routeros/api.js
// Use YOUR existing API client setup

import { apiClient } from '../api/client';  // Your existing API client

export const routerosAPI = {
  // Devices
  getDevices: () => apiClient.get('/api/routeros/devices'),
  addDevice: (data) => apiClient.post('/api/routeros/devices', data),
  testDevice: (id) => apiClient.post(`/api/routeros/devices/${id}/test`),
  
  // Config
  executeConfig: (data) => apiClient.post('/api/routeros/config/execute', data),
  getConfigLogs: (deviceId) => apiClient.get('/api/routeros/config/logs', { params: { device_id: deviceId } }),
  
  // Metrics
  getMetrics: () => apiClient.get('/api/routeros/metrics/devices'),
};
```

**Step 3: Integrate into Routing**

```javascript
// frontend/src/App.jsx
// ADD to your existing routes, don't replace

import { RouterOSPage } from './pages/RouterOS';

// Inside your existing routing configuration
<Route path="/routeros/*" element={<RouterOSPage />} />
```

**Step 4: Add Navigation Link**

```javascript
// Add to your existing navigation component
<NavLink to="/routeros">RouterOS Management</NavLink>
```

### 4.4 Docker Integration Steps

**Step 1: Merge docker-compose.yml**

```bash
# Backup existing file
cp docker-compose.yml docker-compose.yml.backup

# Create merged version
# MANUALLY merge, checking for:
# - Port conflicts
# - Service name conflicts
# - Volume name conflicts
# - Network name conflicts
```

**Step 2: Merge Template**

```yaml
# docker-compose.yml
version: '3.8'

services:
  # ========================================
  # EXISTING SERVICES (DO NOT MODIFY)
  # ========================================
  your-existing-service:
    # ... keep as is
  
  # ========================================
  # NEW ROUTEROS SERVICES
  # ========================================
  routeros-postgres:  # Prefix to avoid conflicts
    image: postgres:15
    container_name: routeros_postgres
    environment:
      POSTGRES_DB: routeros_db
    # Use different port if 5432 is taken
    ports:
      - "5433:5432"  # External:Internal
    networks:
      - your-existing-network  # Connect to existing network

  routeros-prometheus:
    image: prom/prometheus:latest
    # Check if port 9090 is available
    ports:
      - "9090:9090"
    networks:
      - your-existing-network

  routeros-grafana:
    image: grafana/grafana:latest
    # Check if port 3001 is available
    ports:
      - "3001:3000"
    networks:
      - your-existing-network
    depends_on:
      - routeros-prometheus

networks:
  your-existing-network:  # Reference existing network
    external: true
```

**Step 3: Test Configuration**

```bash
# Validate syntax
docker-compose config

# Start only new services
docker-compose up -d routeros-postgres routeros-prometheus routeros-grafana

# Check logs
docker-compose logs -f routeros-grafana

# Verify connectivity
docker exec routeros-grafana ping routeros-prometheus
```

---

## Phase 5: Conflict Resolution Strategies

### 5.1 Port Conflicts

**Detection:**
```bash
# Check which ports are in use
sudo netstat -tulpn | grep LISTEN
```

**Resolution:**
```yaml
# Change external port in docker-compose.yml
ports:
  - "9091:9090"  # Changed 9090 to 9091
  
# Update Prometheus datasource in Grafana
url: http://prometheus:9090  # Internal port stays same
```

### 5.2 Route/Endpoint Conflicts

**Detection:**
```bash
# List all existing routes
# FastAPI
python -c "from backend.main import app; print([route.path for route in app.routes])"

# Express
grep -r "app.get\|app.post\|router.get\|router.post" backend/ | grep -v node_modules
```

**Resolution:**
```python
# Add prefix to new routes
router = APIRouter(prefix="/api/v1/routeros", tags=["RouterOS"])

# Or use versioning
router = APIRouter(prefix="/api/v2/devices", tags=["RouterOS Devices"])
```

### 5.3 Database Table Conflicts

**Detection:**
```sql
-- List existing tables
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public';
```

**Resolution:**
```python
# Add prefix to table names
class RouterOSDevice(Base):
    __tablename__ = "routeros_devices"  # Instead of just "devices"
```

### 5.4 Component Name Conflicts

**Detection:**
```bash
# Find existing component names
find frontend/src -name "*.jsx" -o -name "*.tsx" | xargs basename -a | sort | uniq -d
```

**Resolution:**
```javascript
// Use namespaced component names
export const RouterOSDeviceList = () => { ... }  // Instead of DeviceList
export const RouterOSMetrics = () => { ... }  // Instead of Metrics
```

### 5.5 Import Conflicts

**Detection:**
```bash
# Check for duplicate imports
grep -r "^import.*from" frontend/src/**/*.jsx | cut -d: -f2 | sort | uniq -d
```

**Resolution:**
```javascript
// Use aliased imports
import { Button } from '@mui/material';
import { Button as RouterOSButton } from './components/RouterOS/Button';
```

---

## Phase 6: Testing & Validation

### 6.1 Pre-Integration Test Suite

**Create: `tests/test_existing_functionality.py`**

```python
import pytest
from fastapi.testclient import TestClient

def test_existing_endpoints_still_work(client):
    """Verify all existing endpoints still respond correctly"""
    # List your existing endpoints
    endpoints = [
        "/api/users",
        "/api/auth/login",
        # ... add all existing endpoints
    ]
    
    for endpoint in endpoints:
        response = client.get(endpoint)
        assert response.status_code in [200, 401]  # 401 if auth required

def test_existing_database_tables_intact(db_session):
    """Verify existing tables and data are unchanged"""
    from sqlalchemy import inspect
    
    inspector = inspect(db_session.bind)
    tables = inspector.get_table_names()
    
    # List your existing tables
    expected_tables = ['users', 'posts', 'comments']
    
    for table in expected_tables:
        assert table in tables
        
    # Verify data count hasn't changed
    from backend.models import User
    user_count = db_session.query(User).count()
    assert user_count == EXPECTED_USER_COUNT  # Set this before integration
```

**Run baseline tests:**
```bash
pytest tests/test_existing_functionality.py -v
```

### 6.2 Integration Test Suite

**Create: `tests/test_routeros_integration.py`**

```python
def test_routeros_endpoints_added(client):
    """Verify new RouterOS endpoints are available"""
    response = client.get("/api/routeros/devices")
    assert response.status_code in [200, 401]

def test_no_endpoint_conflicts(client):
    """Verify new endpoints don't override existing ones"""
    # Test that existing endpoints still work
    existing = client.get("/api/devices")  # Your existing device endpoint
    new = client.get("/api/routeros/devices")  # New RouterOS endpoint
    
    # Both should work independently
    assert existing.status_code != new.status_code or \
           existing.json() != new.json()

def test_database_isolation(db_session):
    """Verify new tables don't interfere with existing ones"""
    from backend.models import User
    from backend.routers.routeros.models import RouterOSDevice
    
    # Create RouterOS device
    device = RouterOSDevice(name="Test", ip_address="192.168.1.1")
    db_session.add(device)
    db_session.commit()
    
    # Verify existing User model still works
    user = User(username="test", email="test@test.com")
    db_session.add(user)
    db_session.commit()
    
    assert device.id is not None
    assert user.id is not None
```

### 6.3 Frontend Integration Tests

**Create: `frontend/src/tests/integration.test.jsx`**

```javascript
import { render, screen } from '@testing-library/react';
import App from '../App';

test('existing routes still work', () => {
  render(<App />);
  // Test your existing routes
  expect(screen.getByText(/existing page/i)).toBeInTheDocument();
});

test('new RouterOS route added', () => {
  render(<App />);
  // Navigate to new route
  window.history.pushState({}, 'RouterOS', '/routeros');
  expect(screen.getByText(/routeros/i)).toBeInTheDocument();
});

test('existing components not affected', () => {
  render(<App />);
  // Verify existing components still render
  expect(screen.getByTestId('existing-component')).toBeInTheDocument();
});
```

### 6.4 End-to-End Testing

**Manual Test Checklist:**

```markdown
## Existing Functionality Tests
- [ ] Login still works with existing credentials
- [ ] All existing pages load correctly
- [ ] Existing API calls return expected data
- [ ] Existing forms submit successfully
- [ ] Existing database queries work
- [ ] Existing file uploads work
- [ ] Existing user permissions work

## New RouterOS Functionality Tests
- [ ] Can add new RouterOS device
- [ ] Can test device connection
- [ ] Can execute RouterOS commands
- [ ] Grafana dashboard loads
- [ ] Prometheus metrics appear
- [ ] Device metrics update in real-time
- [ ] Config logs are recorded

## Integration Tests
- [ ] Both old and new features work together
- [ ] No 404 errors on any route
- [ ] No console errors in browser
- [ ] No database errors in logs
- [ ] Docker containers all running
- [ ] Network connectivity between services
```

**Automated E2E Test Script:**

```bash
#!/bin/bash
# test_integration.sh

echo "Testing existing functionality..."
curl -f http://localhost:8000/api/health || { echo "Existing health check failed"; exit 1; }

echo "Testing new RouterOS endpoints..."
curl -f http://localhost:8000/api/routeros/health || { echo "RouterOS health check failed"; exit 1; }

echo "Testing frontend..."
curl -f http://localhost:3000 || { echo "Frontend not accessible"; exit 1; }

echo "Testing Grafana..."
curl -f http://localhost:3001/api/health || { echo "Grafana not accessible"; exit 1; }

echo "Testing Prometheus..."
curl -f http://localhost:9090/-/healthy || { echo "Prometheus not healthy"; exit 1; }

echo "All integration tests passed!"
```

---

## Phase 7: Rollback Plan

### 7.1 Immediate Rollback (Emergency)

```bash
#!/bin/bash
# rollback.sh - Emergency rollback script

echo "EMERGENCY ROLLBACK INITIATED"

# 1. Stop new services
docker-compose stop routeros-postgres routeros-prometheus routeros-grafana

# 2. Restore code
git reset --hard HEAD~1  # Go back one commit
git push origin feature/routeros-integration -f

# 3. Restore database
psql production_db < backup_before_routeros_$(date +%Y%m%d).sql

# 4. Restart original services
docker-compose up -d

# 5. Verify
curl http://localhost:8000/api/health
```

### 7.2 Graceful Rollback (Planned)

**Step 1: Database Rollback**
```bash
# Rollback database migration
alembic downgrade -1

# Verify existing data intact
psql -c "SELECT COUNT(*) FROM users;"
```

**Step 2: Code Rollback**
```bash
# Revert to previous commit
git revert <commit-hash>

# Or delete new files
rm -rf backend/routers/routeros
rm -rf frontend/src/components/RouterOS
```

**Step 3: Docker Rollback**
```bash
# Restore original docker-compose
mv docker-compose.yml.backup docker-compose.yml

# Remove new containers
docker-compose down
docker volume rm routeros_prometheus_data routeros_grafana_data
```

**Step 4: Dependency Rollback**
```bash
# Backend
pip install -r dependencies-before-backend.txt

# Frontend
npm ci  # Uses package-lock.json
```

### 7.3 Partial Rollback

If only specific parts need rollback:

```bash
# Rollback only frontend
git checkout HEAD -- frontend/
npm install

# Rollback only backend
git checkout HEAD -- backend/
pip install -r requirements.txt

# Rollback only database
alembic downgrade <previous-version>
```

---

## Phase 8: Post-Integration Checklist

### 8.1 Code Quality Checks

```bash
# Backend linting
pylint backend/**/*.py

# Frontend linting
npm run lint

# Type checking (if using TypeScript)
npm run type-check

# Security scanning
pip-audit  # Python
npm audit  # Node.js
```

### 8.2 Performance Checks

```bash
# Check API response times
curl -w "@curl-format.txt" -o /dev/null -s http://localhost:8000/api/devices

# Check database query performance
psql -c "EXPLAIN ANALYZE SELECT * FROM routeros_devices;"

# Check memory usage
docker stats
```

### 8.3 Documentation Updates

**Update Required Documentation:**

- [ ] README.md - Add RouterOS features
- [ ] API_DOCUMENTATION.md - Add new endpoints
- [ ] DEPLOYMENT.md - Update deployment steps
- [ ] ARCHITECTURE.md - Add new components
- [ ] CHANGELOG.md - Document changes
- [ ] USER_GUIDE.md - Add user instructions

### 8.4 Team Communication

**Create Integration Report:**

```markdown
# RouterOS Integration Report

## Date: [Date]
## Author: [Your Name]
## Branch: feature/routeros-integration

## Summary
Successfully integrated RouterOS management system.

## Changes Made
- Added RouterOS device management backend
- Integrated Grafana monitoring
- Added Prometheus metrics collection
- Created new database tables: routeros_devices, routeros_logs

## New Endpoints
- GET /api/routeros/devices
- POST /api/routeros/devices
- POST /api/routeros/config/execute

## New Dependencies
Backend:
- routeros-api==0.17.0
- prometheus-client==0.19.0

Frontend:
- lucide-react==0.263.1

## Database Changes
- Added tables: routeros_devices, config_logs
- No modifications to existing tables

## Testing Results
- All existing tests passing: ✅
- New integration tests passing: ✅
- Manual testing completed: ✅

## Known Issues
- None

## Rollback Procedure
See ROLLBACK.md

## Next Steps
- Team training on new features
- Update monitoring dashboards
- Schedule code review
```

---

## Phase 9: Maintenance & Monitoring

### 9.1 Health Checks

**Create: `scripts/health_check.sh`**

```bash
#!/bin/bash

echo "=== Health Check ==="
echo ""

# Check API
echo "Checking API..."
curl -f http://localhost:8000/health && echo "✅ API healthy" || echo "❌ API down"

# Check Database
echo "Checking Database..."
docker exec routeros_postgres pg_isready && echo "✅ Database healthy" || echo "❌ Database down"

# Check Prometheus
echo "Checking Prometheus..."
curl -f http://localhost:9090/-/healthy && echo "✅ Prometheus healthy" || echo "❌ Prometheus down"

# Check Grafana
echo "Checking Grafana..."
curl -f http://localhost:3001/api/health && echo "✅ Grafana healthy" || echo "❌ Grafana down"

# Check RouterOS connectivity
echo "Checking RouterOS devices..."
curl -H "Authorization: Bearer $TOKEN" http://localhost:8000/api/routeros/devices | jq '.[] | "\(.name): \(.last_seen)"'
```

### 9.2 Monitoring Setup

**Add Alerts to Prometheus:**

```yaml
# prometheus/alerts.yml
groups:
  - name: routeros
    interval: 30s
    rules:
      - alert: RouterOSDeviceDown
        expr: up{job="routeros-snmp"} == 0
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "RouterOS device {{ $labels.instance }} is down"
          
      - alert: HighCPULoad
        expr: hrProcessorLoad > 80
        for: 10m
        labels:
          severity: warning
        annotations:
          summary: "High CPU load on {{ $labels.instance }}"
```

### 9.3 Backup Strategy

**Daily Backup Script:**

```bash
#!/bin/bash
# backup_routeros_data.sh

BACKUP_DIR="/backups/routeros"
DATE=$(date +%Y%m%d_%H%M%S)

# Backup database
pg_dump routeros_db > "$BACKUP_DIR/db_$DATE.sql"

# Backup Grafana dashboards
docker exec grafana grafana-cli admin export > "$BACKUP_DIR/grafana_$DATE.json"

# Backup Prometheus data
tar -czf "$BACKUP_DIR/prometheus_$DATE.tar.gz" /var/lib/prometheus

# Cleanup old backups (keep last 7 days)
find $BACKUP_DIR -mtime +7 -delete

echo "Backup completed: $DATE"
```

---

## Appendix A: Quick Reference

### Common Commands

```bash
# Start services
docker-compose up -d

# View logs
docker-compose logs -f [service-name]

# Restart service
docker-compose restart [service-name]

# Database migration
alembic upgrade head

# Run tests
pytest tests/
<invoke name="artifacts">
<parameter name="command">update</parameter>
<parameter name="id">llm-integration-sop</parameter>
<parameter name="old_str"># Run tests
pytest tests/</parameter>
<parameter name="new_str"># Run tests
pytest tests/ -v
Check API docs
open http://localhost:8000/docs
Access Grafana
open http://localhost:3001

### Port Reference

| Service | Port | Purpose |
|---------|------|---------|
| FastAPI | 8000 | Backend API |
| React | 3000 | Frontend UI |
| PostgreSQL | 5432 | Database |
| Prometheus | 9090 | Metrics storage |
| Grafana | 3001 | Visualization |
| SNMP Exporter | 9116 | SNMP translation |

### File Location Reference
Project Root
├── backend/
│   ├── main.py                    # Main FastAPI app
│   ├── routers/
│   │   └── routeros/             # NEW: RouterOS routes
│   ├── models/                   # Database models
│   └── requirements.txt          # Python dependencies
├── frontend/
│   ├── src/
│   │   ├── App.jsx              # Main React app
│   │   ├── components/
│   │   │   └── RouterOS/        # NEW: RouterOS components
│   │   └── services/
│   │       └── routeros/        # NEW: API clients
│   └── package.json             # Node dependencies
├── docker-compose.yml            # Container orchestration
├── prometheus/
│   └── prometheus.yml           # Metrics config
└── grafana/
├── provisioning/            # Auto-config
└── dashboards/              # Dashboard JSONs

---

## Appendix B: Troubleshooting Guide

### Issue: Port Already in Use

**Symptoms:**
Error: bind: address already in use

**Solution:**
```bash
# Find process using port
lsof -i :9090

# Kill process
kill -9 <PID>

# Or change port in docker-compose.yml
ports:
  - "9091:9090"
```

### Issue: Database Connection Failed

**Symptoms:**
sqlalchemy.exc.OperationalError: could not connect to server

**Solution:**
```bash
# Check if PostgreSQL is running
docker-compose ps postgres

# Check logs
docker-compose logs postgres

# Verify connection string
echo $DATABASE_URL

# Test connection manually
psql $DATABASE_URL -c "SELECT 1;"
```

### Issue: RouterOS API Connection Failed

**Symptoms:**
Connection failed: [Errno 111] Connection refused

**Solution:**
```bash
# Check RouterOS API is enabled
ssh admin@router-ip
/ip service print

# Enable API if disabled
/ip service set api disabled=no

# Check firewall rules
/ip firewall filter print

# Test from server
telnet router-ip 8728
```

### Issue: SNMP Metrics Not Appearing

**Symptoms:**
- Grafana shows "No Data"
- Prometheus targets down

**Solution:**
```bash
# Check SNMP is enabled on RouterOS
/snmp print

# Test SNMP manually
snmpwalk -v2c -c public router-ip

# Check SNMP exporter
curl http://localhost:9116/snmp?target=router-ip&module=mikrotik

# Verify Prometheus scraping
curl http://localhost:9090/api/v1/targets
```

### Issue: Frontend Can't Connect to Backend

**Symptoms:**
- CORS errors in browser console
- Network errors in React app

**Solution:**
```javascript
// Check CORS configuration in backend/main.py
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  // Add your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

// Check API base URL in frontend
const API_BASE = 'http://localhost:8000/api';  // Must match backend
```

### Issue: Grafana Dashboard Not Loading

**Symptoms:**
- Dashboard shows blank
- "Failed to load dashboard" error

**Solution:**
```bash
# Check Grafana logs
docker-compose logs grafana

# Verify Prometheus datasource
curl http://localhost:3001/api/datasources

# Re-provision datasources
docker-compose restart grafana

# Check dashboard JSON is valid
cat grafana/dashboards/routeros-dashboard.json | jq .
```

---

## Appendix C: Security Hardening Checklist

**Before Production Deployment:**

### Backend Security
- [ ] Change SECRET_KEY in environment variables
- [ ] Use strong database passwords
- [ ] Enable HTTPS/TLS
- [ ] Implement rate limiting
- [ ] Add request validation
- [ ] Enable CORS only for specific domains
- [ ] Use environment variables for all secrets
- [ ] Implement proper error handling (don't expose internals)
- [ ] Add input sanitization
- [ ] Enable SQL injection prevention (parameterized queries)

### Database Security
- [ ] Use least-privilege database users
- [ ] Enable SSL for database connections
- [ ] Implement regular backups
- [ ] Set up point-in-time recovery
- [ ] Enable audit logging
- [ ] Restrict network access
- [ ] Use strong passwords (20+ chars)
- [ ] Enable connection encryption

### RouterOS Security
- [ ] Create dedicated API user with minimal permissions
- [ ] Use strong passwords (20+ chars)
- [ ] Restrict API access by IP
- [ ] Enable API SSL/TLS
- [ ] Disable unused services
- [ ] Keep RouterOS updated
- [ ] Use SNMPv3 instead of v2c if possible
- [ ] Restrict SNMP community access by IP

### Docker Security
- [ ] Run containers as non-root user
- [ ] Use specific image versions (not :latest)
- [ ] Scan images for vulnerabilities
- [ ] Limit container resources
- [ ] Use Docker secrets for passwords
- [ ] Enable Docker Content Trust
- [ ] Keep Docker updated
- [ ] Use minimal base images

### Network Security
- [ ] Use firewall rules
- [ ] Implement VPN for remote access
- [ ] Use private networks for inter-service communication
- [ ] Enable DDoS protection
- [ ] Implement intrusion detection
- [ ] Use SSL/TLS everywhere
- [ ] Regular security audits

---

## Appendix D: LLM Comparison Matrix

When using different LLMs for integration help:

| LLM | Best For | Prompt Style | Notes |
|-----|----------|--------------|-------|
| Claude | Complex code analysis, detailed explanations | Detailed with context | Excellent at identifying conflicts |
| GPT-4 | Quick code generation, broad knowledge | Concise and specific | May need more specific prompts |
| Copilot | In-IDE code completion | Inline comments | Best for line-by-line coding |
| Gemini | Multi-modal tasks, document analysis | Visual + text | Good for architecture diagrams |
| Local LLMs | Privacy-sensitive code | Technical, detailed | May need more iterations |

**Best Practice:** Use Claude/GPT-4 for initial analysis, then Copilot for implementation.

---

## Document Control

**Version:** 1.0  
**Last Updated:** 2025-01-13  
**Author:** [Your Name]  
**Reviewed By:** [Reviewer Name]  
**Next Review Date:** [Date]

**Change Log:**
| Date | Version | Changes | Author |
|------|---------|---------|--------|
| 2025-01-13 | 1.0 | Initial creation | [Name] |

---

## Approval

**Technical Lead:** _________________ Date: _______  
**Project Manager:** _________________ Date: _______  
**DevOps Lead:** _________________ Date: _______

---

**END OF SOP**