# D3: Adding Life

## Game Design Vision

A grid-based crafting game inspired by 2048 where you must walk around to pick up different number cells and combine them to create higher numbers until you get a high enough number to win. For this game specifically it will probably by 256 with a potential endless mode.

## Technologies

- TypeScript for game logic
- Leaflet for map rendering
- Deno + Vite for build tooling
- GitHub Actions for deployment
- `document.createElement` for UI, minimal HTML

### D3.a: Core mechanics (token collection and crafting)

Key technical challenge: Can you assemble a map-based user interface using the Leaflet mapping framework?
Key gameplay challenge: Can players collect and craft tokens from nearby locations to finally make one of sufficiently high value?

#### A Steps

- [x] Draw one grid cell (as rectangle) near player
- [x] Loop to generate cells around the player
- [x] Use `luck()` to randomly spawn tokens into the cells
- [x] Display token value inside each cell
- [x] Make cells clickable only if within 3-cell radius of player
- [x] Implement token pickup
- [x] Show held token on screen
- [x] Implement crafting
- [x] End game when player crafts target value
- [x] One cleanup commit

### D3.b: Globe-spanning gameplay

Key technical challenge: Can you set up your implementation to support gameplay anywhere in the real world, not just locations near our classroom?
Key gameplay challenge: Can players craft an even higher value token by moving to other locations to get access to additional crafting materials?

#### B Steps

- [x] Refactor grid system to use global coordinates (origin at Null Island: 0°, 0°)
- [x] Generate cells dynamically based on current map view
- [x] Keep a memory of cell states using a Map keyed by grid coordinates
- [x] Allow free map panning
- [x] Add UI buttons to move player one grid step
- [x] Update player’s position on button click
- [x] Test movement across large distances
- [x] Cleanup commit

### D3.c: Object Persistence

Key technical challenge: Can your software accurately remember the state of map cells even when they scroll off the screen?
Key gameplay challenge: Can you fix a gameplay bug where players can farm tokens by moving into and out of a region repeatedly?

#### C Steps

- [x] Refactor token storage to persist across all coordinates
- [x] Use `Map<string, CellState>` to store every visited cell's token value and collection state
- [x] Prevent `spawnToken` from regenerating tokens in already-visited cells
- [x] Ensure crafting updates the persistent state
- [x] Add cleanup commit

### D3.d: Gameplay Across Real-World Space and Time

Key technical challenges: Can your software remember game state even when the page is closed? Is the player character’s in-game movement controlled by the real-world geolocation of their device?
Key gameplay challenge: Can the user test the game with multiple gameplay sessions, some involving _real-world_ movement and some involving _simulated_ movement?

#### D Steps

- [x] Request real-world location using `navigator.geolocation.watchPosition()`
- [x] Update player marker based on GPS data
- [ ] Save game state to `localStorage` on change
- [ ] Load game state from `localStorage` on startup
- [ ] Allow player to switch using UI runtime control
- [ ] Allow player to start a new game
- [ ] Add cleanup commit
