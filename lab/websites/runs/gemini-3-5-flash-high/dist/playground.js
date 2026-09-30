/* ==========================================================================
   AETHERIS AI - PLAYGROUND SIMULATORS (NEURAL & GENETIC EVOLUTION)
   ========================================================================== */

// ==========================================================================
// 1. NEURAL NETWORK ARCHITECT SIMULATOR
// ==========================================================================

class NeuralNetworkSimulator {
    constructor() {
        this.canvas = document.getElementById('nn-canvas');
        this.lossCanvas = document.getElementById('nn-loss-graph');
        if (!this.canvas || !this.lossCanvas) return;

        this.ctx = this.canvas.getContext('2d');
        this.lossCtx = this.lossCanvas.getContext('2d');

        // State variables
        this.hiddenCount = 4;
        this.epoch = 0;
        this.loss = 0.65;
        this.isTraining = false;
        this.datasetType = 'linear'; // 'linear', 'sine', 'circle'
        this.lossHistory = [];
        this.weights = [];
        this.weightPulses = [];
        this.pulseTimer = 0;
        
        // Node layout coordinates
        this.nodes = { input: [], hidden: [], output: [] };

        this.init();
    }

    init() {
        this.resize();
        this.generateWeights();
        this.setupEventListeners();
        this.resetLossHistory();
        this.render();
    }

    resize() {
        // Fix scaling for crisp visual render
        this.width = this.canvas.parentElement.clientWidth;
        this.height = this.canvas.parentElement.clientHeight;
        this.canvas.width = this.width;
        this.canvas.height = this.height;

        this.lossWidth = this.lossCanvas.parentElement.clientWidth;
        this.lossHeight = this.lossCanvas.parentElement.clientHeight;
        this.lossCanvas.width = this.lossWidth;
        this.lossCanvas.height = this.lossHeight;

        this.calculateNodeLayout();
    }

    calculateNodeLayout() {
        const paddingX = 80;
        const colWidth = (this.width - paddingX * 2) / 2;

        this.nodes = { input: [], hidden: [], output: [] };

        // Input Nodes (2 features: X, Y)
        const inputY = [this.height * 0.35, this.height * 0.65];
        inputY.forEach(y => this.nodes.input.push({ x: paddingX, y }));

        // Hidden Layer Nodes (dynamic counts)
        const stepY = (this.height - 60) / (this.hiddenCount - 1 || 1);
        const hiddenStartX = paddingX + colWidth;
        for (let i = 0; i < this.hiddenCount; i++) {
            const y = this.hiddenCount === 1 ? this.height / 2 : 30 + i * stepY;
            this.nodes.hidden.push({ x: hiddenStartX, y });
        }

        // Output Node (1 classification)
        this.nodes.output.push({ x: paddingX + colWidth * 2, y: this.height / 2 });
    }

    generateWeights() {
        this.weights = {
            inputToHidden: [],
            hiddenToOutput: []
        };

        // Synaptic connections inputs -> hidden
        for (let i = 0; i < 2; i++) {
            this.weights.inputToHidden[i] = [];
            for (let j = 0; j < this.hiddenCount; j++) {
                this.weights.inputToHidden[i].push((Math.random() - 0.5) * 2);
            }
        }

        // Synaptic connections hidden -> output
        for (let i = 0; i < this.hiddenCount; i++) {
            this.weights.hiddenToOutput.push((Math.random() - 0.5) * 2);
        }
    }

    resetLossHistory() {
        this.lossHistory = [];
        this.loss = 0.65;
        this.epoch = 0;
        this.isTraining = false;
        
        const trainBtn = document.getElementById('nn-train-btn');
        if (trainBtn) {
            trainBtn.querySelector('.btn-text').textContent = 'TRAIN NETWORK';
        }

        document.getElementById('nn-loss-val').textContent = this.loss.toFixed(4);
        document.getElementById('nn-epoch-val').textContent = this.epoch;

        for (let i = 0; i < 40; i++) {
            this.lossHistory.push(null);
        }
    }

