from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import pandas as pd
import os
from typing import List

from .models import City, RouteRequest, RouteResponse
from .logic import build_complete_graph, plan_greedy_route, plan_intelligent_route, City as LogicCity

app = FastAPI(title="Travel Planner API")

# Allow CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # For dev; restrict in prod
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global graph
city_graph = None
all_cities_data = []

@app.on_event("startup")
def load_data():
    global city_graph, all_cities_data
    csv_path = os.path.join(os.path.dirname(__file__), "..", "data", "cities.csv")
    if not os.path.exists(csv_path):
        print(f"Warning: Data file not found at {csv_path}")
        return

    df = pd.read_csv(csv_path)
    # Clean column names (handle possible "# name" or similar)
    df.columns = [c.strip().lstrip('#').strip() for c in df.columns]
    
    cities = []
    for _, row in df.iterrows():
        c = LogicCity(name=row['name'], latitude=row['lat'], longitude=row['lon'])
        cities.append(c)
    
    all_cities_data = cities
    city_graph = build_complete_graph(cities)
    print(f"Loaded {len(cities)} cities.")

@app.get("/cities", response_model=List[City])
def get_cities():
    return [City(name=c.name, latitude=c.latitude, longitude=c.longitude) for c in all_cities_data]

@app.post("/plan/greedy", response_model=RouteResponse)
def plan_greedy(request: RouteRequest):
    if not city_graph:
        raise HTTPException(status_code=503, detail="Data not loaded")
    
    must_visit = request.must_visit if request.must_visit else []
    # If must_visit is empty, maybe user wants to visit ALL cities? 
    # The README says "Visit all cities" is the default behavior if just start is given?
    # Let's assume if must_visit is explicitly empty list, we visit none.
    # If user wants all, they should pass all names or we add a flag. 
    # For now, let's implement the logic: If must_visit is None/Empty, visit ALL cities (TSP style) 
    # matching the "Example 1: Visit all cities starting from Victoria" behavior.
    
    if not must_visit:
        must_visit = [c.name for c in all_cities_data if c.name != request.start_city]
        
    try:
        route, dist, desc = plan_greedy_route(city_graph, request.start_city, must_visit, request.return_to_start)
        
        response_route = [City(name=c.name, latitude=c.latitude, longitude=c.longitude) for c in route]
        return RouteResponse(
            route=response_route,
            total_distance_km=dist,
            description=desc,
            suggested_cities=[]
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/plan/intelligent", response_model=RouteResponse)
def plan_intelligent(request: RouteRequest):
    if not city_graph:
        raise HTTPException(status_code=503, detail="Data not loaded")
        
    if not request.end_city:
        raise HTTPException(status_code=400, detail="End city required for intelligent routing")

    try:
        route, dist, desc, suggested = plan_intelligent_route(city_graph, request.start_city, request.end_city)
        
        response_route = [City(name=c.name, latitude=c.latitude, longitude=c.longitude) for c in route]
        response_suggested = [City(name=c.name, latitude=c.latitude, longitude=c.longitude) for c in suggested]
        
        return RouteResponse(
            route=response_route,
            total_distance_km=dist,
            description=desc,
            suggested_cities=response_suggested
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
