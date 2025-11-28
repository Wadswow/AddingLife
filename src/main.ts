// Imports
import leaflet from "leaflet";
import "leaflet/dist/leaflet.css";
import "./style.css";
import "./_leafletWorkaround.ts";
import luck from "./_luck.ts";
import coin from "./coin.png";

// Create basic UI elements
const mapDiv = document.createElement("div");
mapDiv.id = "map";
document.body.append(mapDiv);

// Initialize map
const initialCoord = leaflet.latLng(36.997936938057016, -122.05703507501151);
const tiles = leaflet.latLng(36.997886938057016, -122.05708507501151);
const size = 1e-4;
const map = leaflet.map("map").setView(initialCoord, 19);
const grid = leaflet.layerGroup().addTo(map);

leaflet.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
  maxZoom: 19,
  attribution:
    '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
}).addTo(map);

//placeholder character
const player = leaflet.marker(initialCoord);
player.addTo(map);

//initialize token storage
const tokensLayer = leaflet.layerGroup().addTo(map);
const tokens = new Map<
  string,
  {
    marker?: leaflet.Marker | undefined;
    value: number;
    collected?: boolean | undefined;
  }
>();
let heldToken: number | null = null;
const pickupRadius = 3;

// Held-token UI
const heldDiv = document.createElement("div");
heldDiv.className = "held-token";
heldDiv.textContent = "Held: —";
document.body.appendChild(heldDiv);

//Helper Functions
function keyFor(i: number, j: number) {
  return `${i},${j}`;
}

function updateHeldUI() {
  heldDiv.textContent = `Held: ${heldToken ?? "—"}`;
}

function pickUp(key: string) {
  if (heldToken !== null) return;
  const entry = tokens.get(key);
  if (!entry || entry.collected) return;
  entry.collected = true;
  if (entry.marker) {
    entry.marker.remove();
    entry.marker = undefined;
  }
  heldToken = entry.value;
  updateHeldUI();
}

// Token spawn function
function spawnCache(i: number, j: number, interactive = false) {
  const key = keyFor(i, j);
  const existing = tokens.get(key);
  if (existing) {
    return;
  }
  const origin = tiles;
  const spawn = leaflet.latLng(
    origin.lat + (i + 0.5) * size,
    origin.lng + (j + 0.5) * size,
  );

  const tokenDiv = document.createElement("div");
  tokenDiv.className = "token";
  const tokenImage = document.createElement("img");
  tokenImage.src = coin;
  tokenDiv.appendChild(tokenImage);
  const tokenValue = document.createElement("span");
  tokenValue.innerHTML = "1";
  tokenDiv.appendChild(tokenValue);
  const tokenIcon = leaflet.divIcon({
    className: "token-icon",
    html: tokenDiv,
    iconSize: [32, 32],
  });

  const token = leaflet.marker(spawn, { icon: tokenIcon, interactive });
  token.on("click", () => {
    const p = player.getLatLng();
    const playerI = Math.floor((p.lat - origin.lat) / size);
    const playerJ = Math.floor((p.lng - origin.lng) / size);
    if (
      Math.abs(i - playerI) <= pickupRadius &&
      Math.abs(j - playerJ) <= pickupRadius
    ) {
      pickUp(key);
    }
  });
  tokensLayer.addLayer(token);
  tokens.set(key, { marker: token, value: 1, collected: false });
}

// Draw grid and spawn tokens
function drawGrid() {
  grid.clearLayers();
  const origin = tiles;
  const bounds = map.getBounds();
  const p = player.getLatLng();
  const playerI = Math.floor((p.lat - origin.lat) / size);
  const playerJ = Math.floor((p.lng - origin.lng) / size);
  const minLatitude = Math.floor((bounds.getSouth() - origin.lat) / size);
  const maxLatitude = Math.floor((bounds.getNorth() - origin.lat) / size);
  const minLongitude = Math.floor((bounds.getWest() - origin.lng) / size);
  const maxLongitude = Math.floor((bounds.getEast() - origin.lng) / size);
  for (let i = minLatitude; i <= maxLatitude; i++) {
    for (let j = minLongitude; j <= maxLongitude; j++) {
      const bounds = leaflet.latLngBounds([
        [origin.lat + i * size, origin.lng + j * size],
        [origin.lat + (i + 1) * size, origin.lng + (j + 1) * size],
      ]);
      const isPlayerCell = i === playerI && j === playerJ;
      const isWithinRadius = Math.abs(i - playerI) <= 3 &&
        Math.abs(j - playerJ) <= 3;
      const rect = leaflet.rectangle(
        bounds,
        isPlayerCell || isWithinRadius ? { color: "#f00" } : { color: "#666" },
      );
      grid.addLayer(rect);
      if (luck([i, j].toString()) < 0.2) {
        spawnCache(i, j, isWithinRadius || isPlayerCell);
      }
    }
  }
}

map.on("moveend zoomend", drawGrid);
player.on("move", drawGrid);
drawGrid();