    setupEventListeners() {
        // Decrease Hidden Nodes
        document.getElementById('nn-node-dec').addEventListener('click', () => {
            if (this.hiddenCount > 2) {
                this.hiddenCount--;
                document.getElementById('nn-node-val').textContent = this.hiddenCount;
                this.calculateNodeLayout();
                this.generateWeights();
                this.resetLossHistory();
                this.triggerSynthClick();
            }
        });

        // Increase Hidden Nodes
        document.getElementById('nn-node-inc').addEventListener('click', () => {
            if (this.hiddenCount < 8) {
                this.hiddenCount++;
                document.getElementById('nn-node-val').textContent = this.hiddenCount;
                this.calculateNodeLayout();
                this.generateWeights();
                this.resetLossHistory();
                this.triggerSynthClick();
            }
        });

        // Reset Weights
        document.getElementById('nn-reset-btn').addEventListener('click', () => {
            this.resetLossHistory();
            this.generateWeights();
            this.triggerSynthClick();
        });

        // Train Network Toggle
        document.getElementById('nn-train-btn').addEventListener('click', (e) => {
            this.isTraining = !this.isTraining;
            e.currentTarget.querySelector('.btn-text').textContent = this.isTraining ? 'PAUSE TRAINING' : 'TRAIN NETWORK';
            this.triggerSynthClick();
        });

        // Dataset selection pattern
        document.getElementById('nn-dataset').addEventListener('change', (e) => {
            this.datasetType = e.target.value;
            this.resetLossHistory();
            this.triggerSynthClick();
        });

        window.addEventListener('resize', () => this.resize());
    }

    triggerSynthClick() {
        if (window.appEngine && window.appEngine.audioSynth) {
            window.appEngine.audioSynth.playClick();
        }
    }

    triggerSynthSuccess() {
        if (window.appEngine && window.appEngine.audioSynth) {
            window.appEngine.audioSynth.playSuccess();
        }
    }

    trainStep() {
        this.epoch++;
        
        // Simulating mathematical convergence curve based on selected pattern difficulty
        let limit = 0.015;
        let speed = 0.01;
        if (this.datasetType === 'sine') {
            limit = 0.045;
            speed = 0.007;
        } else if (this.datasetType === 'circle') {
            limit = 0.085;
            speed = 0.004;
        }

        const delta = (0.7 - limit) * Math.exp(-this.epoch * speed);
        const noise = (Math.random() - 0.5) * 0.012;
        this.loss = limit + delta + Math.max(-0.02, noise);
        
        // Push to scrolling micro-plot history
        this.lossHistory.push(this.loss);
        if (this.lossHistory.length > 40) {
            this.lossHistory.shift();
        }

        // Apply visual exciting pulses along link routes
        if (Math.random() < 0.15) {
            this.spawnWeightPulse();
        }

        document.getElementById('nn-loss-val').textContent = Math.max(0.0001, this.loss).toFixed(4);
        document.getElementById('nn-epoch-val').textContent = this.epoch;

        // Auto-pause when trained successfully
        if (this.loss < limit + 0.005) {
            this.isTraining = false;
            const trainBtn = document.getElementById('nn-train-btn');
            if (trainBtn) {
                trainBtn.querySelector('.btn-text').textContent = 'TRAINING COMPLETE';
                trainBtn.style.borderColor = 'var(--neon-green)';
            }
            this.triggerSynthSuccess();
        }
    }

    spawnWeightPulse() {
        const inpIdx = Math.floor(Math.random() * 2);
        const hidIdx = Math.floor(Math.random() * this.hiddenCount);
        
        // Add to active pulses animating along paths
        this.weightPulses.push({
            type: 'in-hid',
            startNode: this.nodes.input[inpIdx],
            endNode: this.nodes.hidden[hidIdx],
            progress: 0,
            speed: 0.02 + Math.random() * 0.02,
            color: this.weights.inputToHidden[inpIdx][hidIdx] > 0 ? 'var(--neon-cyan)' : 'var(--neon-purple)'
        });
        
        // Chain to output
        setTimeout(() => {
            if (!this.isTraining) return;
            const outIdx = 0;
            this.weightPulses.push({
                type: 'hid-out',
                startNode: this.nodes.hidden[hidIdx],
                endNode: this.nodes.output[outIdx],
                progress: 0,
                speed: 0.03,
                color: this.weights.hiddenToOutput[hidIdx] > 0 ? 'var(--neon-cyan)' : 'var(--neon-purple)'
            });
        }, 400);
    }

