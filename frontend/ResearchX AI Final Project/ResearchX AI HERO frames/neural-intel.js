document.addEventListener('DOMContentLoaded', () => {

    /* ── DOM Elements ── */
    const bootScreen = document.getElementById('intel-boot-screen');
    const intelEnv = document.getElementById('intel-env');
    const queryText = document.getElementById('active-query-text');
    const staggers = document.querySelectorAll('.stagger-in');
    
    // Module containers
    const insightsBody = document.getElementById('insights-body');
    const metricBars = document.getElementById('metric-bars');
    const probFill = document.getElementById('prob-fill');
    const probVal = document.getElementById('prob-val');
    const patternList = document.getElementById('pattern-list');
    const bgCanvas = document.getElementById('bg-network-canvas');
    const modCanvas = document.getElementById('module-network-canvas');

    /* ── State & Query Params ── */
    let currentQuery = "Analyzing general domain heuristics...";
    const urlParams = new URLSearchParams(window.location.search);
    const q = urlParams.get('q');
    if (q) {
        currentQuery = decodeURIComponent(q);
        // Replace URL state so it doesn't look messy
        window.history.replaceState({}, document.title, window.location.pathname);
    }
    queryText.textContent = `"${currentQuery}"`;

    /* ── Boot Sequence ── */
    // Keep boot screen for a second, then reveal UI
    setTimeout(() => {
        bootScreen.style.opacity = '0';
        setTimeout(() => {
            bootScreen.style.display = 'none';
            intelEnv.classList.remove('hidden');
            
            // Trigger stagger animations
            staggers.forEach((el, i) => {
                setTimeout(() => el.classList.add('visible'), i * 150);
            });

            // Start Data Simulations
            startSimulations();

        }, 1200);
    }, 1500);

    /* ── Background Global Network Simulation ── */
    function initNetwork(canvasObj, isModule = false) {
        if (!canvasObj) return;
        const ctx = canvasObj.getContext('2d');
        let w, h;
        const nodes = [];
        const count = isModule ? 30 : 60;
        
        function resizeLayout() {
            w = canvasObj.width = isModule ? canvasObj.parentElement.offsetWidth : window.innerWidth;
            h = canvasObj.height = isModule ? canvasObj.parentElement.offsetHeight : window.innerHeight;
        }
        window.addEventListener('resize', resizeLayout);
        resizeLayout();

        for (let i = 0; i < count; i++) {
            nodes.push({
                x: Math.random() * w, y: Math.random() * h,
                vx: (Math.random() - 0.5) * (isModule ? 0.3 : 0.8),
                vy: (Math.random() - 0.5) * (isModule ? 0.3 : 0.8),
                color: Math.random() > 0.5 ? '#00F3FF' : (isModule ? '#9D00FF' : 'rgba(255,255,255,0.3)')
            });
        }

        function draw() {
            ctx.clearRect(0, 0, w, h);
            const connectDist = isModule ? 100 : 200;
            
            for (let i = 0; i < nodes.length; i++) {
                let n = nodes[i];
                n.x += n.vx; n.y += n.vy;
                if (n.x < 0 || n.x > w) n.vx *= -1;
                if (n.y < 0 || n.y > h) n.vy *= -1;
                
                ctx.beginPath();
                ctx.arc(n.x, n.y, isModule ? 2 : 1.5, 0, Math.PI*2);
                ctx.fillStyle = n.color;
                ctx.fill();

                for (let j = i+1; j < nodes.length; j++) {
                    const n2 = nodes[j];
                    const dist = Math.hypot(n.x - n2.x, n.y - n2.y);
                    if (dist < connectDist) {
                        ctx.beginPath();
                        ctx.moveTo(n.x, n.y);
                        ctx.lineTo(n2.x, n2.y);
                        ctx.strokeStyle = `rgba(0, 243, 255, ${(1 - dist/connectDist) * (isModule ? 0.5 : 0.2)})`;
                        ctx.stroke();
                    }
                }
            }
            requestAnimationFrame(draw);
        }
        draw();
    }

    /* ── Simulations ── */
    function startSimulations() {
        initNetwork(bgCanvas, false);
        initNetwork(modCanvas, true);
        
        simInsights();
        simDataViz();
        simPredictions();
        simPatterns();
    }

    // 1. Insights Panel
    function simInsights() {
        const insights = [
            `Cross-referenced <span class="highlight">4,209</span> neural nodes aligning with user parameters. High contextual overlap detected.`,
            `Key semantic finding: Vector expansion suggests <span class="highlight">secondary causality</span> not previously considered by standard heuristics.`,
            `Data density at core node achieved <span class="highlight">99.8%</span> clarity limit.`
        ];
        
        setTimeout(() => {
            insightsBody.innerHTML = '';
            insights.forEach((text, i) => {
                setTimeout(() => {
                    const div = document.createElement('div');
                    div.className = 'insight-block';
                    div.innerHTML = text;
                    insightsBody.appendChild(div);
                    
                    // trigger visible trick to ensure css anim runs
                    requestAnimationFrame(() => div.classList.add('visible'));
                    insightsBody.scrollTop = insightsBody.scrollHeight;
                }, i * 800);
            });
        }, 1200);
    }

    // 2. Data Viz
    function simDataViz() {
        metricBars.innerHTML = '';
        const numBars = 18;
        for (let i = 0; i < numBars; i++) {
            const bar = document.createElement('div');
            bar.className = 'data-bar';
            metricBars.appendChild(bar);
        }
        
        // Randomize heights
        setTimeout(() => {
            const bars = document.querySelectorAll('.data-bar');
            bars.forEach(bar => {
                const targetH = Math.random() * 85 + 15; // 15% to 100%
                bar.style.height = `${targetH}%`;
            });
            
            // Constantly wiggle them slightly to look alive
            setInterval(() => {
                bars.forEach(bar => {
                    const currentH = parseFloat(bar.style.height);
                    let newH = currentH + (Math.random() * 10 - 5);
                    if (newH > 100) newH = 100;
                    if (newH < 5) newH = 5;
                    bar.style.height = `${newH}%`;
                });
            }, 2000);
        }, 800);
    }

    // 3. Predictions
    function simPredictions() {
        let prob = 0;
        const targetProb = Math.floor(Math.random() * 15) + 84; // 84 to 98
        
        const offsetMax = 251.2; // roughly 2*pi*r for r=40
        probFill.style.strokeDashoffset = offsetMax;
        
        setTimeout(() => {
            const duration = 2000;
            const startTime = performance.now();
            
            function step(time) {
                const elapsed = time - startTime;
                const progress = Math.min(elapsed / duration, 1);
                // ease out quad
                const ease = progress * (2 - progress);
                prob = Math.floor(ease * targetProb);
                probVal.textContent = prob + '%';
                
                const currentOffset = offsetMax - (offsetMax * (prob / 100));
                probFill.style.strokeDashoffset = currentOffset;
                
                if (progress < 1) requestAnimationFrame(step);
                else {
                    document.getElementById('pred-text').innerHTML = `Calculated highest probability path. <span style="color:var(--neon-cyan)">Optimal output locked.</span>`;
                }
            }
            requestAnimationFrame(step);
        }, 1500);
    }

    // 4. Patterns
    function simPatterns() {
        const anomalies = [
            "Recursive Loop Variant #104",
            "Data Cluster Dispersion",
            "Latent Memory Echo Found"
        ];
        
        patternList.innerHTML = '';
        setTimeout(() => {
            anomalies.forEach((pattern, i) => {
                setTimeout(() => {
                    const div = document.createElement('div');
                    div.className = 'pattern-item';
                    div.innerHTML = `<span class="p-badge">ERR_${10+i}</span> ${pattern}`;
                    patternList.appendChild(div);
                    requestAnimationFrame(() => div.classList.add('visible'));
                }, i * 1100);
            });
        }, 2200);
    }

    /* ── Interactions ── */
    document.querySelectorAll('.ai-action-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            // Just simulate a generic reload/re-processing
            const action = e.target.getAttribute('data-action');
            queryText.textContent = `Executing: ${action.toUpperCase()}...`;
            document.querySelector('.core-rings').style.animationDuration = '0.5s';
            
            setTimeout(() => {
                window.location.reload(); 
            }, 1000);
        });
    });

    const refineInput = document.getElementById('refine-input');
    refineInput.addEventListener('keypress', (e) => {
        if(e.key === 'Enter' && refineInput.value.trim()){
            window.location.href = `neural-intel.html?q=${encodeURIComponent(refineInput.value.trim())}`;
        }
    });
});
