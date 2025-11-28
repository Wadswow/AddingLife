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
const playerLocation = player.getLatLng();

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

function tokenCall(key: string) {
  const token = tokens.get(key);
  return token;
}

function updateHeldUI() {
  heldDiv.textContent = `Held: ${heldToken ?? "—"}`;
}

function updateValue(key: string, newValue: number) {
  const token = tokenCall(key);
  if (!token || token.collected) return;
  token.value = newValue;
  if (token.marker) {
    const tokenElement = token.marker.getElement();
    const valueLabel = tokenElement!.querySelector("span");
    valueLabel!.innerHTML = newValue.toString();
  }
}

// Token pick-up function/win condition
function pickUp(key: string) {
  if (heldToken !== null) return;
  const grab = tokenCall(key);
  if (!grab || grab.collected) return;
  grab.collected = true;
  if (grab.marker) {
    grab.marker.remove();
    grab.marker = undefined;
  }
  heldToken = grab.value;
  updateHeldUI();
  if (heldToken >= 8) {
    alert("Congratulations! You win!");
    globalThis.location.reload();
  }
}

// Token spawn function
function spawnToken(i: number, j: number, interactive = false, value = 1) {
  const key = keyFor(i, j);
  const existing = tokenCall(key);
  if (existing && !existing.collected) return;
  if (existing && existing.collected) return;
  const spawn = leaflet.latLng(
    tiles.lat + (i + 0.5) * size,
    tiles.lng + (j + 0.5) * size,
  );

  // Create token
  const tokenDiv = document.createElement("div");
  tokenDiv.className = "token";
  const tokenImage = document.createElement("img");
  tokenImage.src = coin;
  tokenDiv.appendChild(tokenImage);
  const tokenValue = document.createElement("span");
  tokenValue.innerHTML = value.toString();
  tokenDiv.appendChild(tokenValue);
  const tokenIcon = leaflet.divIcon({
    className: "token-icon",
    html: tokenDiv,
    iconSize: [32, 32],
  });

  // Add token to map
  const token = leaflet.marker(spawn, { icon: tokenIcon, interactive });
  token.on("click", () => {
    collect(i, j, key);
  });
  tokensLayer.addLayer(token);
  tokens.set(key, { marker: token, value, collected: false });
}

// Token handling function
function collect(i: number, j: number, key: string) {
  const playerI = Math.floor((playerLocation.lat - tiles.lat) / size);
  const playerJ = Math.floor((playerLocation.lng - tiles.lng) / size);
  if (
    Math.abs(i - playerI) > pickupRadius || Math.abs(j - playerJ) > pickupRadius
  ) return;
  if (heldToken !== null) {
    craftToken(i, j);
    return;
  }
  pickUp(key);
}

//token crafting function
function craftToken(i: number, j: number) {
  const key = keyFor(i, j);
  const existing = tokenCall(key);
  if (existing && !existing.collected) {
    if (existing.value === heldToken) {
      const newValue = heldToken * 2;
      updateValue(key, newValue);
      heldToken = null;
      updateHeldUI();
      return;
    }
    return;
  }
  spawnToken(i, j, true, heldToken!);
  heldToken = null;
  updateHeldUI();
  return;
}

// Draw grid and spawn tokens
function drawGrid() {
  grid.clearLayers();
  const bounds = map.getBounds();
  const playerI = Math.floor((playerLocation.lat - tiles.lat) / size);
  const playerJ = Math.floor((playerLocation.lng - tiles.lng) / size);
  const minLatitude = Math.floor((bounds.getSouth() - tiles.lat) / size);
  const maxLatitude = Math.floor((bounds.getNorth() - tiles.lat) / size);
  const minLongitude = Math.floor((bounds.getWest() - tiles.lng) / size);
  const maxLongitude = Math.floor((bounds.getEast() - tiles.lng) / size);
  for (let i = minLatitude; i <= maxLatitude; i++) {
    for (let j = minLongitude; j <= maxLongitude; j++) {
      const bounds = leaflet.latLngBounds([
        [tiles.lat + i * size, tiles.lng + j * size],
        [tiles.lat + (i + 1) * size, tiles.lng + (j + 1) * size],
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
        spawnToken(i, j, isWithinRadius || isPlayerCell);
      }
    }
  }
}

//initialize and handle map movements
map.on("moveend zoomend", drawGrid);
player.on("move", drawGrid);
drawGrid();
