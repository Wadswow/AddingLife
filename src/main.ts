// === Imports ===
import leaflet from "leaflet";
import "leaflet/dist/leaflet.css";
import "./style.css";
import "./_leafletWorkaround.ts";
import luck from "./_luck.ts";
import coin from "./coin.png";

// === DOM and Map Initialization ===
const mapDiv = document.createElement("div");
mapDiv.id = "map";
document.body.append(mapDiv);

//global constants and variables
const NULL_ISLAND = leaflet.latLng(0, 0);
const SIZE = 1e-4;
const INITIAL_COORD = spawnPlayerInRandomTile();
const MAP = leaflet.map("map").setView(INITIAL_COORD, 19);
const GRID = leaflet.layerGroup().addTo(MAP);
const PICK_UP_RADIUS = 3;
const STORAGE_KEY = "adding-life-tokens";
const HELD_KEY = "adding-life-held";
const PLAYER_STORAGE = "adding-life-player";
let heldToken: number | null = null;
let geoWatchId: number | null = null;
let useGeolocation = true;

leaflet.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
  maxZoom: 19,
}).addTo(MAP);

//random player spawn function
function spawnPlayerInRandomTile() {
  const i = Math.floor(Math.random() * (2 * 899990 + 1)) - 899990;
  const j = Math.floor(Math.random() * (2 * 899990 + 1)) - 899990;
  return leaflet.latLng(
    NULL_ISLAND.lat + (i + 0.5) * SIZE,
    NULL_ISLAND.lng + (j + 0.5) * SIZE,
  );
}

// === Helper Functions ===
function keyFor(i: number, j: number) {
  return `${i},${j}`;
}

function updateVisibility() {
  moveButtons.style.display = useGeolocation ? "none" : "";
}

function updateHeldUI() {
  heldDiv.textContent = `Held: ${heldToken ?? "—"}`;
}

function releaseHeldToken() {
  heldToken = null;
  updateHeldUI();
  saveHeldToken();
}

function setHeldToken(value: number) {
  heldToken = value;
  updateHeldUI();
  saveHeldToken();
}

function coordsToTile(lat: number, lng: number): [number, number] {
  return [
    Math.floor((lat - NULL_ISLAND.lat) / SIZE),
    Math.floor((lng - NULL_ISLAND.lng) / SIZE),
  ];
}

function tileToCenter(i: number, j: number): leaflet.LatLng {
  return leaflet.latLng(
    NULL_ISLAND.lat + (i + 0.5) * SIZE,
    NULL_ISLAND.lng + (j + 0.5) * SIZE,
  );
}

// === Player Initialization And Geolocation Handling ===
const player = leaflet.marker(INITIAL_COORD);
player.addTo(MAP);
let playerLocation = player.getLatLng();

//geolocation position saving/loading functions
function savePlayerLocation(latlng: leaflet.LatLng) {
  try {
    localStorage.setItem(
      PLAYER_STORAGE,
      JSON.stringify({ lat: latlng.lat, lng: latlng.lng }),
    );
  } catch {
    /* ignore storage errors */
  }
}

function loadPlayerLocation(): leaflet.LatLng | null {
  try {
    const raw = localStorage.getItem(PLAYER_STORAGE);
    if (!raw) return null;
    const p = JSON.parse(raw) as { lat: number; lng: number } | undefined;
    if (!p) return null;
    return leaflet.latLng(p.lat, p.lng);
  } catch {
    return null;
  }
}

//function for moving player based on geolocation
function applyGeoPosition(lat: number, lng: number, shouldCenter = true) {
  const [i, j] = coordsToTile(lat, lng);
  const center = tileToCenter(i, j);
  const newLatLng = center;
  player.setLatLng(newLatLng);
  playerLocation = newLatLng;
  savePlayerLocation(newLatLng);
  if (shouldCenter) MAP.panTo(newLatLng, { animate: true });
}

//geolocation initialization and handling functions
function initGeolocation() {
  if (!("geolocation" in navigator)) {
    useGeolocation = false;
    return;
  }
  try {
    geoWatchId = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        applyGeoPosition(latitude, longitude);
      },
      (err) => {
        console.warn("Geolocation error:", err);
        if (geoWatchId !== null) {
          navigator.geolocation.clearWatch(geoWatchId);
          geoWatchId = null;
        }
      },
      { enableHighAccuracy: true, maximumAge: 10000, timeout: 10000 },
    );
  } catch (e) {
    console.warn("Failed to start geolocation:", e);
  }
}

function stopGeolocation() {
  if (geoWatchId !== null) {
    navigator.geolocation.clearWatch(geoWatchId);
    geoWatchId = null;
  }
}

