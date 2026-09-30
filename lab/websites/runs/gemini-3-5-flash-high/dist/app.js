/* ==========================================================================
   AETHERIS AI - SYSTEM MAIN CONTROLLER & INTERACTIVE LOGIC
   ========================================================================== */

// --- 1. RETRO-FUTURISTIC WEB AUDIO SYNTHESIZER ENGINE ---
class CyberAudioSynth {
    constructor() {
        this.ctx = null;
        this.audioOn = false;
    }

    init() {
        if (this.ctx) return;
        // Create context complying with modern browser guidelines
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        this.ctx = new AudioContext();
    }

    resume() {
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    playClick() {
        if (!this.audioOn || !this.ctx) return;
        this.resume();

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        
        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.type = 'sine';
        osc.frequency.setValueAtTime(1200, this.ctx.currentTime);
        // Rapid pitch descent for click feel
        osc.frequency.exponentialRampToValueAtTime(100, this.ctx.currentTime + 0.05);

        gain.gain.setValueAtTime(0.04, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.05);

        osc.start();
        osc.stop(this.ctx.currentTime + 0.06);
    }

    playSuccess() {
        if (!this.audioOn || !this.ctx) return;
        this.resume();

        // Beautiful synthesized digital chord sweep
        const now = this.ctx.currentTime;
        const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6 arpeggio

        notes.forEach((freq, idx) => {
            const time = now + idx * 0.08;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            
            osc.connect(gain);
            gain.connect(this.ctx.destination);

            osc.type = 'triangle';
            osc.frequency.setValueAtTime(freq, time);
            
            gain.gain.setValueAtTime(0.04, time);
            gain.gain.exponentialRampToValueAtTime(0.001, time + 0.3);

            osc.start(time);
            osc.stop(time + 0.35);
        });
    }

    playGeneticBeep() {
        if (!this.audioOn || !this.ctx) return;
        this.resume();

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        
        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.type = 'sine';
        // Random organic frequency pitch bubble
        const freq = 600 + Math.random() * 400;
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(freq * 0.5, this.ctx.currentTime + 0.08);

        gain.gain.setValueAtTime(0.015, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.09);

        osc.start();
        osc.stop(this.ctx.currentTime + 0.1);
    }

    playWipe() {
        if (!this.audioOn || !this.ctx) return;
        this.resume();

        // Sub-synth sweep simulating an extinction laser
        const osc = this.ctx.createOscillator();
        const filter = this.ctx.createBiquadFilter();
        const gain = this.ctx.createGain();

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx.destination);

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(350, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(40, this.ctx.currentTime + 0.65);

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(600, this.ctx.currentTime);
        filter.frequency.exponentialRampToValueAtTime(80, this.ctx.currentTime + 0.65);

        gain.gain.setValueAtTime(0.035, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.65);

        osc.start();
        osc.stop(this.ctx.currentTime + 0.7);
    }

    playSectionRise() {
        if (!this.audioOn || !this.ctx) return;
        this.resume();

        // Epic sub-bass riser for smooth viewport snaps
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.type = 'sine';
        osc.frequency.setValueAtTime(55, this.ctx.currentTime);
        osc.frequency.linearRampToValueAtTime(110, this.ctx.currentTime + 0.45);

        gain.gain.setValueAtTime(0.0, this.ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.06, this.ctx.currentTime + 0.15);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.5);

        osc.start();
        osc.stop(this.ctx.currentTime + 0.55);
    }
}


// --- 2. THE APPLICATION MAIN CONTROLLER ---
class AetherisApp {
    constructor() {
        this.audioSynth = new CyberAudioSynth();
        
        // Custom Cursor Coordinates
        this.mouse = { x: 0, y: 0 };
        this.ring = { x: 0, y: 0 };
        this.activeSection = 'hero';

        this.init();
    }

    init() {
        this.setupCustomCursor();
        this.setupSectionObserver();
        this.setupAudioHUDToggle();
        this.setupTerminalPrompts();
        this.setupCodexNavigation();
        this.startDiagnosticTickers();
    }

