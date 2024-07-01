from fastapi import APIRouter, Request, Query, Depends
from fastapi.responses import JSONResponse, FileResponse, RedirectResponse
from typing import Optional
from models.attractions import get_db_attrs_with_imgs, get_db_attr_with_imgs, get_db_mrts
from models.members import get_current_member

router = APIRouter()

@router.get("/", include_in_schema=False)
async def index(request: Request):
    return FileResponse("./static/index.html", media_type="text/html")

@router.get("/attraction/{id}", include_in_schema=False)
async def attraction(request: Request, id: int):
    return FileResponse("./static/attraction.html", media_type="text/html")

@router.get("/booking", include_in_schema=False)
async def booking(request: Request):  #, user: dict = Depends(get_current_member)
    return FileResponse("./static/booking.html", media_type="text/html")

@router.get("/thankyou", include_in_schema=False)
async def thankyou(request: Request):
    return FileResponse("./static/thankyou.html", media_type="text/html")

@router.get("/api/attractions")
async def get_attractions(
    request: Request, 
    page: int = Query(..., ge=0), 
    size: int = Query(12, ge=1),
    keyword: Optional[str] = Query(None)
):
    attractions = get_db_attrs_with_imgs(page, size, keyword)

    # Calculate nextPage based on the remaining attractions
    remaining_attractions = get_db_attrs_with_imgs(page + 1, size, keyword)
    next_page = page + 1 if len(remaining_attractions) > 0 else None

    # Return the modified response structure
    return JSONResponse(status_code=200, content={
        "nextPage": next_page,
        "data": attractions
    })

@router.get("/api/attraction/{attractionId}", response_class=JSONResponse)
async def get_attr(request: Request, attractionId: Optional[int] = None):
    if attractionId:
        data = get_db_attr_with_imgs(attractionId)
        return JSONResponse(status_code=200, content={"data": data})

@router.get("/api/mrts", response_class=JSONResponse)
async def get_mrts(request: Request):
    data = get_db_mrts()
    return JSONResponse(status_code=200, content={"data": data})