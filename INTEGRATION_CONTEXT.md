# RouterOS Integration Context

## Current Project Overview
- **Tech Stack**: FastAPI (Backend), React + Vite (Frontend), PostgreSQL (Database), Docker Compose
- **Backend Framework**: FastAPI
- **Frontend Framework**: React
- **Database**: PostgreSQL
- **Existing Features**: 
    - Device management (generic)
    - Authentication
    - Monitoring (Prometheus, Grafana, SNMP Exporter)
    - Wireguard VPN

## Integration Goals
- [ ] Add RouterOS device management
- [ ] Integrate Grafana monitoring (specifically for RouterOS)
- [ ] Add SNMP metrics collection (specifically for RouterOS)
- [ ] Implement config execution

## Files That Must NOT Be Modified (or modified with extreme caution)
- `backend/app/main.py` (Core routing)
- `frontend/src/App.jsx` (Core routing)
- `docker-compose.yml` (Core infrastructure)
- `backend/app/database.py` (Core DB connection)

## Integration Constraints
- Must maintain existing API endpoints.
- Database changes must be additive only (no drops).
- Frontend routes must not conflict (use `/routeros/*`).
- Port allocations:
    - 8000: Backend
    - 5173: Frontend
    - 5432: Postgres (ConfigWeaver)
    - 9090: Prometheus
    - 3000: Grafana
    - 9116: SNMP Exporter
    - 51820: Wireguard

## Existing Patterns to Follow
- Authentication: JWT (likely, based on `python-jose` and `passlib` in requirements).
- API Structure: `/routers/module.py` included in `main.py`.
- State Management: React `useState`/`useEffect` + Context (implied).