    // --- CUSTOM LERP DUAL-RING CURSOR ---
    setupCustomCursor() {
        const dot = document.getElementById('cursor-dot');
        const ring = document.getElementById('cursor-ring');
        if (!dot || !ring) return;

        window.addEventListener('mousemove', (e) => {
            this.mouse.x = e.clientX;
            this.mouse.y = e.clientY;
            
            // Instantly move the central point
            dot.style.left = `${this.mouse.x}px`;
            dot.style.top = `${this.mouse.y}px`;
        });

        // Soft Linear Interpolation (LERP) physics loop for outer ring
        const animateCursorRing = () => {
            const lerpFactor = 0.16;
            this.ring.x += (this.mouse.x - this.ring.x) * lerpFactor;
            this.ring.y += (this.mouse.y - this.ring.y) * lerpFactor;

            ring.style.left = `${this.ring.x}px`;
            ring.style.top = `${this.ring.y}px`;

            requestAnimationFrame(animateCursorRing);
        };
        animateCursorRing();

        // Add hovering listeners to clickable nodes
        const attachCursorHoverTriggers = () => {
            const targets = document.querySelectorAll('a, button, select, input[type="range"], .terminal-btn-tag, .codex-nav-btn, .step-btn');
            
            targets.forEach(t => {
                // Prevent duplicate listeners
                if (t.dataset.cursorBound) return;
                t.dataset.cursorBound = true;

                t.addEventListener('mouseenter', () => {
                    document.body.classList.add('hovering-link');
                    if (t.classList.contains('magnet-effect')) {
                        document.body.classList.add('hovering-magnet');
                    }
                });

                t.addEventListener('mouseleave', () => {
                    document.body.classList.remove('hovering-link', 'hovering-magnet');
                });
            });
        };

        // Run cursor triggers on load
        attachCursorHoverTriggers();
        
        // Monitor DOM dynamically for modular button updates
        const observer = new MutationObserver(() => attachCursorHoverTriggers());
        observer.observe(document.body, { childList: true, subtree: true });

        // Add physical press effects
        window.addEventListener('mousedown', () => document.body.classList.add('active-click'));
        window.addEventListener('mouseup', () => document.body.classList.remove('active-click'));
    }

