# Orbit — Space Harmonizer

A browser-based, Fibonacci-inspired drone instrument built with TypeScript and the Web Audio API.

## Run locally

Install Node.js, then from this directory run:

```sh
npm install
npm run dev
```

Open the local URL printed by Vite. To make a production bundle, run `npm run build`.

## Play

- Drag the glowing dot along the arc to choose a frequency from 0 to 432 Hz. The drone retunes continuously as you move and settles on release.
- Scroll up or down over the arc to tune in 2 Hz steps; hold Shift while scrolling for 10 Hz steps.
- Fibonacci values are marked on the arc; the readout shows the nearest Fibonacci value.
- Set 1–12 natural harmonics to change the number of whole-number overtones.
- Turn modulation on for a slow pitch drift, then set its depth from 0 to 12 cents.
- Select **Random melody** to let the drone move through a changing order of Fibonacci-adjacent tones. Selecting it again, dragging, or scrolling stops the sequence.
- Select **Begin listening** (or press Space) to start the softly layered drone. Press again to fade out.
- Use arrow keys on the focused frequency control; hold Shift for 10 Hz steps.

The instrument starts silent and creates audio only after a user action.
