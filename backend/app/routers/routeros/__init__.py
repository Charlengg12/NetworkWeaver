from fastapi import APIRouter
from .devices import router as devices_router
from .config import router as config_router
from .metrics import router as metrics_router

router = APIRouter(prefix="/routeros", tags=["RouterOS"])
router.include_router(devices_router)
router.include_router(config_router)
router.include_router(metrics_router)
