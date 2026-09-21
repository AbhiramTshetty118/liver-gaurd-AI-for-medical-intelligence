"""
LiverGuard FastAPI Application Entrypoint.
Production-ready, robust, versioned REST API (/api/v1).
"""

import time
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError

from backend.config import settings
from backend.database import init_db
from backend.routes.predict import router as predict_router
from backend.routes.info import router as info_router
from backend.routes.auth_routes import router as auth_router
from backend.routes.history import router as history_router

# Rate limiting dictionary: ip -> list of timestamps
REQUEST_LOG = {}
RATE_LIMIT_WINDOW_SECONDS = 60
MAX_REQUESTS_PER_WINDOW = 120

app = FastAPI(
    title="LiverGuard API",
    description=(
        "An Intelligent Machine Learning API for Liver Disease Risk Screening and Explainability. "
        "Trained on the Indian Liver Patient Dataset (ILPD) with rigorous scikit-learn pipelines, "
        "clinical threshold calibration, and TreeSHAP attribution."
    ),
    version=settings.VERSION,
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def on_startup():
    init_db()

# Simple Rate Limiting Middleware
@app.middleware("http")
async def rate_limiting_middleware(request: Request, call_next):
    client_ip = request.client.host if request.client else "127.0.0.1"
    now = time.time()
    
    # Prune old requests
    timestamps = REQUEST_LOG.get(client_ip, [])
    timestamps = [t for t in timestamps if now - t < RATE_LIMIT_WINDOW_SECONDS]
    
    if len(timestamps) >= MAX_REQUESTS_PER_WINDOW:
        return JSONResponse(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            content={"detail": "Too many requests. Please slow down and try again shortly."}
        )

    timestamps.append(now)
    REQUEST_LOG[client_ip] = timestamps

    response = await call_next(request)
    return response

# Validation Error Handler: Returns clear, helpful clinical error messages
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    errors = []
    for err in exc.errors():
        field = ".".join(str(loc) for loc in err.get("loc", []))
        msg = err.get("msg", "Invalid input")
        errors.append(f"{field}: {msg}")
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "detail": "Input validation failure",
            "errors": errors
        }
    )

# Safe Global Exception Handler: Never expose raw stack traces to users
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    print(f"Unhandled Exception on {request.method} {request.url.path}: {exc}")
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "detail": "An internal error occurred while processing the request. Our technical team has been alerted.",
            "status_code": 500
        }
    )

# Versioned API v1 Router
v1_router = FastAPI()
app.include_router(predict_router, prefix=settings.API_V1_PREFIX)
app.include_router(info_router, prefix=settings.API_V1_PREFIX)
app.include_router(auth_router, prefix=settings.API_V1_PREFIX)
app.include_router(history_router, prefix=settings.API_V1_PREFIX)

@app.get("/")
def root():
    return {
        "project": "LiverGuard",
        "description": "Intelligent ML-based Liver Disease Risk Screening & Explainability API",
        "version": settings.VERSION,
        "docs": "/docs",
        "status": "operational"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
