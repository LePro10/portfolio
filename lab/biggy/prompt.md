Build a stunning, scroll-reactive AI showcase website.

Use:

* React + Vite
* Tailwind CSS
* GSAP + ScrollTrigger
* Framer Motion
* Three.js / React Three Fiber if useful
* Fully responsive, but optimize for desktop wow-factor

Goal:
Create an unforgettable interactive website presenting AI models like ChatGPT, Claude, Gemini, and others. This should feel like an immersive digital art experience, not a normal landing page.

Core Experience:
As the user scrolls, they travel through different AI "worlds." Each section represents one AI model and has its own color palette, animation style, typography mood, background visuals, and logo motion.

Sections:

1. Hero

* Fullscreen cinematic intro
* Dark futuristic background
* Huge animated headline: "The AI Modelverse"
* Floating AI logos orbiting or drifting in depth
* Scroll indicator with animated glow
* Use parallax layers and particles

2. ChatGPT Section

* Colors: black, deep green, neon green
* Style: glassmorphism, neural network lines, floating chat bubbles
* Logo should move with scroll and rotate slightly
* Text should animate like generated AI output
* Smooth, intelligent, fluid motion

3. Claude Section

* Colors: warm orange, cream, soft brown
* Style: elegant editorial layout
* More minimal, premium, calm
* Logo should float gently and morph into abstract paper-like shapes
* Motion should feel slow, thoughtful, refined

4. Gemini Section

* Colors: blue, purple, violet gradients
* Style: split-screen, mirrored layouts, glowing abstract shapes
* Logo should duplicate, mirror, and react to scroll
* Motion should feel energetic and experimental

5. Final Comparison / Gallery

* Interactive cards for each model
* Cards tilt on hover
* Background changes based on hovered model
* Include short traits:

  * ChatGPT: versatile, conversational, creative
  * Claude: thoughtful, refined, human-centered
  * Gemini: multimodal, dynamic, experimental

6. Ending

* Big final cinematic statement:
  "Intelligence is no longer static."
* Animated background with all model colors blending together
* Call-to-action button: "Explore the Future"

Animation Requirements:

* Use GSAP ScrollTrigger for scroll-based transitions
* Use pinned sections where appropriate
* Background color should smoothly morph between model sections
* Logos should move, scale, rotate, and fade based on scroll progress
* Add parallax depth layers
* Add cursor glow effect
* Add hover microinteractions
* Add smooth page transitions and entrance animations
* Keep animations performant

Design Requirements:

* Extremely premium, futuristic, and dramatic
* No generic SaaS layout
* No boring blocks of text
* Strong visual hierarchy
* Big typography
* Layered gradients
* Blur, glow, glass, depth, shadows
* Custom-feeling UI
* Make it feel like an Awwwards-style interactive experience

Implementation Requirements:

* Create clean component structure:

  * App.jsx
  * components/Hero.jsx
  * components/ModelSection.jsx
  * components/ModelGallery.jsx
  * components/CursorGlow.jsx
  * data/models.js
* Use reusable model data for colors, names, descriptions, and logo paths
* Use placeholder SVG/logo files if actual logos are not available
* Include comments explaining the animation logic
* Ensure the site runs with npm install and npm run dev
* Avoid broken dependencies
* Make the final output visually complete, not just a wireframe

Important:
Prioritize design, motion, and visual impact over content depth. This is a show-off website. It should feel wild, polished, dynamic, cinematic, and unforgettable.
