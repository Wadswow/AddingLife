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
- [ ] Add UI buttons to move player one grid step
- [ ] Update player’s position on button click
- [ ] Test movement across large distances
- [ ] Cleanup commit
