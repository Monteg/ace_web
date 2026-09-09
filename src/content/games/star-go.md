---
name: Star go
type: instant
status: live
seo:
  title: Star Go - instant game by Ace Games
  description: >-
    Star Go: The game is played on a 36-cell closed board with four corners and
    four sides.
card: ../../assets/games/star-go.webp
hero: ../../assets/heroes/star-go.webp
specs:
  rtp: 0.95
  maxWin:
    value: 50
    unit: x
    approx: false
  volatility:
    - medium
    - high
  bet:
    min: 3
    max: 500
  mainFeature: Dynamic Board Progression
  layout: 36-Cell Closed Board
demo:
  mode: direct
  build: monopoly
  version: 31
  apiHost: 'https://monopoly-api.demo.rstars.cc'
features:
  - title: DICE-BASED BOARD MOVEMENT
    body: Roll two dice and move across a 36-cell closed board.
  - title: RISK OR COLLECT DECISIONS
    body: Continue after each move or secure the current winnings.
  - title: DYNAMIC BOARD REGENERATION
    body: Complete a full loop to refresh regular cell values.
---
Star Go is a risk-driven board dice game where players roll two dice, move across a dynamic board, and multiply their bet.

Each turn creates a choice between continuing the run for higher rewards or securing the current result.

## Core Gameplay

The game is played on a 36-cell closed board with four corners and four sides.

Players roll two dice, move forward by 2–12 cells, and trigger the result of the landed cell.

After each move, players can continue playing or collect their current winnings.

## Main Feature

Dynamic Board Progression

After every full loop around the board, regular cells regenerate with a new reward distribution.

## Bonus Spins & Bonus Game

Two corner cells are x0 risk zones that end the round and remove the current bet.

One Wheel of Fortune corner uses 6 fixed sectors with equal 60-degree segments.

The second Wheel of Fortune corner uses dynamic sectors based on configured reward chances.

Both wheels offer bonus payouts ranging from x5 to x100.

## Multiple Payline Wins

### EXTRA FEATURE

Chance Cell Events

Chance cells trigger instant effects such as Jump, Reroll, or Extra Spin.

## Design & Atmosphere

### BUILDING A RISK-DRIVEN BOARD SYSTEM

Star Go is built around a survival-style dice loop where every move can increase or end the run.

Players land on multiplier cells ranging from partial-loss grey cells to rare x10 gold cells.

Chance cells add instant movement and reroll effects that change the flow of each session.

Corner cells create high-impact moments through x0 risk zones and Wheel of Fortune bonuses.

Board regeneration keeps each full loop fresh while preserving the core corner structure.