    // --- VIEWPORT SCROLL INTERSECTION SECTIONS ---
    setupSectionObserver() {
        const container = document.querySelector('.viewport-container');
        const sections = document.querySelectorAll('.viewport-section');
        const navItems = document.querySelectorAll('.nav-item');
        const scrollBar = document.getElementById('timeline-scroll-bar');
        
        if (!container || sections.length === 0) return;

        // Visual Intersection Observer
        const obsOptions = {
            root: container,
            threshold: 0.55 // Trigger when section mostly fills viewport
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const id = entry.target.getAttribute('id');
                    
                    if (this.activeSection !== id) {
                        this.activeSection = id;
                        
                        // play cyber riser hum
                        this.audioSynth.playSectionRise();
                        this.audioSynth.playClick();
                    }

                    // Reset sections active classes
                    sections.forEach(s => s.classList.remove('active'));
                    entry.target.classList.add('active');

                    // Highlight side indicator dot HUD
                    navItems.forEach(n => {
                        n.classList.remove('active');
                        if (n.getAttribute('data-section') === id) {
                            n.classList.add('active');
                        }
                    });
                }
            });
        }, obsOptions);

        sections.forEach(s => observer.observe(s));

        // Connect scroll snapping to side navigation dots directly
        navItems.forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const targetId = item.getAttribute('href');
                const targetSec = document.querySelector(targetId);
                
                if (targetSec) {
                    targetSec.scrollIntoView({ behavior: 'smooth' });
                }
            });
        });

        // Dynamic Chronos Timeline central glowing conduit completion track
        container.addEventListener('scroll', () => {
            const timelineSec = document.getElementById('timeline');
            if (!timelineSec) return;

            const rect = timelineSec.getBoundingClientRect();
            const viewHeight = window.innerHeight;

            // Compute how far along the timeline section the user has scrolled
            if (rect.top <= viewHeight && rect.bottom >= 0) {
                const scrollableDist = rect.height + viewHeight;
                const scrolledAmount = viewHeight - rect.top;
                const progress = Math.min(100, Math.max(0, (scrolledAmount / scrollableDist) * 135)); // scale conduit growth
                
                if (scrollBar) {
                    scrollBar.style.height = `${progress}%`;
                }

                // Trigger active timeline cards reveal on depth reach
                const cards = timelineSec.querySelectorAll('.timeline-item');
                cards.forEach(card => {
                    const cardRect = card.getBoundingClientRect();
                    if (cardRect.top < viewHeight * 0.75) {
                        if (!card.classList.contains('active-node')) {
                            card.classList.add('active-node');
                            this.audioSynth.playClick();
                        }
                    } else {
                        card.classList.remove('active-node');
                    }
                });
            }
        });
    }

    // --- CYBERNETIC SOUND TOGGLE CONTROL ---
    setupAudioHUDToggle() {
        const toggle = document.getElementById('audio-toggle');
        if (!toggle) return;

        toggle.addEventListener('click', () => {
            this.audioSynth.init();
            this.audioSynth.audioOn = !this.audioSynth.audioOn;
            
            toggle.classList.toggle('active');
            
            const txt = toggle.querySelector('.audio-text');
            if (this.audioSynth.audioOn) {
                txt.textContent = 'AUDIO ON';
                this.audioSynth.playSuccess();
            } else {
                txt.textContent = 'AUDIO OFF';
            }
        });
    }

    // --- HERO INTERACTIVE TERMINAL PROMPTS ---
    setupTerminalPrompts() {
        const tags = document.querySelectorAll('.terminal-btn-tag');
        const output = document.getElementById('terminal-out');
        const inputDisplay = document.getElementById('terminal-display-input');
        
        if (tags.length === 0 || !output || !inputDisplay) return;

        tags.forEach(tag => {
            tag.addEventListener('click', () => {
                const cmd = tag.getAttribute('data-cmd');
                this.audioSynth.playClick();
                
                // Clear display and mock type key character sequence
                inputDisplay.textContent = '';
                let index = 0;
                
                const typeTimer = setInterval(() => {
                    if (index < cmd.length) {
                        inputDisplay.textContent += cmd[index];
                        index++;
                        if (Math.random() < 0.3) this.audioSynth.playClick();
                    } else {
                        clearInterval(typeTimer);
                        this.executeTerminalCommand(cmd);
                    }
                }, 28);
            });
        });
    }

    executeTerminalCommand(cmd) {
        const output = document.getElementById('terminal-out');
        if (!output) return;

        const writeLine = (text, cls = '') => {
            const p = document.createElement('p');
            p.className = `terminal-line ${cls}`;
            p.textContent = `> ${text}`;
            output.appendChild(p);
            
            // Limit output scroll memory
            if (output.children.length > 8) {
                output.removeChild(output.firstChild);
            }
            output.scrollTop = output.scrollHeight;
        };

        writeLine(`Running protocol: ${cmd}...`, 'success');

        setTimeout(() => {
            switch(cmd) {
                case 'INIT_NEURAL_SYNAPSE':
                    writeLine('Connecting to Neural Architect hardware...');
                    setTimeout(() => {
                        if (window.neuralNetSim) {
                            window.neuralNetSim.isTraining = true;
                            const trainBtn = document.getElementById('nn-train-btn');
                            if (trainBtn) trainBtn.querySelector('.btn-text').textContent = 'PAUSE TRAINING';
                            writeLine('Hardware mapping established. Training active.', 'success');
                            this.audioSynth.playSuccess();
                        }
                    }, 500);
                    break;
                case 'MUTATE_GENOME_CORE':
                    writeLine('Altering mutation sequence coordinates...');
                    setTimeout(() => {
                        if (window.geneticSim) {
                            // Inject species and push mutations to max slider level
                            const slider = document.getElementById('gen-mutation-slider');
                            const sliderVal = document.getElementById('gen-mutation-val');
                            if (slider) {
                                slider.value = 85;
                                sliderVal.textContent = '85%';
                                window.geneticSim.mutationRate = 0.85;
                            }
                            for (let i = 0; i < 8; i++) {
                                window.geneticSim.specimens.push(window.geneticSim.createSpecimen());
                            }
                            writeLine('DNA sequence corrupted. Advanced speciation active.', 'error');
                            this.audioSynth.playWipe();
                        }
                    }, 500);
                    break;
                case 'DECODE_QUANTUM_STREAM':
                    writeLine('Syncing with Quantum probability fields...');
                    let syncTicks = 0;
                    const syncLoop = setInterval(() => {
                        const probability = (Math.random() * 100).toFixed(2);
                        writeLine(`Entangling qubits... field_density: ${probability}%`, 'output-text');
                        syncTicks++;
                        if (syncTicks >= 3) {
                            clearInterval(syncLoop);
                            writeLine('Quantum Matrix operational. Coherence locked.', 'success');
                            this.audioSynth.playSuccess();
                        }
                    }, 250);
                    break;
                case 'BOOT_AUDIO_SYNTH':
                    writeLine('Bypassing local sound relays...');
                    setTimeout(() => {
                        const toggle = document.getElementById('audio-toggle');
                        if (toggle && !this.audioSynth.audioOn) {
                            toggle.click();
                            writeLine('Audio synthesized correctly. Matrix online.', 'success');
                        } else {
                            writeLine('Audio synth already operating.', 'output-text');
                        }
                    }, 400);
                    break;
            }
        }, 400);
    }

    // --- SYSTEM CODEX PANEL TABS ROUTER ---
    setupCodexNavigation() {
        const btns = document.querySelectorAll('.codex-nav-btn');
        const panels = document.querySelectorAll('.codex-panel');
        if (btns.length === 0 || panels.length === 0) return;

        btns.forEach(btn => {
            btn.addEventListener('click', () => {
                const targetId = btn.getAttribute('data-target');
                this.audioSynth.playClick();

                // Swap navigation buttons
                btns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');

                // Visual panels fade slide swaps
                panels.forEach(p => {
                    p.classList.remove('active');
                    if (p.getAttribute('id') === `doc-${targetId}`) {
                        p.classList.add('active');
                        this.audioSynth.playSuccess();
                    }
                });
            });
        });
    }

    // --- CLOCK & LIVE PERFORMANCE DIALS TICKER ---
    startDiagnosticTickers() {
        const coreLoad = document.getElementById('core-load-val');
        
        setInterval(() => {
            if (coreLoad) {
                // Fluctuate CPU loading levels
                const baseline = this.activeSection === 'playground' ? 24 : 12;
                const value = Math.floor(baseline + Math.random() * 8);
                coreLoad.textContent = `${value}%`;
            }
        }, 1500);
    }
}

// Initialise core app logic on page boot
window.addEventListener('DOMContentLoaded', () => {
    window.appEngine = new AetherisApp();
});