    render() {
        if (this.isTraining) {
            this.trainStep();
        }

        this.ctx.clearRect(0, 0, this.width, this.height);

        this.drawDecisionBoundary();
        this.drawSynapticLinks();
        this.drawWeightPulses();
        this.drawNeurons();
        this.drawLossGraph();

        requestAnimationFrame(() => this.render());
    }

    drawDecisionBoundary() {
        // Draw elegant glowing mock classification boundaries on background grid
        const gridRes = 8;
        const epochFactor = Math.min(1, this.epoch / 250);
        
        for (let x = 0; x < this.width; x += gridRes) {
            for (let y = 0; y < this.height; y += gridRes) {
                // Normalize screen coordinates
                const nx = (x - this.width / 2) / (this.width / 2);
                const ny = (y - this.height / 2) / (this.height / 2);
                
                let val = 0;
                if (this.datasetType === 'linear') {
                    val = nx - ny * 0.5;
                } else if (this.datasetType === 'sine') {
                    val = ny - Math.sin(nx * 3) * 0.5;
                } else if (this.datasetType === 'circle') {
                    val = (nx * nx + ny * ny) - 0.45;
                }

                // Add decision boundary shifting as training converges
                const boundaryStrength = Math.abs(val);
                if (boundaryStrength < 0.18 * (1.1 - epochFactor * 0.9)) {
                    const alpha = 0.045 * (1 - boundaryStrength / 0.18);
                    this.ctx.fillStyle = val > 0 ? `rgba(0, 242, 254, ${alpha})` : `rgba(184, 39, 252, ${alpha})`;
                    this.ctx.fillRect(x, y, gridRes, gridRes);
                }
            }
        }
    }

    drawSynapticLinks() {
        // Inputs to Hidden Connections
        for (let i = 0; i < 2; i++) {
            const start = this.nodes.input[i];
            for (let j = 0; j < this.hiddenCount; j++) {
                const end = this.nodes.hidden[j];
                const weight = this.weights.inputToHidden[i][j];
                
                this.ctx.beginPath();
                this.ctx.moveTo(start.x, start.y);
                this.ctx.lineTo(end.x, end.y);
                
                // Color represents weight sign, width represents amplitude
                this.ctx.strokeStyle = weight > 0 ? `rgba(0, 242, 254, ${0.12 + Math.abs(weight) * 0.1})` : `rgba(184, 39, 252, ${0.12 + Math.abs(weight) * 0.1})`;
                this.ctx.lineWidth = 0.5 + Math.abs(weight) * 2;
                this.ctx.stroke();
            }
        }

        // Hidden to Output Connections
        for (let i = 0; i < this.hiddenCount; i++) {
            const start = this.nodes.hidden[i];
            const end = this.nodes.output[0];
            const weight = this.weights.hiddenToOutput[i];
            
            this.ctx.beginPath();
            this.ctx.moveTo(start.x, start.y);
            this.ctx.lineTo(end.x, end.y);
            
            this.ctx.strokeStyle = weight > 0 ? `rgba(0, 242, 254, ${0.12 + Math.abs(weight) * 0.1})` : `rgba(184, 39, 252, ${0.12 + Math.abs(weight) * 0.1})`;
            this.ctx.lineWidth = 0.5 + Math.abs(weight) * 2;
            this.ctx.stroke();
        }
    }

    drawWeightPulses() {
        for (let i = this.weightPulses.length - 1; i >= 0; i--) {
            const p = this.weightPulses[i];
            p.progress += p.speed;

            if (p.progress >= 1) {
                this.weightPulses.splice(i, 1);
                continue;
            }

            const x = p.startNode.x + (p.endNode.x - p.startNode.x) * p.progress;
            const y = p.startNode.y + (p.endNode.y - p.startNode.y) * p.progress;

            this.ctx.beginPath();
            this.ctx.arc(x, y, 3, 0, Math.PI * 2);
            this.ctx.fillStyle = p.color;
            this.ctx.shadowBlur = 10;
            this.ctx.shadowColor = p.color;
            this.ctx.fill();
        }
        this.ctx.shadowBlur = 0; // Reset shadow glow
    }

