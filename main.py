from fastapi import FastAPI, Request
from fastapi.staticfiles import StaticFiles

from handlers import register_exception_handlers
import os

from controllers.member import router as member_router
from controllers.attractions import router as attractions_router
from controllers.booking import router as booking_router


app = FastAPI()

app.include_router(member_router)
app.include_router(attractions_router)
app.include_router(booking_router)

# Mount the static directory
app.mount("/static", StaticFiles(directory="static"), name="static")
#from routes import router

register_exception_handlers(app)
#app.include_router(router)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000)
    