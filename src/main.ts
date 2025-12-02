//imports
import leaflet from "leaflet";
import "leaflet/dist/leaflet.css";
import "./style.css";
import "./_leafletWorkaround.ts";
import luck from "./_luck.ts";
import coin from "./coin.png";

//create basic UI elements
const mapDiv = document.createElement("div");
mapDiv.id = "map";
document.body.append(mapDiv);

//map initialization
const nullIsland = leaflet.latLng(0, 0);
const size = 1e-4;
const initialCoord = spawnPlayerInRandomTile();
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
let playerLocation = player.getLatLng();

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

//held-token UI
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
  heldToken = grab.value;
  updateHeldUI();
  if (heldToken >= 128) {
    alert("Congratulations! You win!");
    globalThis.location.reload();
  }
}

//token spawn function
function spawnToken(i: number, j: number, interactive = false, value = 1) {
  const key = keyFor(i, j);
  const existing = tokens.get(key);
  const spawn = leaflet.latLng(
    nullIsland.lat + (i + 0.5) * size,
    nullIsland.lng + (j + 0.5) * size,
  );
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
}

//token handling function
function collect(i: number, j: number, key: string) {
  const playerI = Math.floor((playerLocation.lat - nullIsland.lat) / size);
  const playerJ = Math.floor((playerLocation.lng - nullIsland.lng) / size);
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
  const existing = tokens.get(key);
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

//draw grid and spawn tokens
function drawGrid() {
  despawnOffscreenTokens();
  grid.clearLayers();
  const bounds = map.getBounds();
  const playerI = Math.floor((playerLocation.lat - nullIsland.lat) / size);
  const playerJ = Math.floor((playerLocation.lng - nullIsland.lng) / size);
  const minLatitude = Math.floor((bounds.getSouth() - nullIsland.lat) / size);
  const maxLatitude = Math.floor((bounds.getNorth() - nullIsland.lat) / size);
  const minLongitude = Math.floor((bounds.getWest() - nullIsland.lng) / size);
  const maxLongitude = Math.floor((bounds.getEast() - nullIsland.lng) / size);
  for (let i = minLatitude; i <= maxLatitude; i++) {
    for (let j = minLongitude; j <= maxLongitude; j++) {
      const bounds = leaflet.latLngBounds([
        [nullIsland.lat + i * size, nullIsland.lng + j * size],
        [nullIsland.lat + (i + 1) * size, nullIsland.lng + (j + 1) * size],
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
      grid.addLayer(rect);
      if (luck([i, j].toString()) < 0.2) {
        spawnToken(i, j, radius || isPlayer);
      }
    }
  }
}

//despawn offscreen tokens
function despawnOffscreenTokens() {
  const bounds = map.getBounds();
  for (const [key, token] of tokens) {
    const parts = key.split(",");
    const i = Number(parts[0]);
    const j = Number(parts[1]);
    const center = leaflet.latLng(
      nullIsland.lat + (i + 0.5) * size,
      nullIsland.lng + (j + 0.5) * size,
    );
    if (!bounds.contains(center)) {
      if (token.marker) {
        tokensLayer.removeLayer(token.marker);
        token.marker.remove();
        token.marker = undefined;
      }
    }
  }
}

//random player spawn function
function spawnPlayerInRandomTile() {
  const i = Math.floor(Math.random() * (2 * 899998 + 1)) - 899998;
  const j = Math.floor(Math.random() * (2 * 899998 + 1)) - 899998;
  return leaflet.latLng(
    nullIsland.lat + (i + 0.5) * size,
    nullIsland.lng + (j + 0.5) * size,
  );
}

//movement buttons
function createMoveButton(
  direction: string,
  symbol: string,
  delta: [number, number],
) {
  const button = document.createElement("button");
  button.innerHTML = symbol;
  button.className = `move-button ${direction}-button`;
  button.onclick = () => {
    const current = player.getLatLng();
    player.setLatLng(leaflet.latLng(
      current.lat + delta[0] * size,
      current.lng + delta[1] * size,
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

//initialize and handle map movements
map.on("moveend zoomend", drawGrid);
player.on("move", () => {
  playerLocation = player.getLatLng();
  map.panTo(playerLocation, { animate: true });
  drawGrid();
});
drawGrid();