    drawNeurons() {
        const drawLayer = (layerNodes, color, size, label) => {
            layerNodes.forEach((node, idx) => {
                // Neuron Glowing Outer Halo
                this.ctx.beginPath();
                this.ctx.arc(node.x, node.y, size + 4, 0, Math.PI * 2);
                this.ctx.fillStyle = 'rgba(10, 15, 30, 0.9)';
                this.ctx.strokeStyle = color;
                this.ctx.lineWidth = 1.5;
                this.ctx.stroke();
                this.ctx.fill();

                // Core Node Fill
                this.ctx.beginPath();
                this.ctx.arc(node.x, node.y, size - 2, 0, Math.PI * 2);
                
                // Pulsing nodes
                const pulse = Math.sin(Date.now() * 0.005 + idx) * 0.15 + 0.85;
                this.ctx.fillStyle = color.replace('1)', `${pulse})`);
                this.ctx.fill();

                // Text indicators
                this.ctx.fillStyle = '#64748b';
                this.ctx.font = '8px Share Tech Mono';
                this.ctx.textAlign = 'center';
                this.ctx.fillText(`${label}${idx}`, node.x, node.y - size - 8);
            });
        };

        drawLayer(this.nodes.input, 'rgba(0, 242, 254, 1)', 12, 'X');
        drawLayer(this.nodes.hidden, 'rgba(184, 39, 252, 1)', 10, 'H');
        drawLayer(this.nodes.output, 'rgba(255, 0, 127, 1)', 14, 'OUT');
    }

    drawLossGraph() {
        this.lossCtx.clearRect(0, 0, this.lossWidth, this.lossHeight);

        // Draw graph backing grid
        this.lossCtx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
        this.lossCtx.lineWidth = 0.5;
        for (let x = 0; x < this.lossWidth; x += 15) {
            this.lossCtx.beginPath();
            this.lossCtx.moveTo(x, 0);
            this.lossCtx.lineTo(x, this.lossHeight);
            this.lossCtx.stroke();
        }
        for (let y = 0; y < this.lossHeight; y += 12) {
            this.lossCtx.beginPath();
            this.lossCtx.moveTo(0, y);
            this.lossCtx.lineTo(this.lossWidth, y);
            this.lossCtx.stroke();
        }

        // Map loss curve
        const validLosses = this.lossHistory.filter(l => l !== null);
        if (validLosses.length < 2) return;

        this.lossCtx.beginPath();
        
        // Calculate dynamic height scaling
        const maxVal = 0.7;
        const minVal = 0.0;
        const getX = (idx) => (idx / (this.lossHistory.length - 1)) * this.lossWidth;
        const getY = (val) => {
            const ratio = (val - minVal) / (maxVal - minVal);
            return this.lossHeight - ratio * (this.lossHeight - 8) - 4;
        };

        let activePoints = 0;
        this.lossHistory.forEach((val, idx) => {
            if (val === null) return;
            const x = getX(idx);
            const y = getY(val);
            
            if (activePoints === 0) {
                this.lossCtx.moveTo(x, y);
            } else {
                this.lossCtx.lineTo(x, y);
            }
            activePoints++;
        });

        this.lossCtx.strokeStyle = 'var(--neon-cyan)';
        this.lossCtx.lineWidth = 1.5;
        this.lossCtx.stroke();

        // Area gradient fill
        this.lossCtx.lineTo(getX(this.lossHistory.length - 1), this.lossHeight);
        this.lossCtx.lineTo(getX(this.lossHistory.length - validLosses.length), this.lossHeight);
        this.lossCtx.closePath();
        
        const grad = this.lossCtx.createLinearGradient(0, 0, 0, this.lossHeight);
        grad.addColorStop(0, 'rgba(0, 242, 254, 0.15)');
        grad.addColorStop(1, 'rgba(0, 242, 254, 0)');
        this.lossCtx.fillStyle = grad;
        this.lossCtx.fill();
    }
}


// ==========================================================================
// 2. GENETIC EVOLUTION ECOSYSTEM SIMULATOR
// ==========================================================================

class GeneticSandbox {
    constructor() {
        this.canvas = document.getElementById('evolution-canvas');
        if (!this.canvas) return;

        this.ctx = this.canvas.getContext('2d');

        // State variables
        this.specimens = [];
        this.food = [];
        this.particles = []; // Splitting/Death particles
        this.mutationRate = 0.15; // default 15%
        this.simSpeed = 1;
        this.generation = 0;
        this.maxPopulation = 25;
        this.foodLimit = 40;

        this.init();
    }

    init() {
        this.resize();
        this.spawnEcosystem();
        this.setupEventListeners();
        this.render();
    }

