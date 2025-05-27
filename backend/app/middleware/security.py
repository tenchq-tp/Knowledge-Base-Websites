from starlette.middleware.base import BaseHTTPMiddleware
from fastapi import Request
from starlette.responses import Response
from starlette.middleware.base import BaseHTTPMiddleware
from fastapi import Request
from fastapi.responses import JSONResponse
from datetime import datetime, timedelta
from collections import defaultdict

class RateLimitMiddleware(BaseHTTPMiddleware):
    def __init__(self, app, calls: int = 100, period: int = 3600):
        super().__init__(app)
        self.calls = calls
        self.period = period
        self.clients = defaultdict(list)

    async def dispatch(self, request: Request, call_next):
        client_ip = request.client.host
        now = datetime.utcnow()

        # ลบ request เก่า ๆ เกินช่วงเวลาออก
        self.clients[client_ip] = [
            ts for ts in self.clients[client_ip]
            if now - ts < timedelta(seconds=self.period)
        ]

        # ตรวจสอบจำนวน request
        if len(self.clients[client_ip]) >= self.calls:
            return JSONResponse(
                status_code=429,
                content={"detail": "Rate limit exceeded"}
            )

        # บันทึก timestamp ของ request นี้
        self.clients[client_ip].append(now)

        return await call_next(request)

class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    def __init__(self, app):
        super().__init__(app)

    async def dispatch(self, request: Request, call_next):
        response: Response = await call_next(request)

        # Security headers
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["Permissions-Policy"] = "geolocation=(), microphone=(), camera=()"

        # HSTS header (only for HTTPS)
        if request.url.scheme == "https":
            response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"

        return response