from pydantic import BaseModel
from typing import List, Optional

class City(BaseModel):
    name: str
    latitude: float
    longitude: float

class RouteRequest(BaseModel):
    start_city: str
    must_visit: Optional[List[str]] = None
    return_to_start: bool = False
    end_city: Optional[str] = None # For intelligent routing

class RouteResponse(BaseModel):
    route: List[City]
    total_distance_km: float
    description: str
    suggested_cities: List[City] = []