    resize() {
        this.width = this.canvas.parentElement.clientWidth;
        this.height = this.canvas.parentElement.clientHeight;
        this.canvas.width = this.width;
        this.canvas.height = this.height;
    }

    spawnEcosystem() {
        this.specimens = [];
        this.food = [];
        this.particles = [];
        this.generation = 1;
        
        // Spawn original ancestors
        for (let i = 0; i < 12; i++) {
            this.specimens.push(this.createSpecimen());
        }

        // Spawn food
        for (let i = 0; i < 20; i++) {
            this.spawnFood();
        }
    }

    createSpecimen(parent = null) {
        // Base ancestor genes
        let speed = 1.2 + Math.random() * 0.8;
        let sight = 60 + Math.random() * 40;
        let size = 5 + Math.random() * 2;
        let generation = 1;

        if (parent) {
            // Apply mutations inherited from ancestor
            generation = parent.generation + 1;
            this.generation = Math.max(this.generation, generation);
            
            const mutateRange = this.mutationRate;
            const getMutatedGene = (gene) => {
                const shift = 1 + (Math.random() - 0.5) * mutateRange * 2;
                return Math.max(0.5, gene * shift);
            };

            speed = getMutatedGene(parent.genes.speed);
            sight = getMutatedGene(parent.genes.sight);
            size = Math.min(10, Math.max(3, getMutatedGene(parent.genes.size)));
        }

        // Color mapped based on dominant traits
        let color = 'rgba(0, 242, 254, '; // Cyan Default (speedy)
        if (sight > speed * 45) {
            color = 'rgba(184, 39, 252, '; // Purple (wise searchers)
        } else if (size > 6.5) {
            color = 'rgba(255, 0, 127, '; // Pink (bulk efficiency)
        }

        return {
            x: parent ? parent.x : Math.random() * this.width,
            y: parent ? parent.y : Math.random() * this.height,
            vx: (Math.random() - 0.5) * speed,
            vy: (Math.random() - 0.5) * speed,
            health: 120, // default energy ticks
            generation: generation,
            genes: { speed, sight, size },
            color: color,
            targetFood: null,
            pulsePhase: Math.random() * Math.PI
        };
    }

    spawnFood() {
        this.food.push({
            x: Math.random() * (this.width - 20) + 10,
            y: Math.random() * (this.height - 20) + 10,
            radius: 2
        });
    }

