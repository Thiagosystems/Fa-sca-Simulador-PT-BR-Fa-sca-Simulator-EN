# ⚡ Faísca

**An electrical control, electronics, PLC and pneumatics simulator that runs in the browser.**
Made by **Thiagosystems**. 🇧🇷 [Leia em português](README.pt-BR.md)

Faísca is a modern take on tools like CADe_SIMU and Proteus: you draw the circuit with standard IEC symbols, press **Simulate**, and see what really happens — real voltages and currents, motors turning, fuses blowing, LEDs burning out when the resistor is missing — while a built-in **diagnostic panel** explains what the circuit is doing and what can go wrong.

It is a single HTML file: no installation, no server, no account. It works offline.

---

## Features

**Drawing**
- 197 palette items (91 component types) in 18 libraries: power supplies, fuses and disconnectors, RCDs and circuit breakers (simplified or detailed symbol with thermal and magnetic trip units), contactors, motors (single-phase, three-phase, star-delta, Dahlander, DC), soft-starters and VFDs, timers and relays, push buttons (momentary, latching, double NO+NC, changeover, illuminated, pull, foot pedal, emergency) and limit switches, sensors, signalling, logic gates, PLCs (generic, S7-1200, S7-1500, ET 200, Arduino), ladder, GRAFCET, pneumatics, cables and terminals, electronics (resistors, potentiometers, capacitors, LEDs, diodes, NPN/PNP transistors, MOSFETs) and test instruments.
- Box selection, multi-select, copy/paste/duplicate, undo/redo, wire re-routing and automatic obstacle avoidance.
- CADe_SIMU-like wiring: clicks snap to the nearest terminal, ending a wire on another wire creates a real junction, touching terminals are connected, and a green marker shows where the wire will connect.
- Per-wire colours (black, brown, grey, light blue, green-yellow, red, dark blue and more) and **Colour wires by standard** (IEC 60445: L1 brown, L2 black, L3 grey, N light blue, PE green-yellow).
- The diagnostic finds points that look connected but are not, and fixes them in one click.

**Simulation with real values**
- Nodal analysis in DC and 60 Hz AC (three phases 120° apart). Editable values: resistance, voltage, power, rated current, capacitance, β, Vth… even while simulating.
- Things behave like real life: under-voltage coils don't pull in, over-voltage lamps burn, fuses and breakers trip by overload (thermal) or short circuit (magnetic, curves B/C/D), the thermal overload relay trips on real motor current, the RCD trips on earth leakage, capacitors charge with the RC curve.
- Oscilloscope (2 isolated channels) and time plots of voltage and current.

**Teaching**
- Diagnostic panel: what the circuit is doing now, problems found (missing protection, contact without coil, missing interlock, wrong voltage…) and an event log.
- Fault training: the teacher hides faults (open component, welded contact, internal short, broken wire); the student measures with the probe multimeter and points out the fault. Optional password, score counter.
- Guided tour on first use.

**Professional documentation**
- Multiple sheets per project (power, control, PLC…) with **inter-sheet links**. Cut and paste between sheets keeps device names (K1 stays K1), deleting a sheet can **merge** its contents into another one, and empty sheets are left out of the PDF.
- Drawing frame with column numbers and a **title block** (title, client, drafter, drawing number, revision, date).
- **Automatic wire numbering** by electrical potential (L1, L2, L3, N, PE, L+, M and sequential numbers).
- **Cross-references**: each contact shows the sheet/column of its coil, and each coil shows a contact mirror (`13-14 /2.3`).
- **Bill of materials** generated from the schematic (on screen, CSV for spreadsheets, and in the PDF).
- **Vector PDF** in A3 with all sheets, title block and bill of materials — the text is real, selectable and searchable.

**Settings** (gear button)
- Language: Portuguese or English.
- Light, dark or automatic theme.
- Choose what is shown on the drawing: rated values, live measurements, terminal numbers, cross-references, wire numbers, frame, grid and problem badges — for a clean, CADe_SIMU-like drawing.
- Sound and animations.

**Files**
- Projects are saved automatically in the browser; `.fais` files for backup and sharing; vector PDF export.

---

## Download and use

1. Download the ZIP and extract it.
2. Double-click **`index.html`**. It opens in Chrome, Edge or Firefox.

That's it. Everything runs locally; the only thing loaded from the internet is the font (without internet a similar system font is used).

## Install as an app (PWA)

Browsers only allow installing web apps served over **https** (or `localhost`) — double-clicking `index.html` works, but does not show the *Install* option. To get a desktop/phone icon that opens offline:

**Option A — GitHub Pages (free)**
1. Create a repository on GitHub and upload all the files from this folder (`index.html`, `manifest.webmanifest`, `sw.js`, `icons/`, …).
2. In the repository: **Settings → Pages → Branch: `main` / root → Save**.
3. Open the address GitHub shows (e.g. `https://your-user.github.io/faisca/`).
4. In Chrome/Edge: **File menu → Install app**, or the install icon in the address bar. On Android: *Add to home screen*. On iPhone (Safari): *Share → Add to Home Screen*.

**Option B — on your own computer**
```bash
cd Faisca
python3 -m http.server 8000
# open http://localhost:8000 and install from the browser menu
```

After installing, Faísca opens in its own window and works without internet.

## Keyboard shortcuts

| Key | Action |
|---|---|
| Left click | Place components, wire terminals, select, move |
| Right click | Cancel the current wire; drag to pan |
| Drag on empty area | Box selection |
| `Shift`/`Ctrl` + click | Add to / remove from selection |
| `Del` | Delete selection |
| `Ctrl+A` / `Ctrl+C` / `Ctrl+X` / `Ctrl+V` / `Ctrl+D` | Select all / copy / cut / paste / duplicate |
| `Ctrl+Z` / `Ctrl+Y` | Undo / redo |
| `Ctrl+S` / `Ctrl+O` | Save / open `.fais` |
| `R` | Rotate |
| `Ctrl+PageDown` / `Ctrl+PageUp` | Next / previous sheet |
| `Shift` + click on a push button (simulating) | Keep it held down |
| `M` (training, simulating) | Probe multimeter on/off |
| `Esc` | Cancel |
| `Ctrl+Shift+F` | Hide/show palette, side panel and toolbar at once (the arrows on the drawing edges do it one by one) |

## Files in this folder

| File | What it is |
|---|---|
| `index.html` | The whole program |
| `manifest.webmanifest`, `sw.js`, `icons/` | Used only to install as an app and work offline when hosted |
| `README.md`, `README.pt-BR.md` | This documentation |
| `LICENSE` | MIT license |

## Known limitations

- Motors are modelled as equivalent resistive loads (no starting current yet).
- Coils have no inductance: the voltage spike when switching off a relay is not simulated.
- The rectifier is a block that delivers average/peak voltage (no ripple on the oscilloscope).
- Only one PLC CPU per project.
- The fault-training password prevents casual peeking, but anyone opening the `.fais` file in a text editor can read the faults.

## License

[MIT](LICENSE) © 2026 Thiagosystems.
