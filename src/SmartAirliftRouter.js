import React, { useState, useEffect } from 'react';


const globalAirports = [
  { id: 'A', name: 'A', x: 50, y: 50 },
  { id: 'B', name: 'B', x: 185, y: 100 },
  { id: 'C', name: 'C', x: 300, y: 25 },
  { id: 'D', name: 'D', x: 200, y: 200 },
  { id: 'E', name: 'E', x: 400, y: 75 },
  { id: 'F', name: 'F', x: 311, y: 225 },
  { id: 'G', name: 'G', x: 50, y: 165 },
  { id: 'H', name: "H", x: 119, y: 237 },
  { id: 'I', name: 'I', x: 250, y: 126 },
  { id: 'J', name: 'J', x: 400, y: 150 }
];

// Modified to include mutable weather conditions
let airRoutes = [
  { from: 'A', to: 'B', distance: 350, weather: 'clear', altitude: 'low', fuelCost: 1000 },
  { from: 'B', to: 'C', distance: 500, weather: 'rain', altitude: 'low', fuelCost: 800 },
  { from: 'A', to: 'C', distance: 900, weather: 'clear', altitude: 'high', fuelCost: 400 },
  { from: 'A', to: 'G', distance: 250, weather: 'rain', altitude: 'low', fuelCost: 399 },
  { from: 'G', to: 'H', distance: 200, weather: 'clear', altitude: 'low', fuelCost: 120 },
  { from: 'C', to: 'E', distance: 299, weather: 'clear', altitude: 'low', fuelCost: 140 },
  { from: 'B', to: 'I', distance: 150, weather: 'storm', altitude: 'medium', fuelCost: 100 },
  { from: 'H', to: 'D', distance: 175, weather: 'rain', altitude: 'low', fuelCost: 187 },
  { from: 'D', to: 'F', distance: 225, weather: 'clear', altitude: 'medium', fuelCost: 217 },
  { from: 'H', to: 'F', distance: 396, weather: 'clear', altitude: 'low', fuelCost: 517 },
  { from: 'F', to: 'J', distance: 299, weather: 'storm', altitude: 'high', fuelCost: 600 },
  { from: 'G', to: 'I', distance: 1000, weather: 'clear', altitude: 'low', fuelCost: 800 },
  { from: 'I', to: 'J', distance: 311, weather: 'clear', altitude: 'medium', fuelCost: 670 },
  { from: 'E', to: 'I', distance: 313, weather: 'clear', altitude: 'low', fuelCost: 689 }
];

const conditionFactors = {
  weather: {
    clear: 1,
    rain: 1.3,
    storm: 999999
  },
  altitude: {
    low: 1,
    medium: 1.2,
    high: 1.4
  }
};

