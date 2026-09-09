---
name: Pigeon Road
type: instant
status: live
seo:
  title: Pigeon Road - instant game by Ace Games
  description: >-
    Players choose a bet amount and risk level before starting the round. Each
    step has its own multiplier and is resolved by the server.
card: ../../assets/games/pigeon-road.webp
hero: ../../assets/heroes/pigeon-road.webp
specs:
  rtp: 0.97
  maxWin:
    value: 50
    unit: x
    approx: false
  volatility:
    - low
    - medium
    - high
  bet:
    min: 3
    max: 500
  mainFeature: Step Multiplier Progression
  layout: Step Road Progression
demo:
  mode: direct
  build: pigeon_road
  version: 21
  apiHost: 'https://pigeon-road-api.demo.rstars.cc'
features:
  - title: STEP-BY-STEP PROGRESSION
    body: Move through sequential steps with rising multipliers.
  - title: RISK OR COLLECT DECISIONS
    body: Collect after a successful step or continue for more.
  - title: THREE RISK LEVELS
    body: 'Choose Low, Medium, or High gameplay.'
---
Pigeon Road is a step multiplier game where players move through a road of rising coefficients.

After each successful step, players can collect the current payout or continue for a higher multiplier.

## Core Gameplay

Players choose a bet amount and risk level before starting the round.

Each step has its own multiplier and is resolved by the server.

If a step fails before Cash Out, the round ends and the bet is lost.

## Main Feature

Step Multiplier Progression

Each successful step unlocks a higher coefficient and increases the potential payout.

## Bonus Spins & Bonus Game

### ROUND FLOW

The round starts with bet setup, risk selection, and server confirmation.

After the bet is accepted, the player begins progressing through active steps.

Successful steps unlock Cash Out and allow the player to continue to the next step.

The round ends after Cash Out or after a failed step.

## Multiple Payline Wins

### EXTRA FEATURE

Risk Level System

Low, Medium, and High modes change step count, multiplier growth, and win probability.

## Design & Atmosphere

### BUILDING A STEP MULTIPLIER EXPERIENCE

Pigeon Road is built around short rounds, rising coefficients, and constant collect-or-continue decisions.

Players progress step by step, with each successful move increasing the current multiplier.

Risk levels shape the full round structure, from safer low-risk paths to faster Extreme multiplier growth.

Cash Out gives players control over when to secure winnings before a failed step ends the round.

This creates a fast risk-reward loop focused on timing, progression, and multiplier tension.
