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

#### Steps

- [ ] Draw one grid cell (as rectangle) near player
- [ ] Loop to generate a 5×5 grid of cells around player
- [ ] Use `luck()` to randomly spawn value-1 tokens in cells (deterministic per cell)
- [ ] Display token value inside each cell (text or simple graphic)
- [ ] Make cells clickable only if within 3-cell radius of player
- [ ] Implement token pickup
- [ ] Show held token on screen
- [ ] Implement crafting
- [ ] End game when player crafts target value
- [ ] Add one cleanup commit
