Nebula X Visual – Version History
=================================

Current stable fallbacks:

- **v4**
  - **Git commit**: cd2872b
  - **Description**: Capture-ready build with:
    - Center title removed for clean visuals
    - HUD hide toggle (H) and fullscreen (F) for recording
    - Built-in canvas recorder (R) that saves .webm with optional audio
    - Same v3 particle behavior and audio band mapping

- **v3**
  - **Git commit**: 631d34a
  - **Description**: Refined v2 with:
    - Softer, clamped bass impulse to keep the nebula in frame on loud material
    - Reduced radial scaling and outward push so particles react but don’t scatter out of view
    - Same synesthetic band logic (bass/mid/high), gravity/flow fields, and long-form timeline as v2

- **v1**
  - **Git commit**: bffe133
  - **Description**: Nebula X Morphing Shapes edition with:
    - 100k particles morphing between cloud / ring / sphere
    - Scroll + arrow keys for zoom
    - Mouse warp interaction
    - Fullscreen toggle (F)
    - UI toggle on click (overlay text + control panel)
    - Clock toggle (C)
    - Audio reactivity from mic or audio file (A + panel buttons)
    - Presets and sliders for morph, color, and camera/zoom
    - Non-looping drift tuned for long ambient sessions

- **v2**
  - **Git commit**: 2b6bef3
  - **Description**: Synesthetic Nebula X with:
    - FFT-based bass/mid/high analysis
    - Bass → radial scale & impulse
    - Mids → morph factor shaping (cloud / ring / sphere)
    - Highs → twinkle intensity and micro jitter
    - Gravity well around cursor plus steerable flow field
    - Long-form timeline phases (slow build density & saturation)
    - Automatic macro/micro vista zooming over time
    - Bright baseline particles for clear visibility

Use **v1** or **v2** as fallbacks if future experiments break the experience:
- `git checkout bffe133` for v1
- `git checkout 2b6bef3` for v2

