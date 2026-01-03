# Travel Planner - Full Stack Route Optimizer 🗺️

A modern web-based travel route planner built for the Victoria Hackathon! This application helps users plan efficient travel routes between cities using advanced graph algorithms.

## Overview

This project is a full-stack application that visualizes travel routes on an interactive map. It implements multiple pathfinding strategies, including a **Greedy Nearest-Neighbor algorithm** and an **Intelligent Route Optimizer**, to solve the Traveling Salesperson Problem (TSP) variants.

## Features

- 🌍 **Interactive Map** - Visualizes routes on OpenStreetMap using Leaflet.
- 🏙️ **Smart Routing** - Choose between "Greedy" (fastest calculation) and "Intelligent" (optimized path) modes.
- 📍 **Real-World Distances** - Uses the Haversine formula for accurate geodesic distance calculations.
- 🛣️ **Road Network Visualization** - Fetches real driving paths via OSRM (Open Source Routing Machine).
- 🎨 **Modern UI** - Clean, responsive interface built with React and Tailwind CSS.

## Tech Stack

### Frontend
- **React** (Vite)
- **Tailwind CSS** for styling
- **React Leaflet** for map visualization
- **OpenStreetMap** & **OSRM** for map data and routing

### Backend
- **Python** (FastAPI)
- **Pandas** for data handling
- **NetworkX** / Custom Graph implementations

## Project Structure

```
Cursor-Victoria-Hackathon/
├── backend/                  # Python FastAPI Backend
│   ├── app/
│   │   ├── main.py           # API Endpoints
│   │   ├── logic.py          # Routing Algorithms
│   │   └── models.py         # Pydantic Models
│   ├── data/
│   │   └── cities.csv        # City Data
│   └── requirements.txt      # Python Dependencies
│
├── frontend/                 # React Frontend
│   ├── src/
│   │   ├── components/       # Map & UI Components
│   │   └── services/         # API Integration
│   └── package.json          # Node Dependencies
└── README.md                 # This file
```

## Getting Started

### Prerequisites
- **Node.js** (v16+)
- **Python** (v3.8+)

### 1. Backend Setup

Navigate to the backend directory and start the server:

```bash
cd backend

# Create a virtual environment (optional but recommended)
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run the server
uvicorn app.main:app --reload --port 8002
```
The backend API will be available at `http://localhost:8002`.

### 2. Frontend Setup

Open a new terminal, navigate to the frontend directory, and start the client:

```bash
cd frontend

# Install dependencies
npm install

# Run the development server
npm run dev
```

## Usage

1. **Select a Start City**: Choose your starting location from the dropdown.
2. **Choose Mode**:
   - **Greedy**: Visits the nearest unvisited city next. Good for quick, simple routes.
   - **Intelligent**: Uses a more advanced heuristic to find a shorter overall path.
3. **Calculate**: Click "Calculate Route" to see the path on the map.
4. **Explore**: The map will zoom to show your route, with markers for each stop.

## License

This project is open-source and available under the MIT License.