const SmartAirliftRouter = () => {
  const [source, setSource] = useState('');
  const [destination, setDestination] = useState('');
  const [routingPriority, setRoutingPriority] = useState('balanced');
  const [routes, setRoutes] = useState([]);
  const [selectedRoute, setSelectedRoute] = useState(null);
  const [error, setError] = useState(null);
  const [planePosition, setPlanePosition] = useState(0);
  const [selectedRouteWeather, setSelectedRouteWeather] = useState({});

  useEffect(() => {
    if (selectedRoute) {
      setPlanePosition(0);
    }
  }, [selectedRoute]);

  useEffect(() => {
    if (selectedRoute) {
      const interval = setInterval(() => {
        setPlanePosition((prev) => {
          if (prev >= selectedRoute.path.length - 1) {
            clearInterval(interval);
            return selectedRoute.path.length - 1;
          }
          return prev + 0.02;
        });
      }, 50);
      return () => clearInterval(interval);
    }
  }, [selectedRoute]);

  // Function to update route weather
  const updateRouteWeather = (from, to, weather) => {
    const route = airRoutes.find(r => 
      (r.from === from && r.to === to) || (r.to === from && r.from === to)
    );
    if (route) {
      route.weather = weather;
      setSelectedRouteWeather({...selectedRouteWeather, [`${from}-${to}`]: weather});
    }
  };

  const calculateRouteCost = (path, priority) => {
    let totalCost = 0;
    for (let i = 0; i < path.length - 1; i++) {
      const edge = airRoutes.find(e => 
        (e.from === path[i] && e.to === path[i + 1]) ||
        (e.to === path[i] && e.from === path[i + 1])
      );
      if (edge) {
        const weatherFactor = conditionFactors.weather[edge.weather];
        const altitudeFactor = conditionFactors.altitude[edge.altitude];
        switch (priority) {
          case 'distance':
            totalCost += edge.distance;
            break;
          case 'fuel':
            totalCost += edge.fuelCost;
            break;
          case 'weather':
            totalCost += edge.distance * (weatherFactor * 2);
            break;
          default:
            totalCost += (edge.distance + edge.fuelCost) / 2;
        }
      }
    }
    return totalCost;
  };

  const findRoutes = (start, end, priority) => {
    const paths = [];
    const visited = new Set();

    const dfs = (current, path, cost) => {
      if (current === end) {
        paths.push({ path: [...path], cost });
        return;
      }

      visited.add(current);

      const edges = airRoutes.filter(route => 
        (route.from === current && !visited.has(route.to)) ||
        (route.to === current && !visited.has(route.from))
      );

      for (const edge of edges) {
        const next = edge.from === current ? edge.to : edge.from;
        if (!visited.has(next) && edge.weather !== 'storm') {
          const newCost = cost + calculateRouteCost([current, next], priority);
          path.push(next);
          dfs(next, path, newCost);
          path.pop();
        }
      }

      visited.delete(current);
    };

    dfs(start, [start], 0);

    if (paths.length === 0) {
      setError("No storm-free route available between these airports.");
      return [];
    }

    setError(null);
    return paths.sort((a, b) => a.cost - b.cost).slice(0, 3);
  };

  const renderNetwork = () => {
    const renderPlane = () => {
      if (!selectedRoute) return null;
      const currentSegment = Math.floor(planePosition);
      const nextSegment = Math.ceil(planePosition);
      const progress = planePosition - currentSegment;

      const fromAirport = globalAirports.find(
        (airport) => airport.id === selectedRoute.path[currentSegment]
      );
      const toAirport = globalAirports.find(
        (airport) => airport.id === selectedRoute.path[nextSegment]
      );

      if (!fromAirport || !toAirport) return null;

      const x = fromAirport.x + (toAirport.x - fromAirport.x) * progress;
      const y = fromAirport.y + (toAirport.y - fromAirport.y) * progress;

      return (
        <g>
          <text x={x} y={y - 8} textAnchor="middle" fontSize="18" fill="blue">✈️</text>
        </g>
      );
    };

    return (
      <svg className="w-full h-96" viewBox="0 0 500 300">
        <image href='C:\Users\Nikhil\OneDrive\Desktop\airlift-simulator\src\military.jpg' x="0" y="0" width="500" height="300" preserveAspectRatio="xMidYMid slice" />
        {airRoutes.map((edge, index) => {
          const fromAirport = globalAirports.find((airport) => airport.id === edge.from);
          const toAirport = globalAirports.find((airport) => airport.id === edge.to);
          const isOnSelectedRoute = selectedRoute?.path.includes(edge.from) &&
                                    selectedRoute?.path.includes(edge.to);
          return (
            <g key={`edge-${index}`}>
              <line
                x1={fromAirport.x}
                y1={fromAirport.y}
                x2={toAirport.x}
                y2={toAirport.y}
                stroke={isOnSelectedRoute ? '#2563eb' : '#d1d5db'}
                strokeWidth={isOnSelectedRoute ? "3" : "1"}
                strokeDasharray={edge.weather === 'storm' ? "5,5" : "none"}
              />
              {edge.weather !== 'clear' && (
                <circle 
                  cx={(fromAirport.x + toAirport.x) / 2} 
                  cy={(fromAirport.y + toAirport.y) / 2} 
                  r="10" 
                  fill={edge.weather === 'rain' ? '#93c5fd' : '#ff6666'} 
                />
              )}
              <foreignObject
                x={(fromAirport.x + toAirport.x) / 2 - 40}
                y={(fromAirport.y + toAirport.y) / 2 - 15}
                width="80"
                height="30"
              >
                <select
                  value={edge.weather}
                  onChange={(e) => updateRouteWeather(edge.from, edge.to, e.target.value)}
                  className="text-xs p-1 border rounded bg-white"
                  style={{ fontSize: '' }}
                >
                  <option value="clear">Clear</option>
                  <option value="rain">Rain</option>
                  <option value="storm">Storm</option>
                </select>
              </foreignObject>
            </g>
          );
        })}
        {globalAirports.map((airport, index) => (
          <g key={`airport-${index}`} transform={`translate(${airport.x}, ${airport.y})`}>
            <circle r="6" fill="#1d4ed8" />
            <text y="-8" textAnchor="middle" fontSize="14">{airport.name}</text>
          </g>
        ))}
        {renderPlane()}
      </svg>
    );
  };

  const handleRouteSearch = () => {
    const results = findRoutes(source, destination, routingPriority);
    setRoutes(results);
    setSelectedRoute(results.length > 0 ? results[0] : null);
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="max-w-md w-full p-6 bg-red-100 shadow-lg rounded-lg text-center">
      {/* Existing styles remain the same */}
      <h1 className="text-3xl font-bold text-gray-700 mb-6 text-center">Smart Airlift Router</h1>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div>
          <label className="block font-semibold mb-1 text-gray-600">Source</label>
          <select
            value={source}
            onChange={(e) => setSource(e.target.value)}
            className="border rounded px-3 py-2 w-full focus:outline-none focus:border-blue-400"
          >
            <option value="">Select Source</option>
            {globalAirports.map((airport) => (
              <option key={airport.id} value={airport.id}>{airport.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block font-semibold mb-1 text-gray-600">Destination</label>
          <select
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
            className="border rounded px-3 py-2 w-full focus:outline-none focus:border-blue-400"
          >
            <option value="">Select Destination</option>
            {globalAirports.map((airport) => (
              <option key={airport.id} value={airport.id}>{airport.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block font-semibold mb-1 text-gray-600">Priority</label>
          <select
            value={routingPriority}
            onChange={(e) => setRoutingPriority(e.target.value)}
            className="border rounded px-3 py-2 w-full focus:outline-none focus:border-blue-400"
          >
            <option value="balanced">Balanced</option>
            <option value="distance">Shortest Distance</option>
            <option value="fuel">Fuel Efficient</option>
            <option value="weather">Weather Optimal</option>
          </select>
        </div>

        <button
          onClick={handleRouteSearch}
          className="mt-6 bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded shadow-md transition-all duration-200"
        >
          Find Routes
        </button>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      <div className="border rounded p-4 mb-8 bg-gray-50">
        {renderNetwork()}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <h2 className="text-xl font-semibold mb-4 text-gray-700">Available Routes</h2>
          <div className="space-y-3">
            {routes.map((route, index) => (
              <button
                key={index}
                onClick={() => setSelectedRoute(route)}
                className={`w-full text-left rounded-md py-3 px-4 transition-all duration-200 font-medium shadow-sm
                  ${
                    selectedRoute === route
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                  }`}
                >
                  Route {index + 1} (Cost: {Math.round(route.cost)} units)
                </button>
              ))}
            </div>
          </div>
  
          <div>
            <h2 className="text-xl font-semibold mb-4 text-gray-700">Route Details</h2>
            {selectedRoute && (
              <div className="p-4 bg-gray-50 rounded-md shadow">
                <p className="text-gray-600"><strong>Path:</strong> {selectedRoute.path.join(' → ')}</p>
                <p className="text-gray-600"><strong>Total Cost:</strong> {Math.round(selectedRoute.cost)} units</p>
                <div className="mt-4">
                  <h3 className="font-semibold text-gray-700 mb-2">Weather Conditions:</h3>
                  <div className="space-y-2">
                    {selectedRoute.path.slice(0, -1).map((airport, index) => {
                      const nextAirport = selectedRoute.path[index + 1];
                      const route = airRoutes.find(r => 
                        (r.from === airport && r.to === nextAirport) ||
                        (r.to === airport && r.from === nextAirport)
                      );
                      return (
                        <div key={index} className="flex items-center justify-between text-sm">
                          <span>{airport} → {nextAirport}:</span>
                          <span className={`px-2 py-1 rounded ${
                            route.weather === 'clear' ? 'bg-green-100 text-green-800' :
                            route.weather === 'rain' ? 'bg-blue-100 text-blue-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {route.weather.charAt(0).toUpperCase() + route.weather.slice(1)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
  
        <div className="mt-8 p-4 bg-blue-50 rounded-md">
          <h3 className="text-lg font-semibold text-blue-800 mb-2">Weather Conditions Legend</h3>
          <div className="grid grid-cols-3 gap-4">
            <div className="flex items-center">
              <div className="w-4 h-4 bg-green-100 rounded mr-2"></div>
              <span className="text-sm text-gray-600">Clear</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 bg-blue-100 rounded mr-2"></div>
              <span className="text-sm text-gray-600">Rain</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 bg-red-100 rounded mr-2"></div>
              <span className="text-sm text-gray-600">Storm</span>
            </div>
          </div>
        </div>
  
        <style jsx>{`
          .max-w-6xl {
            max-width: 72rem;
          }
          .mx-auto {
            margin-left: auto;
            margin-right: auto;
          }
          .p-6 {
            padding: 1.5rem;
          }
          .bg-white {
            background-color: #ffffff;
          }
          .shadow-lg {
            box-shadow: 0 10px 15px rgba(0, 0, 0, 0.1);
          }
          .rounded-lg {
            border-radius: 0.5rem;
          }
          select.text-xs {
            font-size: 0.75rem;
          }
          .weather-dropdown {
            background-color: rgba(255, 255, 255, 0.9);
          }
          /* Rest of the existing styles remain unchanged */
        `}</style>
      </div>
      </div>
    );
  };
  
  export default SmartAirliftRouter;