function enableGeolocation() {
  stopGeolocation();
  initGeolocation();
}

const savedPosition = loadPlayerLocation();
if (savedPosition) {
  player.setLatLng(savedPosition);
  playerLocation = savedPosition;
  MAP.setView(savedPosition, MAP.getZoom());
}

initGeolocation();

// === Token Management ===

//initialize token storage
const tokensLayer = leaflet.layerGroup().addTo(MAP);
const tokens = new Map<
  string,
  {
    marker?: leaflet.Marker | undefined;
    value: number;
    collected?: boolean | undefined;
  }
>();

//held-token UI
const heldDiv = document.createElement("div");
heldDiv.className = "held-token";
heldDiv.textContent = "Held: —";
document.body.appendChild(heldDiv);

//held token persistence functions
function saveHeldToken() {
  localStorage.setItem(HELD_KEY, JSON.stringify(heldToken));
}

function loadHeldToken(): number | null {
  try {
    const raw = localStorage.getItem(HELD_KEY);
    if (!raw) return null;
    const v = JSON.parse(raw) as number | null;
    return v ?? null;
  } catch {
    return null;
  }
}

const savedHeld = loadHeldToken();
if (savedHeld !== null) {
  heldToken = savedHeld;
  updateHeldUI();
}

function updateValue(key: string, newValue: number) {
  const token = tokens.get(key);
  if (!token || token.collected) return;
  token.value = newValue;
  if (token.marker) {
    const tokenElement = token.marker.getElement();
    const valueLabel = tokenElement!.querySelector("span");
    valueLabel!.innerHTML = newValue.toString();
  }
}

//token pick-up function/win condition
function pickUp(key: string) {
  if (heldToken !== null) return;
  const grab = tokens.get(key);
  if (!grab || grab.collected) return;
  grab.collected = true;
  if (grab.marker) {
    grab.marker.remove();
    grab.marker = undefined;
  }
  setHeldToken(grab.value);
  if (heldToken! >= 256) {
    alert("Congratulations! You win!");
  }
}

//token persistence functions
function saveTokens() {
  const payload: Array<{ key: string; value: number; collected?: boolean }> =
    [];
  for (const [key, token] of tokens) {
    payload.push({ key, value: token.value, collected: !!token.collected });
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
}

function loadTokens() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return;
  const payload: Array<{ key: string; value: number; collected?: boolean }> =
    JSON.parse(raw);
  for (const entry of payload) {
    tokens.set(entry.key, {
      value: entry.value,
      collected: !!entry.collected,
      marker: undefined,
    });
  }
}

loadTokens();

//token spawn function
function spawnToken(i: number, j: number, interactive = false, value = 1) {
  const key = keyFor(i, j);
  const existing = tokens.get(key);
  const spawn = tileToCenter(i, j);
  if (existing) {
    if (existing.collected || existing.marker) {
      return;
    }
    value = existing.value;
  }

  //create token
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

  //add token to map
  const token = leaflet.marker(spawn, { icon: tokenIcon, interactive });
  token.on("click", () => {
    collect(i, j, key);
  });
  tokensLayer.addLayer(token);
  tokens.set(key, { marker: token, value, collected: false });
  saveTokens();
}

//token handling function
function collect(i: number, j: number, key: string) {
  const [playerI, playerJ] = coordsToTile(
    playerLocation.lat,
    playerLocation.lng,
  );
  if (
    Math.abs(i - playerI) > PICK_UP_RADIUS ||
    Math.abs(j - playerJ) > PICK_UP_RADIUS
  ) return;
  if (heldToken === null) {
    pickUp(key);
    return;
  }
  craftToken(i, j);
  saveTokens();
}

//token crafting function
function craftToken(i: number, j: number) {
  const key = keyFor(i, j);
  const existing = tokens.get(key);
  if (existing && !existing.collected) {
    if (existing.value === heldToken) {
      const newValue = heldToken * 2;
      updateValue(key, newValue);
      releaseHeldToken();
      return;
    }
    return;
  }
  spawnToken(i, j, true, heldToken!);
  releaseHeldToken();
  return;
}

//despawn offscreen tokens
function despawnOffscreenTokens() {
  const bounds = MAP.getBounds();
  for (const [key, token] of tokens) {
    const parts = key.split(",");
    const i = Number(parts[0]);
    const j = Number(parts[1]);
    const center = tileToCenter(i, j);
    if (!bounds.contains(center)) {
      if (token.marker) {
        tokensLayer.removeLayer(token.marker);
        token.marker.remove();
        token.marker = undefined;
      }
    }
  }
}

