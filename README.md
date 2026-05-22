# 🌫️ Smoke Simulation

A real-time smoke simulation running entirely in the browser using **JavaScript** and **WebGL**. Built on the incompressible Navier-Stokes equations, it produces fluid, physically-plausible smoke behaviour at interactive frame rates.

![Smoke Simulation Demo](demo.gif)
> *Replace with a screenshot or GIF of your simulation*

---

## ✨ Features

- Real-time fluid simulation on the GPU via WebGL
- Navier-Stokes solver with velocity advection, pressure projection, and divergence correction
- Interactive — click or drag to inject smoke and velocity
- Configurable simulation parameters (viscosity, diffusion, timestep)
- Runs entirely in the browser — no server, no install

---

## 🚀 Getting Started

### Prerequisites

- A modern browser with WebGL support (Chrome, Firefox, Safari, Edge)
- A local HTTP server (required to serve shader files)

### Running Locally

```bash
# Clone the repository
git clone https://github.com/your-username/smoke-simulation.git
cd smoke-simulation

# Serve with any static file server, e.g.:
npx serve .
# or
python3 -m http.server 8080
```

Then open `http://localhost:8080` in your browser.

### Controls

| Input | Action |
|-------|--------|
| Click & drag | Inject smoke and impart velocity |
| Scroll wheel | Adjust injection radius |
| `R` | Reset simulation |
| `Space` | Pause / resume |

---

## 🔬 How It Works

The simulation solves the **incompressible Navier-Stokes equations** on a 2D staggered grid, entirely on the GPU using WebGL fragment shaders.

### The Navier-Stokes Equations

The fluid velocity field **u** evolves according to:

```
∂u/∂t + (u · ∇)u = −∇p + ν∇²u + f
∇ · u = 0
```

Where:
- `u` — velocity field
- `p` — pressure
- `ν` — kinematic viscosity
- `f` — external forces (user input)

### Simulation Pipeline

Each frame executes the following steps via ping-pong framebuffers:

```
1. Advect velocity      →  Semi-Lagrangian advection (stable, unconditionally)
2. Apply forces         →  Add user-injected velocity
3. Diffuse velocity     →  Jacobi iteration for viscous diffusion
4. Compute divergence   →  ∇ · u  (should be zero for incompressible flow)
5. Solve pressure       →  Iterative Jacobi solver: ∇²p = ∇ · u
6. Project velocity     →  u ← u − ∇p  (enforce ∇ · u = 0)
7. Advect density       →  Move smoke dye along the corrected velocity field
8. Render               →  Draw density field to screen
```

### Key Techniques

**Semi-Lagrangian Advection** — Rather than tracing particles forward, each grid cell looks backward along the velocity field to find where it came from, sampling the previous frame's value. This is unconditionally stable for any timestep.

**Pressure Projection (Helmholtz Decomposition)** — After each advection/force step, the velocity field may have non-zero divergence. We solve a Poisson equation for pressure, then subtract the pressure gradient to recover a divergence-free field. This enforces incompressibility.

**Jacobi Iteration** — Both the viscosity diffusion and pressure Poisson equations are solved iteratively on the GPU. More iterations = higher accuracy; fewer = faster frame rate. Typically 20–50 iterations strikes a good balance.

**Ping-Pong Framebuffers** — WebGL can't read and write the same texture simultaneously. Two sets of framebuffers are swapped each step so the output of one pass becomes the input of the next.

---

## 📁 Project Structure

```
smoke-simulation/
├── index.html          # Entry point
├── main.js             # Simulation loop and WebGL setup
├── solver.js           # Navier-Stokes solver steps
├── shaders/
│   ├── advect.frag     # Semi-Lagrangian advection
│   ├── divergence.frag # Divergence computation
│   ├── pressure.frag   # Jacobi pressure solver
│   ├── project.frag    # Velocity projection
│   ├── diffuse.frag    # Viscosity diffusion
│   └── render.frag     # Final density render
├── utils.js            # WebGL helpers, framebuffer management
└── README.md
```

---

## ⚙️ Configuration

Parameters can be tuned at the top of `main.js`:

```js
const CONFIG = {
  GRID_SIZE:         512,    // Simulation resolution (power of 2)
  PRESSURE_ITERS:    30,     // Jacobi iterations for pressure solve
  DIFFUSION_ITERS:   20,     // Jacobi iterations for diffusion
  TIMESTEP:          0.016,  // Seconds per step (~60fps)
  VISCOSITY:         0.0001, // Kinematic viscosity
  DENSITY_DECAY:     0.99,   // How fast smoke fades (0–1)
  VELOCITY_DECAY:    0.99,   // How fast velocity dissipates
};
```

Higher `GRID_SIZE` gives finer detail but reduces performance. `PRESSURE_ITERS` is the biggest performance lever — reduce it on lower-end GPUs.

---

## 🧠 References & Further Reading

- [Real-Time Fluid Dynamics for Games — Jos Stam (2003)](http://www.dgp.toronto.edu/people/stam/reality/Research/pdf/GDC03.pdf)
- [Fluid Simulation for Computer Graphics — Robert Bridson](https://www.cs.ubc.ca/~rbridson/fluidsimulation/)
- [WebGL Fluid Simulation — Pavel Dobryakov](https://github.com/PavelDoGreat/WebGL-Fluid-Simulation)
- [GPU Gems Chapter 38 — Fast Fluid Dynamics Simulation on the GPU](https://developer.nvidia.com/gpugems/gpugems/part-vi-beyond-triangles/chapter-38-fast-fluid-dynamics-simulation-gpu)

---

## 📄 License

MIT License — see [LICENSE](LICENSE) for details.
