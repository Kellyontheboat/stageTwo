from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, HttpUrl
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from models.booking import BookingWrapper
from models.members import UserLogin, CurrentMember
from models.booking import BookingWrapper, BookingResponse, Booking, get_booking_from_db
from exceptions import CustomHTTPException
from starlette.requests import Request

from models.booking import add_booking_into_db
from controllers.member import get_current_member

from models.booking import BookingWrapper, BookingData, Attraction, delete_booking_from_db
from typing import List
import logging

router = APIRouter()

#???應該要區分一個是沒有權限一個是booking Data沒有完全填寫 或是內容有誤
@router.post("/api/booking", response_model=BookingWrapper)
async def create_booking(booking_data: BookingWrapper, user: dict = Depends(get_current_member)):
    try:
        # Convert user dictionary to UserLogin object
        user_obj = CurrentMember(**user)        
        booking_info = booking_data.data

        # Add booking to the database
        # Pass the Booking instance to the function
        booking_dt = {
            "attraction_id": booking_info.attraction.id,
            "date": booking_info.date,
            "time": booking_info.time,
            "price": booking_info.price,
            "member_id": user_obj.id
        }
            
        booking = Booking(**booking_dt)
        add_booking_into_db(booking)

        return booking_data
    except ValueError as e:
        logging.error(f"ValueError: {e}")
        raise HTTPException(status_code=422, detail=str(e))
    except RequestValidationError as e:
        logging.error(f"RequestValidationError: {e.errors()}")
        raise HTTPException(status_code=422, detail="Validation error")
    except CustomHTTPException as e:
        logging.error(f"CustomHTTPException: {e}")
        raise e
    except Exception as e:
        logging.error(f"Unexpected error: {e}")
        raise HTTPException(status_code=500, detail="An unexpected error occurred")
      
@router.get("/api/booking", response_model=BookingResponse)
async def fetch_bookings(user: dict = Depends(get_current_member)):
    try:
        member_id = user.get('id')
        return get_booking_from_db(member_id)

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/api/booking/{booking_id}", response_model=dict)
async def delete_booking(booking_id: int, user: dict = Depends(get_current_member)):
    response = delete_booking_from_db(booking_id)
    if response["success"]:
        return {"message": "Booking deleted successfully"}
    else:
        raise HTTPException(status_code=500, detail=response["error"])
