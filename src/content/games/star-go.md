---
name: "Star Go"
type: instant
status: live
seo:
  title: "Star Go - instant game by Ace Games"
  description: "Star Go: The game is played on a 36-cell closed board with four corners and four sides."
card: ../../assets/games/star-go.webp
hero: ../../assets/heroes/star-go.webp
specs:
  rtp: 0.95
  maxWin: { value: 50, unit: x, approx: false }
  volatility: [medium, high]
  bet: { min: 3.0, max: 500.0 }
  mainFeature: "Dynamic Board Progression"
  layout: "36-Cell Closed Board"
demo:
  mode: direct
  build: "monopoly"
  version: 31
  apiHost: "https://monopoly-api.demo.rstars.cc"
highlights:
  - "36-cell closed board with dice-based movement"
  - "Common, Uncommon, Rare, and Epic multiplier cells"
  - "Chance events with Jump, Reroll, and Extra Spin effects"
  - "Two Wheel of Fortune bonuses with x5 to x100 payouts"
features:
  - title: "Dice-Based Board Movement"
    body: "Roll two dice and move across a 36-cell closed board."
  - title: "Risk Or Collect Decisions"
    body: "Continue after each move or secure the current winnings."
  - title: "Dynamic Board Regeneration"
    body: "Complete a full loop to refresh regular cell values."
---

The game is played on a 36-cell closed board with four corners and four sides.

Players roll two dice, move forward by 2-12 cells, and trigger the result of the landed cell.

After each move, players can continue playing or collect their current winnings.

Dynamic Board Progression

After every full loop around the board, regular cells regenerate with a new reward distribution.

Two corner cells are x0 risk zones that end the round and remove the current bet.

One Wheel of Fortune corner uses 6 fixed sectors with equal 60-degree segments.

The second Wheel of Fortune corner uses dynamic sectors based on configured reward chances.

Both wheels offer bonus payouts ranging from x5 to x100.

Chance Cell Events

Chance cells trigger instant effects such as Jump, Reroll, or Extra Spin.

## Building A Risk-Driven Board System

Star Go is built around a survival-style dice loop where every move can increase or end the run.

Players land on multiplier cells ranging from partial-loss grey cells to rare x10 gold cells.

Chance cells add instant movement and reroll effects that change the flow of each session.

Corner cells create high-impact moments through x0 risk zones and Wheel of Fortune bonuses.

Board regeneration keeps each full loop fresh while preserving the core corner structure.
