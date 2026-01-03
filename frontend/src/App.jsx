import { useState, useEffect } from 'react';
import { getCities, planGreedyRoute, planIntelligentRoute } from './services/api';
import MapVisualization from './components/MapVisualization';

function App() {
  const [cities, setCities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Form State
  const [mode, setMode] = useState('greedy'); // 'greedy' or 'intelligent'
  const [startCity, setStartCity] = useState('');
  const [endCity, setEndCity] = useState('');
  const [returnToStart, setReturnToStart] = useState(false);

  // Results
  const [routeResult, setRouteResult] = useState(null);

  useEffect(() => {
    // Load initial cities
    getCities()
      .then(setCities)
      .catch(err => {
        console.error(err);
        setError("Failed to load cities. Is the backend running?");
      });
  }, []);

  const handlePlan = async () => {
    if (!startCity) {
      alert("Please select a start city");
      return;
    }

    setLoading(true);
    setError(null);
    setRouteResult(null);

    try {
      let result;
      if (mode === 'greedy') {
        result = await planGreedyRoute(startCity, [], returnToStart);
      } else {
        if (!endCity) {
          alert("Please select an destination city");
          setLoading(false);
          return;
        }
        result = await planIntelligentRoute(startCity, endCity);
      }
      setRouteResult(result);
    } catch (err) {
      console.error(err);
      setError("Failed to plan route. " + (err.response?.data?.detail || err.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex flex-col items-center py-10 px-4 font-sans text-slate-100">
      <header className="mb-10 text-center space-y-2">
        <h1 className="text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400 drop-shadow-sm">
          Travel Planner
        </h1>
        <p className="text-indigo-200 text-lg font-light tracking-wide">
          Explore the world with Graph Algorithms
        </p>
      </header>

      <main className="w-full max-w-6xl grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Controls Panel */}
        <div className="md:col-span-1 glass-panel p-6 rounded-2xl space-y-6 h-fit">
          <div>
            <label className="block text-sm font-medium text-indigo-200 mb-2">Planning Mode</label>
            <div className="flex rounded-lg shadow-lg overflow-hidden" role="group">
              <button
                type="button"
                className={`flex-1 px-4 py-3 text-sm font-bold transition-all duration-200
                  ${mode === 'greedy'
                    ? 'bg-indigo-600 text-white shadow-inner'
                    : 'bg-slate-800/50 text-slate-300 hover:bg-slate-700/50'}`}
                onClick={() => setMode('greedy')}
              >
                Tour (Circuit)
              </button>
              <button
                type="button"
                className={`flex-1 px-4 py-3 text-sm font-bold transition-all duration-200
                  ${mode === 'intelligent'
                    ? 'bg-indigo-600 text-white shadow-inner'
                    : 'bg-slate-800/50 text-slate-300 hover:bg-slate-700/50'}`}
                onClick={() => setMode('intelligent')}
              >
                Point-to-Point
              </button>
            </div>
            <p className="text-xs text-slate-400 mt-2 italic">
              {mode === 'greedy'
                ? "Visit all cities starting from one point (Nearest Neighbor)."
                : "Find a route between two cities with interesting stops."}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-indigo-200 mb-2">Start City</label>
            <select
              className="w-full input-field p-3"
              value={startCity}
              onChange={(e) => setStartCity(e.target.value)}
            >
              <option value="" className="bg-slate-800">Select a city...</option>
              {cities.map(c => (
                <option key={c.name} value={c.name} className="bg-slate-800">{c.name}</option>
              ))}
            </select>
          </div>

          {mode === 'intelligent' && (
            <div className="animate-fade-in">
              <label className="block text-sm font-medium text-indigo-200 mb-2">Destination City</label>
              <select
                className="w-full input-field p-3"
                value={endCity}
                onChange={(e) => setEndCity(e.target.value)}
              >
                <option value="" className="bg-slate-800">Select a city...</option>
                {cities.map(c => (
                  <option key={c.name} value={c.name} className="bg-slate-800">{c.name}</option>
                ))}
              </select>
            </div>
          )}

          {mode === 'greedy' && (
            <div className="flex items-center animate-fade-in">
              <input
                id="return-check"
                type="checkbox"
                className="h-5 w-5 text-indigo-500 focus:ring-indigo-500 border-gray-600 rounded bg-slate-800/50"
                checked={returnToStart}
                onChange={(e) => setReturnToStart(e.target.checked)}
              />
              <label htmlFor="return-check" className="ml-3 block text-sm text-slate-300 cursor-pointer select-none">
                Return to start city
              </label>
            </div>
          )}

          <button
            onClick={handlePlan}
            disabled={loading}
            className={`w-full flex justify-center py-3 px-4 rounded-xl text-sm font-bold tracking-wide uppercase
              ${loading ? 'bg-slate-600 cursor-not-allowed opacity-70' : 'btn-primary'} 
              focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 focus:ring-offset-slate-900`}
          >
            {loading ? (
              <span className="flex items-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Calculating...
              </span>
            ) : 'Calculate Route'}
          </button>

          {error && (
            <div className="p-4 bg-red-500/20 border border-red-500/50 text-red-200 text-sm rounded-xl backdrop-blur-sm">
              {error}
            </div>
          )}
        </div>

        {/* Visualization Panel */}
        <div className="md:col-span-2 space-y-6 flex flex-col">
          <div className="h-[600px] w-full bg-slate-800 rounded-2xl overflow-hidden shadow-2xl border border-slate-700 relative">
            <MapVisualization
              route={routeResult?.route}
              suggestedCities={routeResult?.suggested_cities}
              allCities={cities}
            />
          </div>

          {routeResult && (
            <div className="glass-panel p-6 rounded-2xl animate-fade-in">
              <h3 className="text-xl font-bold text-white mb-3 flex items-center">
                <span className="bg-indigo-500 w-2 h-8 rounded-full mr-3"></span>
                Itinerary
              </h3>
              <p className="text-slate-300 mb-6 whitespace-pre-line leading-relaxed">{routeResult.description}</p>

              <div className="mt-4">
                <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-widest mb-4">Route Sequence</h4>
                <div className="flex overflow-x-auto pb-4 scrollbar-hide space-x-4">
                  {routeResult.route.map((city, idx) => (
                    <div key={idx} className="flex-shrink-0 flex items-center">
                      <div className="flex flex-col items-center">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold mb-2 shadow-lg
                          ${idx === 0 ? 'bg-green-500 text-white' : idx === routeResult.route.length - 1 ? 'bg-red-500 text-white' : 'bg-indigo-600 text-white'}`}>
                          {idx + 1}
                        </div>
                        <span className="text-sm font-medium text-slate-200 bg-slate-800/80 px-3 py-1 rounded-full border border-slate-600">
                          {city.name}
                        </span>
                      </div>
                      {idx < routeResult.route.length - 1 && (
                        <div className="w-8 h-0.5 bg-slate-600 mx-2 mt-[-24px]"></div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default App;