    spawnParticles(x, y, color, count = 12) {
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const velocity = 0.5 + Math.random() * 1.5;
            this.particles.push({
                x, y,
                vx: Math.cos(angle) * velocity,
                vy: Math.sin(angle) * velocity,
                alpha: 1,
                decay: 0.02 + Math.random() * 0.03,
                color: color
            });
        }
    }

    setupEventListeners() {
        // Mutation slider
        const slider = document.getElementById('gen-mutation-slider');
        const sliderVal = document.getElementById('gen-mutation-val');
        slider.addEventListener('input', (e) => {
            this.mutationRate = e.target.value / 100;
            sliderVal.textContent = `${e.target.value}%`;
        });

        // Spawn Species button
        document.getElementById('gen-spawn-btn').addEventListener('click', () => {
            for (let i = 0; i < 5; i++) {
                this.specimens.push(this.createSpecimen());
            }
            this.triggerSynthClick();
        });

        // Wipe Sandbox (Force Extinction)
        document.getElementById('gen-wipe-btn').addEventListener('click', () => {
            this.specimens.forEach(s => {
                this.spawnParticles(s.x, s.y, s.color, 18);
            });
            this.specimens = [];
            this.triggerSynthWipe();
        });

        // Speed Step controls
        const speedVal = document.getElementById('gen-speed-val');
        document.getElementById('gen-speed-dec').addEventListener('click', () => {
            if (this.simSpeed > 1) {
                this.simSpeed = this.simSpeed === 4 ? 2 : 1;
                speedVal.textContent = `${this.simSpeed}x`;
                this.triggerSynthClick();
            }
        });

        document.getElementById('gen-speed-inc').addEventListener('click', () => {
            if (this.simSpeed < 4) {
                this.simSpeed = this.simSpeed === 1 ? 2 : 4;
                speedVal.textContent = `${this.simSpeed}x`;
                this.triggerSynthClick();
            }
        });

        window.addEventListener('resize', () => this.resize());
    }

    triggerSynthClick() {
        if (window.appEngine && window.appEngine.audioSynth) {
            window.appEngine.audioSynth.playClick();
        }
    }

    triggerSynthWipe() {
        if (window.appEngine && window.appEngine.audioSynth) {
            window.appEngine.audioSynth.playWipe();
        }
    }

    triggerSynthBeep() {
        if (window.appEngine && window.appEngine.audioSynth) {
            window.appEngine.audioSynth.playGeneticBeep();
        }
    }

    updateEcosystem() {
        // Apply Sim Speed loops
        for (let loop = 0; loop < this.simSpeed; loop++) {
            
            // Food auto spawn
            if (this.food.length < this.foodLimit && Math.random() < 0.08) {
                this.spawnFood();
            }

            // Update specimens physics
            for (let i = this.specimens.length - 1; i >= 0; i--) {
                const s = this.specimens[i];
                
                // Deduct health ticks based on metabolic size and speed
                s.health -= (0.085 + (s.genes.speed * s.genes.speed * 0.02) + (s.genes.size * 0.005));

                if (s.health <= 0) {
                    // Death - Dissolve into fading cells
                    this.spawnParticles(s.x, s.y, s.color, 8);
                    this.specimens.splice(i, 1);
                    continue;
                }

                // Seek closest food within perception sight
                let target = null;
                let closestDist = s.genes.sight;
                
                for (let k = 0; k < this.food.length; k++) {
                    const f = this.food[k];
                    const dist = Math.hypot(f.x - s.x, f.y - s.y);
                    if (dist < closestDist) {
                        closestDist = dist;
                        target = f;
                    }
                }

                if (target) {
                    // Pull heading vector to food coordinate
                    const dx = target.x - s.x;
                    const dy = target.y - s.y;
                    s.vx += (dx / closestDist) * 0.15;
                    s.vy += (dy / closestDist) * 0.15;
                } else {
                    // Wander randomly
                    s.vx += (Math.random() - 0.5) * 0.15;
                    s.vy += (Math.random() - 0.5) * 0.15;
                }

                // Speed limitations
                const currentSpeed = Math.hypot(s.vx, s.vy);
                if (currentSpeed > s.genes.speed) {
                    s.vx = (s.vx / currentSpeed) * s.genes.speed;
                    s.vy = (s.vy / currentSpeed) * s.genes.speed;
                }

                s.x += s.vx;
                s.y += s.vy;

                // Bounce off sandbox boundary walls
                const margin = 10;
                if (s.x < margin) { s.x = margin; s.vx *= -1; }
                else if (s.x > this.width - margin) { s.x = this.width - margin; s.vx *= -1; }
                
                if (s.y < margin) { s.y = margin; s.vy *= -1; }
                else if (s.y > this.height - margin) { s.y = this.height - margin; s.vy *= -1; }

                // Check food collision eating
                for (let k = this.food.length - 1; k >= 0; k--) {
                    const f = this.food[k];
                    const dist = Math.hypot(f.x - s.x, f.y - s.y);
                    
                    if (dist < s.genes.size + f.radius) {
                        s.health += 55; // absorb energy
                        this.food.splice(k, 1);
                        
                        // play short synthesized genetic feed hum
                        if (Math.random() < 0.18) {
                            this.triggerSynthBeep();
                        }
                    }
                }

                // Mitosis Reproduction splitting when health/energy is high
                if (s.health > 200 && this.specimens.length < this.maxPopulation) {
                    s.health = 100; // split energy
                    const child = this.createSpecimen(s);
                    this.specimens.push(child);
                    
                    // Create birth splash particles
                    this.spawnParticles(s.x, s.y, 'rgba(255, 255, 255, ', 15);
                }
            }

            // Update physical visual fade particles
            for (let i = this.particles.length - 1; i >= 0; i--) {
                const p = this.particles[i];
                p.x += p.vx;
                p.y += p.vy;
                p.alpha -= p.decay;
                
                if (p.alpha <= 0) {
                    this.particles.splice(i, 1);
                }
            }
        }

        // Inject species automatically if population dies out completely
        if (this.specimens.length === 0 && Math.random() < 0.02) {
            for (let i = 0; i < 6; i++) {
                this.specimens.push(this.createSpecimen());
            }
        }
    }

    updateDiagnosticHUD() {
        if (Math.random() > 0.15) return; // limit DOM write updates

        document.getElementById('gen-pop-val').textContent = this.specimens.length;
        document.getElementById('gen-max-val').textContent = this.generation;

        if (this.specimens.length === 0) return;

        let totalSpeed = 0;
        let totalSight = 0;
        let countSpeedy = 0;
        let countWise = 0;
        let countBulky = 0;

        this.specimens.forEach(s => {
            totalSpeed += s.genes.speed;
            totalSight += s.genes.sight;
            
            // Increment trait count
            if (s.color.includes('0, 242, 254')) countSpeedy++;
            else if (s.color.includes('184, 39, 252')) countWise++;
            else countBulky++;
        });

        const avgSpeed = totalSpeed / this.specimens.length;
        const avgSight = totalSight / this.specimens.length;

        document.getElementById('gen-stat-speed').textContent = `${avgSpeed.toFixed(1)}px`;
        document.getElementById('gen-stat-sight').textContent = `${avgSight.toFixed(0)}px`;

        let dominant = 'Agility';
        if (countWise > countSpeedy && countWise > countBulky) dominant = 'Perception';
        else if (countBulky > countSpeedy && countBulky > countWise) dominant = 'Efficiency';

        document.getElementById('gen-stat-trait').textContent = dominant;
        
        // Match color indicator corresponding to dominant traits
        const dominantEl = document.getElementById('gen-stat-trait');
        dominantEl.className = 'val';
        if (dominant === 'Agility') dominantEl.classList.add('text-cyan');
        else if (dominant === 'Perception') dominantEl.classList.add('text-purple');
        else dominantEl.classList.add('text-pink');
    }

    render() {
        this.updateEcosystem();
        this.updateDiagnosticHUD();

        this.ctx.clearRect(0, 0, this.width, this.height);

        // Draw food particles
        this.ctx.fillStyle = 'var(--neon-green)';
        this.ctx.shadowBlur = 6;
        this.ctx.shadowColor = 'var(--neon-green)';
        this.food.forEach(f => {
            this.ctx.beginPath();
            this.ctx.arc(f.x, f.y, f.radius, 0, Math.PI * 2);
            this.ctx.fill();
        });

        // Draw active fade explosion particles
        this.ctx.shadowBlur = 0; // reset
        this.particles.forEach(p => {
            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, 1.5, 0, Math.PI * 2);
            this.ctx.fillStyle = p.color.replace(', ', `, ${p.alpha})`);
            this.ctx.fill();
        });

        // Draw specimens
        this.specimens.forEach(s => {
            s.pulsePhase += 0.05;
            
            // Outer perception radar sweep rings
            this.ctx.beginPath();
            this.ctx.arc(s.x, s.y, s.genes.sight, 0, Math.PI * 2);
            this.ctx.strokeStyle = s.color.replace(', ', ', 0.02)');
            this.ctx.lineWidth = 0.5;
            this.ctx.stroke();

            // Inner cell body glow
            this.ctx.beginPath();
            this.ctx.arc(s.x, s.y, s.genes.size, 0, Math.PI * 2);
            
            this.ctx.fillStyle = s.color.replace(', ', ', 0.8)');
            this.ctx.shadowBlur = 8 + Math.sin(s.pulsePhase) * 3;
            this.ctx.shadowColor = s.color.replace(', ', ', 0.6)');
            this.ctx.fill();

            // Directional heading antenna vector line
            this.ctx.beginPath();
            const headingAngle = Math.atan2(s.vy, s.vx);
            const antennaX = s.x + Math.cos(headingAngle) * (s.genes.size + 4);
            const antennaY = s.y + Math.sin(headingAngle) * (s.genes.size + 4);
            this.ctx.moveTo(s.x, s.y);
            this.ctx.lineTo(antennaX, antennaY);
            this.ctx.strokeStyle = '#ffffff';
            this.ctx.lineWidth = 1;
            this.ctx.stroke();
        });
        
        this.ctx.shadowBlur = 0; // final reset

        requestAnimationFrame(() => this.render());
    }
}

// Instantiate simulators on load
window.addEventListener('DOMContentLoaded', () => {
    window.neuralNetSim = new NeuralNetworkSimulator();
    window.geneticSim = new GeneticSandbox();
});
