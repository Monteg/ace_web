---
name: "Chicken Doom"
type: instant
status: live
seo:
  title: "Chicken Doom - instant game by Ace Games"
  description: "Players choose a bet amount and risk level before starting the round. Each step has its own multiplier and is resolved by the server."
card: ../../assets/games/chicken-doom.webp
hero: ../../assets/heroes/chicken-doom.webp
specs:
  rtp: 0.97
  maxWin: { value: 50, unit: x, approx: false }
  volatility: [low, medium, high]
  bet: { min: 3.0, max: 500.0 }
  mainFeature: "Step Multiplier Progression"
  layout: "Step Path Progression"
demo:
  mode: direct
  build: "doom"
  version: 57
  apiHost: "https://pigeon-road-api.demo.rstars.cc"
highlights:
  - "Step multipliers"
  - "Cash Out"
  - "Risk levels"
  - "Round history"
features:
  - title: "Step-By-Step Progression"
    body: "Guide the chicken through sequential steps with rising multipliers."
  - title: "Risk Or Collect Decisions"
    body: "Collect after a successful step or continue for more."
  - title: "Three Risk Levels"
    body: "Choose Low, Medium, or High gameplay."
---

Players choose a bet amount and risk level before starting the round.

Each step has its own multiplier and is resolved by the server.

If the chicken fails on a step before Cash Out, the round ends and the bet is lost.

Step Multiplier Progression

Each successful step unlocks a higher coefficient and increases the potential payout.

The round starts with bet setup, risk selection, and server confirmation.

After the bet is accepted, the chicken begins moving through active steps.

Successful steps unlock Cash Out and allow the player to continue to the next step.

The round ends after Cash Out or after a failed step.

Risk Level System

Low, Medium, and High modes change step count, multiplier growth, and win probability.

## Building A Step Multiplier Experience

Chicken Doom is built around short rounds, rising coefficients, and constant collect-or-continue decisions.

Players guide the chicken step by step, with each successful move increasing the current multiplier.

Risk levels shape the full round structure, from safer Low paths to faster High multiplier growth.

Cash Out gives players control over when to secure winnings before a failed step ends the round.

This creates a fast risk-reward loop focused on timing, progression, and multiplier tension.
