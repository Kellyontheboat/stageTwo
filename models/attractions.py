from database import execute_query
from exceptions import CustomHTTPException
from typing import Optional, List

#??是否會再寫一個專門給booking page的get_db_attr_with_img？因為不需要那麼多資訊
def get_db_attr_with_imgs(attractionId):
    query = "SELECT * FROM attractions WHERE id = %s"
    images_query = "SELECT url FROM images WHERE attraction_id = %s"

    attraction_result = execute_query(query, (attractionId,))

    if attraction_result:
        attraction = attraction_result[0]
        image_records = execute_query(images_query, (attraction["id"],))
        if image_records:
            attraction["images"] = [record["url"] for record in image_records]
        return attraction
    else:
        raise CustomHTTPException(status_code=400, detail={"error": True, "message": "Invalid attraction ID"})

def get_db_attrs_with_imgs(page: int, size: int, keyword: Optional[str] = None) -> List[dict]:
    offset = page * size
    base_query = "SELECT * FROM attractions"
    images_query = "SELECT url FROM images WHERE attraction_id = %s"

    params = []
    query_conditions = []

    if keyword:
        query_conditions.append("name LIKE %s OR mrt = %s")
        params.extend([f"%{keyword}%", keyword])

    if query_conditions:
        base_query += " WHERE " + " AND ".join(query_conditions)

    attractions_query = f"{base_query} LIMIT %s OFFSET %s"
    params.extend([size, offset])

    attractions = execute_query(attractions_query, tuple(params))

    for attraction in attractions:
        attraction_id = attraction["id"]
        image_records = execute_query(images_query, (attraction_id,))
        attraction["images"] = [record["url"] for record in image_records]

    return attractions

def get_db_mrts() -> List[str]:
    query = """
    SELECT mrt 
    FROM (
        SELECT mrt, COUNT(*) as frequency 
        FROM attractions 
        GROUP BY mrt
    ) AS mrt_counts 
    ORDER BY frequency DESC
    """
    result = execute_query(query)
    mrt_values = [row['mrt'] for row in result]
    return mrt_values

def get_db_attr_for_booking(attractionId):
    query = "SELECT id, name, address FROM attractions WHERE id = %s"
    images_query = "SELECT url FROM images WHERE attraction_id = %s LIMIT 1"

    attraction_result = execute_query(query, (attractionId,))
    
    if attraction_result:
        attraction = attraction_result[0]
        #{'id': 2, 'name': '大稻埕碼頭', 'address': '臺北市  大同區環河北路一段'}
        image_dict = execute_query(images_query, (attraction["id"],))
        #[{'url': 'https://www.travel.taipei/d_upload_ttn/sceneadmin/pic/11000340.jpg'}]
        if not image_dict:
            print("No image found for this attraction.")
            return attraction

        image = image_dict[0].get('url')
        attraction["image"] = image

        return attraction #{'id': 14, 'name': '中正紀念堂', 'address': '臺北市  中正區中山南路21號', 'image': 'https://www.travel.taipei/d_upload_ttn/sceneadmin/pic/11000375.jpg'}

    else:
        raise CustomHTTPException(status_code=400, detail="Invalid attraction ID")