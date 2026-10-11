# Lavenzo Football Legends — Phase 1.2

A Canvas 2D arcade match with six distinct, programmatically drawn legends, two fictional teams, and fictional goalkeepers. No image or font downloads are required.

## Run locally

Requires Node.js 22 (or a supported Node version for Vite).

```sh
npm install
npm run dev
```

Open the local URL printed by Vite. Click **Play Match**. Play on a desktop keyboard.

| Key | Action |
| --- | --- |
| Arrow keys | Move selected player |
| S | Short pass |
| A | Lofted cross |
| D | Shoot |
| W | Select the best available teammate near the ball / interception path |
| Esc | Pause / resume |

You control Lavenzo Legends, attacking right. Teammates and both goalkeepers run on AI. Walk into a reachable loose ball to collect it; close opponents can tackle. Hold an arrow direction when passing to prefer a teammate in that direction. Move vertically before shooting to adjust aim. Crosses rise visibly above their ground shadow. A gold ring, arrow and name identify the selected player. Matches last three minutes. Restart is available during a match and Play again appears at full time. Losing window focus pauses play.

Human passes (S) and crosses (A) immediately give control to the intended receiver; held arrows move that player during the release frame. The passer returns to AI, and possession still requires physical contact with the incoming ball. A teammate gaining possession, including the goalkeeper, takes control. An opponent gaining possession selects an outfield defender. W remains available: manual choices persist while the ball travels or ownership stays unchanged, until a new possession change or human pass/cross. Holding S/A does not trigger another kick after reception.

## Build and deploy

```sh
npm test
npm run build
npm run preview
```

The `dist/` directory is the static deployment artifact. Relative Vite asset paths support GitHub Pages repository subpaths. Push this project to a GitHub repository on `main`, then select **Settings → Pages → Source → GitHub Actions**. The included workflow tests, builds and deploys. Alternatively publish `dist/` using another static host. Deployment has not been performed by this implementation.

## Architecture

`src/input.js` handles keys, `data.js` defines attributes and rosters, `characters.js` draws animated footballers, `renderer.js` draws the stadium and pitch, `ball.js` handles ball physics, `ai.js` provides opponent/teammate decisions, `match.js` runs rules and attribute calculations, `ui.js` manages menus and HUD, and `main.js` runs the delta-time animation loop.

Speed determines top pace, acceleration changes response time, dribbling improves close touches and receiving reach and helps resist tackles, strength affects tackle resistance, shooting affects shot velocity and aim error, and passing affects short-pass and cross accuracy. Short passes rank teammates by movement direction, distance and blocked passing lanes. Crosses favour attacking runners, lead their position and calculate launch speed and height for a predicted landing time. Goalkeepers predict the shot path after a short reaction delay and collect reachable shots.

## Phase 1.1 refinements

- One switch per W press, excluding the currently selected player. A teammate in possession gets priority; otherwise predicted interception travel time determines selection, with player ID resolving ties. Held arrow keys move the new player during the same frame.
- Passes release from the ball's current position and follow physical flight, without homing. Intended receivers move to meet the ball and have a modest collection assist; opponents can intercept first. Swept collision checks prevent fast shots from skipping through players.
- Possession uses smooth close-control touches rather than snapping the ball to the owner's feet. Crosses rise, descend and bounce, with a visible ground shadow and landing marker. Aerial reception requires the ball to drop within reach.
- Shots combine goal assistance, movement direction, shooting power and deterministic attribute-based accuracy. AI aims away from the keeper, who reacts with a delay and gradually tracks the shot.
- AI support players keep separate lanes, one defender pressures the ball, and teammates steer apart when close. AI reads its own movement direction when passing, independent of the human's arrow keys.
- More detailed Canvas hairstyles, facial features, body shapes, bent limbs, socks, boots and kicking follow-through. A stronger yellow ring and arrow mark selection. The dedicated HUD shows the full name; small on-pitch surnames are laid out to avoid overlapping labels.

Run `npm test` for deterministic checks covering switching, key repeat, reception, interceptions, lofted landing, shooting, goalkeeper reactions, label placement and frame-rate consistency. These checks establish logic behaviour, not subjective visual quality or gameplay feel.

`tests/control.test.js` covers Phase 1.2 scenarios TC001–TC008, all four arrow directions on release, held kick keys, manual overrides, unexpected possession, goalkeeper/tackle handoffs and HUD updates. TC003 makes Cristiano Ronaldo a teammate only in the test fixture; the shipped teams are preserved.

## Phase 1 limitations

Arcade rules: pitch edges rebound the ball; no fouls, offside, corners or throw-ins. Aerial balls can be collected when they drop; there are no manual headers or jumps. Goalkeeper saves use range and height checks. AI is deliberately lightweight. Mouse is used for menus; gameplay requires a keyboard. Real footballers are stylised artistic tributes without official affiliation or endorsement. No career, transfers, tournaments or online multiplayer.