// === Grid Drawing and Tile Logic ===

//draw grid and spawn tokens
function drawGrid() {
  despawnOffscreenTokens();
  GRID.clearLayers();
  const bounds = MAP.getBounds();
  const [playerI, playerJ] = coordsToTile(
    playerLocation.lat,
    playerLocation.lng,
  );
  const minLatitude = Math.floor((bounds.getSouth() - NULL_ISLAND.lat) / SIZE);
  const maxLatitude = Math.floor((bounds.getNorth() - NULL_ISLAND.lat) / SIZE);
  const minLongitude = Math.floor((bounds.getWest() - NULL_ISLAND.lng) / SIZE);
  const maxLongitude = Math.floor((bounds.getEast() - NULL_ISLAND.lng) / SIZE);
  for (let i = minLatitude; i <= maxLatitude; i++) {
    for (let j = minLongitude; j <= maxLongitude; j++) {
      const bounds = leaflet.latLngBounds([
        [NULL_ISLAND.lat + i * SIZE, NULL_ISLAND.lng + j * SIZE],
        [NULL_ISLAND.lat + (i + 1) * SIZE, NULL_ISLAND.lng + (j + 1) * SIZE],
      ]);
      const isPlayer = i === playerI && j === playerJ;
      const radius = Math.abs(i - playerI) <= 3 &&
        Math.abs(j - playerJ) <= 3;
      const key = keyFor(i, j);
      const existing = tokens.get(key);
      if (existing && existing.marker) {
        const interactiveRange = radius || isPlayer;
        const interactive = existing.marker.options.interactive;
        if (interactiveRange !== interactive) {
          tokensLayer.removeLayer(existing.marker);
          const newToken = leaflet.marker(existing.marker.getLatLng(), {
            icon: existing.marker.options.icon!,
            interactive: interactiveRange,
          });
          newToken.on("click", () => collect(i, j, key));
          tokensLayer.addLayer(newToken);
          existing.marker = newToken;
        }
      }
      const rect = leaflet.rectangle(
        bounds,
        isPlayer || radius ? { color: "#f00" } : { color: "#666" },
      );
      GRID.addLayer(rect);
      if (luck([i, j].toString()) < 0.2) {
        spawnToken(i, j, radius || isPlayer);
      }
    }
  }
}

// === Input And UI Elements ===

//movement buttons and functionality
function createMoveButton(
  direction: string,
  symbol: string,
  delta: [number, number],
) {
  const button = document.createElement("button");
  button.innerHTML = symbol;
  button.className = `move-button ${direction}-button`;
  button.onclick = () => {
    if (useGeolocation) return;
    const current = player.getLatLng();
    player.setLatLng(leaflet.latLng(
      current.lat + delta[0] * SIZE,
      current.lng + delta[1] * SIZE,
    ));
  };
  return button;
}

const moveButtons = document.createElement("div");
moveButtons.className = "move-buttons";
document.body.appendChild(moveButtons);

moveButtons.append(
  createMoveButton("up", "↑", [1, 0]),
  createMoveButton("left", "←", [0, -1]),
  createMoveButton("down", "↓", [-1, 0]),
  createMoveButton("right", "→", [0, 1]),
);

//new game functionality
function newGame() {
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(HELD_KEY);
  localStorage.removeItem(PLAYER_STORAGE);
  if (geoWatchId !== null) {
    navigator.geolocation.clearWatch(geoWatchId);
    geoWatchId = null;
  }
  globalThis.location.reload();
}

//new game button
const newGameButton = document.createElement("button");
newGameButton.className = "new-game-button";
newGameButton.textContent = "New Game";
newGameButton.onclick = () => {
  if (confirm("Start a completely new game?\nAll progress will be lost.")) {
    newGame();
  }
};
document.body.appendChild(newGameButton);

//geolocation toggle button
const toggleButton = document.createElement("button");
toggleButton.className = "toggle-move-button";
toggleButton.textContent = useGeolocation
  ? "Use Movement Buttons"
  : "Use Geolocation";

//toggle button functionality
toggleButton.onclick = () => {
  useGeolocation = !useGeolocation;
  if (useGeolocation) {
    toggleButton.textContent = "Use Movement Buttons";
    enableGeolocation();
  } else {
    toggleButton.textContent = "Use Geolocation";
    stopGeolocation();
  }
  updateVisibility();
};

document.body.appendChild(toggleButton);

// === Game Initialization ===
MAP.on("moveend zoomend", drawGrid);
player.on("move", () => {
  playerLocation = player.getLatLng();
  MAP.panTo(playerLocation, { animate: true });
  drawGrid();
});
drawGrid();
updateVisibility();
