import math
import heapq
from typing import List, Dict, Set, Optional, Tuple
from .models import City

class Edge:
    def __init__(self, to_city: City, distance_km: float):
        self.to_city = to_city
        self.distance_km = distance_km

class Graph:
    def __init__(self):
        self.adjacency: Dict[str, List[Edge]] = {}
        self.cities_map: Dict[str, City] = {}

    def add_city(self, city: City):
        if city.name not in self.adjacency:
            self.adjacency[city.name] = []
            self.cities_map[city.name] = city

    def add_undirected_edge(self, city_a: City, city_b: City, distance_km: float):
        self.add_city(city_a)
        self.add_city(city_b)
        self.adjacency[city_a.name].append(Edge(city_b, distance_km))
        self.adjacency[city_b.name].append(Edge(city_a, distance_km))

    def get_neighbors(self, city_name: str) -> List[Edge]:
        return self.adjacency.get(city_name, [])

    def get_city(self, name: str) -> Optional[City]:
        return self.cities_map.get(name)

    def get_all_cities(self) -> List[City]:
        return list(self.cities_map.values())

def haversine(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    R = 6371.0  # Earth radius in km
    d_lat = math.radians(lat2 - lat1)
    d_lon = math.radians(lon2 - lon1)
    a = (math.sin(d_lat / 2) ** 2 +
         math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) *
         math.sin(d_lon / 2) ** 2)
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c

def build_complete_graph(cities: List[City]) -> Graph:
    graph = Graph()
    for i in range(len(cities)):
        for j in range(i + 1, len(cities)):
            c1 = cities[i]
            c2 = cities[j]
            dist = haversine(c1.latitude, c1.longitude, c2.latitude, c2.longitude)
            graph.add_undirected_edge(c1, c2, dist)
    return graph

def plan_greedy_route(graph: Graph, start_city_name: str, must_visit_names: List[str], return_to_start: bool) -> Tuple[List[City], float, str]:
    start_city = graph.get_city(start_city_name)
    if not start_city:
        raise ValueError(f"Start city {start_city_name} not found")

    must_visit_cities = []
    for name in must_visit_names:
        city = graph.get_city(name)
        if city:
            must_visit_cities.append(city)
    
    # Logic similar to Java implementation
    route = [start_city]
    remaining = list(must_visit_cities)
    # Remove start city if present (matches by name since Pydantic objects might be new instances)
    remaining = [c for c in remaining if c.name != start_city.name]
    
    current = start_city
    total_distance = 0.0

    while remaining:
        next_city = None
        best_dist = float('inf')
        
        for candidate in remaining:
            # For complete graph, we can calculate dist directly if edge technically exists, 
            # but using haversine is safer/easier if graph structure varies.
            # In our build_complete_graph, edges exist.
            dist = haversine(current.latitude, current.longitude, candidate.latitude, candidate.longitude)
            if dist < best_dist:
                best_dist = dist
                next_city = candidate
        
        if next_city:
            total_distance += best_dist
            route.append(next_city)
            current = next_city
            remaining.remove(next_city)
        else:
            break

    if return_to_start and len(route) > 1:
        dist_back = haversine(current.latitude, current.longitude, start_city.latitude, start_city.longitude)
        total_distance += dist_back
        route.append(start_city)
        
    description = f"Greedy route starting from {start_city.name}. Total distance: {total_distance:.2f} km."
    return route, total_distance, description

def plan_intelligent_route(graph: Graph, start_name: str, end_name: str) -> Tuple[List[City], float, str, List[City]]:
    start_city = graph.get_city(start_name)
    end_city = graph.get_city(end_name)
    
    if not start_city or not end_city:
        raise ValueError("Start or End city not found")

    # Dijkstra
    distances = {city.name: float('inf') for city in graph.get_all_cities()}
    previous = {city.name: None for city in graph.get_all_cities()}
    distances[start_name] = 0.0
    
    pq = [(0.0, start_name)]
    
    while pq:
        d, current_name = heapq.heappop(pq)
        
        if d > distances[current_name]:
            continue
        
        if current_name == end_name:
            break
            
        current_node_neighbors = graph.get_neighbors(current_name)
        for edge in current_node_neighbors:
            neighbor_name = edge.to_city.name
            new_dist = d + edge.distance_km
            
            if new_dist < distances[neighbor_name]:
                distances[neighbor_name] = new_dist
                previous[neighbor_name] = current_name
                heapq.heappush(pq, (new_dist, neighbor_name))
                
    # Reconstruct path
    path = []
    curr = end_name
    while curr:
        path.append(graph.get_city(curr))
        curr = previous[curr]
    path.reverse()
    
    if not path or path[0].name != start_name:
         # Simplified fallback if disconnected (shouldn't happen in complete graph)
         return [], 0.0, "No path found", []

    shortest_dist = distances[end_name]
    
    # "Interesting cities" logic from Java
    # Just a simplified version here: find cities physically between start/end but not on shortest path
    # For a complete graph, shortest path is direct edge. So interesting cities are any somewhat close to the line.
    
    direct_dist = haversine(start_city.latitude, start_city.longitude, end_city.latitude, end_city.longitude)
    suggested = []
    
    all_cities = graph.get_all_cities()
    for city in all_cities:
        if city.name == start_name or city.name == end_name:
            continue
            
        d_start = haversine(start_city.latitude, start_city.longitude, city.latitude, city.longitude)
        d_end = haversine(city.latitude, city.longitude, end_city.latitude, end_city.longitude)
        
        # If detour is small (e.g. < 50% extra)
        if (d_start + d_end) < direct_dist * 1.5:
             suggested.append(city)
             
    # Sort by detour cost
    suggested.sort(key=lambda c: (haversine(start_city.latitude, start_city.longitude, c.latitude, c.longitude) + 
                                  haversine(c.latitude, c.longitude, end_city.latitude, end_city.longitude)))
    
    suggested = suggested[:3] # Top 3
    
    # Build final route: Start -> Suggested -> End (Simplified TSP)
    # Ideally we'd insert them into the path. Since path is likely [Start, End], we just insert them.
    
    final_route = [start_city]
    current = start_city
    total_dist = 0.0
    
    for stop in suggested:
        dist = haversine(current.latitude, current.longitude, stop.latitude, stop.longitude)
        total_dist += dist
        final_route.append(stop)
        current = stop
        
    final_dist_end = haversine(current.latitude, current.longitude, end_city.latitude, end_city.longitude)
    total_dist += final_dist_end
    final_route.append(end_city)
    
    desc = f"Intelligent route from {start_name} to {end_name} via interesting stops."
    return final_route, total_dist, desc, suggested
