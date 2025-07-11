# ✈️ Smart Airlift Router

**Full-stack system for real-time optimized airlift routing using weather inputs. Built with Flask & React.**

---

## 🛠️ Getting Started with Create React App

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

### Available Scripts

In the `client` directory, you can run:

#### `npm start`
Runs the frontend in development mode at [http://localhost:3000](http://localhost:3000).

#### `npm run build`
Builds the app for production.

In the `server` (Flask) directory:

#### `python app.py`
Starts the backend server.

---

## 🌐 Technologies Used

- **Frontend**: React.js, Leaflet.js
- **Backend**: Flask (Python)
- **Routing Algorithms**: A*/Dijkstra
- **Others**: REST APIs, GeoJSON, NumPy

---

## 📦 Project Description

Smart Airlift Router simulates and computes optimized air routes between airbases by dynamically responding to **real-time or simulated weather input**, **terrain constraints**, and **risk zones**, using classic graph algorithms.

---

## 🔧 Installation

```bash
# Clone the repo
git clone https://github.com/SauravPampana004/Smart-Airlift-Router.git
cd Smart-Airlift-Router

# Install frontend dependencies
cd client
npm install

# Run React app
npm start

# In another terminal: run Flask backend
cd ../server
pip install -r requirements.txt
python app.py
