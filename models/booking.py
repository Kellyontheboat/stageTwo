from pydantic import BaseModel, constr, PositiveInt, validator, HttpUrl, Field
from models.attractions import get_db_attr_for_booking
from fastapi import HTTPException
from datetime import datetime
from database import execute_query
import logging
from typing import List


class Attraction(BaseModel):
    id: int
    name: str
    address: str
    image: HttpUrl

class BookingData(BaseModel):
    attraction: Attraction
    date: constr(pattern=r'^\d{4}-\d{2}-\d{2}$')
    time: constr(pattern=r'^(morning|afternoon)$')
    price: PositiveInt
    
class BookingDataWithId(BaseModel):
    id: int
    attraction: Attraction
    date: constr(pattern=r'^\d{4}-\d{2}-\d{2}$')
    time: constr(pattern=r'^(morning|afternoon)$')
    price: PositiveInt

class BookingWrapper(BaseModel):
    data: BookingData
    
class BookingWrapperWithId(BaseModel):
    data: BookingDataWithId
    
class Booking(BaseModel):
    attraction_id: PositiveInt
    date: constr(pattern=r'^\d{4}-\d{2}-\d{2}$')
    time: constr(pattern=r'^(morning|afternoon)$')
    price: PositiveInt
    member_id: PositiveInt
    
class BookingResponse(BaseModel):
    bookings: List[BookingWrapperWithId]
    total_cost: int = Field(..., ge=0)
    
def add_booking_into_db(booking: Booking):

    query = """
    INSERT INTO bookings (attraction_id, date, time, price, member_id, created_at)
    VALUES (%s, %s, %s, %s, %s, %s)
    """
    
    try:
        execute_query(
            query,
            (booking.attraction_id, booking.date, booking.time, booking.price, booking.member_id, datetime.now()),
            commit=True
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to add booking to DB: {e}")
      
def get_booking_from_db(member_id):
    bookings_query =  """
      SELECT id, attraction_id, date, time, price 
      FROM bookings 
      WHERE member_id = %s 
      ORDER BY created_at DESC
    """
    bookings = execute_query(bookings_query, (member_id,))
    # [{'attraction_id': 6, 'date': datetime.date(2024, 6, 15), 'time': 'afternoon', 'price': 2000}, {'attraction_id': 14, 'date': datetime.date(2024, 6, 17), 'time': 'morning', 'price': 2500}]
    booking_data = []
    total_cost = 0
    for booking in bookings:
        attraction_id = booking['attraction_id']
        attraction_info = get_db_attr_for_booking(attraction_id)
        booking_data.append({
            'data': {
                'id': booking['id'],
                'attraction': attraction_info,
                'date': booking['date'].strftime('%Y-%m-%d'),
                'time': booking['time'],
                'price': booking['price'],
            }
        })
        total_cost += booking['price']
        
    print ({
    'bookings': booking_data,
    'total_cost': total_cost
    })
        
    return {
        'bookings': booking_data,
        'total_cost': total_cost
    }
# {'bookings': [{'data': {'id': 41, 'attraction': {'id': 3, 'name': '士林官邸', 'address': '臺北市  士林區福林路60號', 'image': 'https://.jpg'}, 'date': '2024-07-18', 'time': 'morning', 'price': 2500}}, {'data': {'id': 40, 'attraction': {'id': 6, 'name': '陽明山溫泉區', 'address': '臺北市  北投區竹子湖路1之20號', 'image': 'https://.jpg'}, 'date': '2024-07-09', 'time': 'afternoon', 'price': 2000}}], 'total_cost': 8500}

def delete_booking_from_db(booking_id):
    print("Attempting to delete booking with ID:", booking_id)
    delete_query = """
        DELETE FROM bookings
        WHERE id = %s
    """
    try:
        execute_query(delete_query, (booking_id,), commit=True)
        print("Booking deleted successfully from DB.")
        return {"success": True}
    except Exception as e:
        print("Error deleting booking from DB:", str(e))
        raise HTTPException(status_code=500, detail=f"Error deleting booking from DB: {str(e)}")
