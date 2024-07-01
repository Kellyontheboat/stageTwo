from fastapi import Request
from fastapi.responses import JSONResponse, RedirectResponse
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException
from exceptions import CustomHTTPException
import logging

# Create a logger
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def http_exception_handler(request: Request, exc: StarletteHTTPException):
    if exc.status_code == 404:
        return JSONResponse(status_code=404, content={"data": None})
    # else:
    #     return JSONResponse(status_code=exc.status_code, content={"error": True})
    else:
        logger.error(f"HTTPException: {exc.detail}")
        return JSONResponse(status_code=exc.status_code, content={"error": True, "detail": exc.detail})

async def validation_exception_handler(request: Request, exc: RequestValidationError):
    # Log the validation error details
    logger.error(f"Validation error: {exc.errors()}")
    return JSONResponse(status_code=422, content={"error": "validation_exception_handler", "details": exc.errors()})

async def general_exception_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=500,
        content={"error": True, "message": "Internal server error"},
    )

async def custom_http_exception_handler(request: Request, exc: CustomHTTPException):
    # if exc.status_code == 401:
    #     return RedirectResponse(url="/")
    logger.error(f"CustomHTTPException: {exc.detail}")
    return JSONResponse(
        status_code=exc.status_code,
        content={"error": True, "message": exc.detail}
        #content=exc.detail
    )

def register_exception_handlers(app):
    app.add_exception_handler(StarletteHTTPException, http_exception_handler)
    app.add_exception_handler(RequestValidationError, validation_exception_handler)
    app.add_exception_handler(Exception, general_exception_handler)
    app.add_exception_handler(CustomHTTPException, custom_http_exception_handler)


