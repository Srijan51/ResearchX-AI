document.addEventListener('DOMContentLoaded', () => {

    // Global State for Backend Integration
    window.API_BASE_URL = "http://localhost:8000";
    window.currentTaskId = null;
    window.MOCK_MODE = true; // Set to true for frontend-only demonstration

    // Search Box Implementation
    const searchInput = document.querySelector('.search-input');
    const startResearchBtn = document.querySelector('.start-research-btn');

    // Update search box glow position
    const searchBox = document.querySelector('.search-box');
    if (searchBox) {
        searchBox.addEventListener('mousemove', (e) => {
            const rect = searchBox.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            searchBox.style.setProperty('--x', `${x}px`);
            searchBox.style.setProperty('--y', `${y}px`);
        });
    }

    const handleResearchInitialization = async (btn, input) => {
        const query = input.value.trim();
        if (!query) return;

        const originalText = btn.innerHTML;
        btn.innerHTML = '<span>Initializing...</span>';
        btn.style.opacity = '0.7';

        if (window.MOCK_MODE) {
            setTimeout(() => {
                window.currentTaskId = "MOCK-" + Math.random().toString(36).substr(2, 9).toUpperCase();
                btn.innerHTML = originalText;
                btn.style.opacity = '1';
                const processSect = document.querySelector('#process');
                if (processSect) processSect.scrollIntoView({ behavior: 'smooth' });
                startMockResearch();
            }, 1500);
            return;
        }

        try {
            const res = await fetch(`${window.API_BASE_URL}/api/hero/start-research`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ query: query })
            });
            
            if (res.ok) {
                const data = await res.json();
                if (data.success && data.data && data.data.task_id) {
                    window.currentTaskId = data.data.task_id;
                    const processSect = document.querySelector('#process');
                    if (processSect) processSect.scrollIntoView({ behavior: 'smooth' });
                }
            }
        } catch (err) {
            console.error("Initiation failed:", err);
        } finally {
            btn.innerHTML = originalText;
            btn.style.opacity = '1';
        }
    };

    if (startResearchBtn && searchInput) {
        startResearchBtn.addEventListener('click', () => handleResearchInitialization(startResearchBtn, searchInput));
    }
    // Smooth scrolling for navigation links
    const navLinks = document.querySelectorAll('.nav-links a');
    
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            if(targetId === '#') return;
            
            const targetSection = document.querySelector(targetId);
            if (targetSection) {
                targetSection.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });

    // Intersection Observer for active nav items
    const sections = document.querySelectorAll('main section');
    const navItems = document.querySelectorAll('.nav-item');

    const observerOptions = {
        root: null,
        rootMargin: '-50% 0px -50% 0px', // Precise center-line detection
        threshold: 0
    };

    const navLinksContainer = document.querySelector('.nav-links');
    const navIndicator = document.querySelector('.nav-indicator');

    const moveNavIndicator = (activeItem) => {
        if (!activeItem || !navIndicator) return;
        
        const width = activeItem.offsetWidth;
        const left = activeItem.offsetLeft;
        
        navIndicator.style.width = `${width}px`;
        navIndicator.style.transform = `translateX(${left}px)`;
        navIndicator.classList.add('active');
    };

    const observerCallback = (entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const id = entry.target.getAttribute('id');
                
                navItems.forEach(item => {
                    item.classList.remove('active');
                    if (item.getAttribute('href') === `#${id}`) {
                        item.classList.add('active');
                        moveNavIndicator(item);
                    }
                });
            }
        });
    };

    // Initialize indicator position
    const activeItem = document.querySelector('.nav-item.active');
    if (activeItem) {
        // Delay slightly to ensure fonts and layout are ready
        setTimeout(() => moveNavIndicator(activeItem), 500);
    }

    // Update on resize
    window.addEventListener('resize', () => {
        const currentActive = document.querySelector('.nav-item.active');
        if (currentActive) moveNavIndicator(currentActive);
    });

    const observer = new IntersectionObserver(observerCallback, observerOptions);

    // Observer for cinematic fade-in/out animations
    const revealOptions = {
        root: null,
        rootMargin: '-5% 0px', /* Slight margin to trigger fade earlier */
        threshold: 0.05 /* Start transition as soon as 5% comes in */
    };
    
    const revealCallback = (entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('in-view');
            } else {
                entry.target.classList.remove('in-view');
            }
        });
    };
    
    const revealObserver = new IntersectionObserver(revealCallback, revealOptions);

    sections.forEach(section => {
        if (section.id && section.id !== '') {
            observer.observe(section);
            revealObserver.observe(section);
        }
    });

    // Safety fallback: if anything is still hidden after 2s, force show
    setTimeout(() => {
        sections.forEach(section => {
            if (!section.classList.contains('in-view')) {
                section.classList.add('in-view');
            }
        });
    }, 2000);

    // Navbar scroll effect
    const navbar = document.querySelector('.navbar');
    window.addEventListener('scroll', () => {
        if (navbar && window.scrollY > 20) {
            navbar.classList.add('scrolled');
        } else if (navbar) {
            navbar.classList.remove('scrolled');
        }
    });

    // Parallax effect for floating elements & Pipeline 3D depth
    const heroFloatingItems = document.querySelectorAll('.floating-item');
    const pipelineStage = document.querySelector('.pipeline-stage');
    const aiModules = document.querySelectorAll('.ai-module');

    window.addEventListener('mousemove', (e) => {
        const x = e.clientX / window.innerWidth;
        const y = e.clientY / window.innerHeight;

        // Origin hero parallax
        heroFloatingItems.forEach(item => {
            const speed = item.getAttribute('data-parallax') || 0.1;
            const xOffset = (x - 0.5) * speed * 100;
            const yOffset = (y - 0.5) * speed * 100;
            item.style.transform = `translate(${xOffset}px, ${yOffset}px)`;
        });

        // Pipeline cinematic parallax
        if (pipelineStage) {
            // Subtle rotation of the entire stage
            const rotateY = (x - 0.5) * 8; // Max 4deg
            const rotateX = (0.5 - y) * 8 + 4; // Center offset to keep tilt
            pipelineStage.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
        }

        aiModules.forEach((module, index) => {
            // Depth layers move in different speeds
            const depthFactor = module.classList.contains('depth-bg') ? 0.3 : 
                                module.classList.contains('depth-mid') ? 0.6 : 1.2;
            const modXOffset = (x - 0.5) * depthFactor * 40;
            const modYOffset = (y - 0.5) * depthFactor * 20;

            // Retrieve or reset scale from class
            const scale = module.classList.contains('depth-bg') ? 0.84 : 
                          module.classList.contains('depth-mid') ? 0.92 : 1;

            module.style.transform = `translate(${modXOffset}px, ${modYOffset}px) scale(${scale})`;
        });
    });
    
    // Add subtle hover animations to strategy nodes
    const nodes = document.querySelectorAll('.node.sub');
    const coreNode = document.querySelector('.core');
    
    if (coreNode) {
        nodes.forEach(node => {
            node.addEventListener('mouseenter', () => {
                coreNode.style.boxShadow = '0 0 80px rgba(0, 243, 255, 0.7), inset 0 0 30px rgba(0, 243, 255, 0.5)';
                coreNode.style.borderColor = 'var(--neon-cyan)';
            });
            node.addEventListener('mouseleave', () => {
                coreNode.style.boxShadow = '';
                coreNode.style.borderColor = '';
            });
        });
    }

    // Particles animation
    const canvas = document.getElementById('particles-canvas');
    if (canvas) {
        const ctx = canvas.getContext('2d');
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        let particles = [];

    class Particle {
        constructor() {
            this.x = Math.random() * canvas.width;
            this.y = Math.random() * canvas.height;
            this.size = Math.random() * 2 + 1;
            this.speedX = Math.random() * 0.5 - 0.25;
            this.speedY = Math.random() * 0.5 - 0.25;
            this.opacity = Math.random() * 0.5 + 0.1;
        }

        update() {
            this.x += this.speedX;
            this.y += this.speedY;
            if (this.x > canvas.width) this.x = 0;
            if (this.x < 0) this.x = canvas.width;
            if (this.y > canvas.height) this.y = 0;
            if (this.y < 0) this.y = canvas.height;
        }

        draw() {
            ctx.globalAlpha = this.opacity;
            ctx.fillStyle = Math.random() > 0.5 ? 'rgba(0, 243, 255, 0.8)' : 'rgba(157, 0, 255, 0.8)';
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    function initParticles() {
        particles = [];
        for (let i = 0; i < 50; i++) {
            particles.push(new Particle());
        }
    }

    function animateParticles() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        particles.forEach(p => {
            p.update();
            p.draw();
        });
        requestAnimationFrame(animateParticles);
    }

        initParticles();
        animateParticles();

        window.addEventListener('resize', () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            initParticles();
        });
    }

    // Dynamic Neural Load Updater
    function updateNeuralLoad() {
        const loadElement = document.querySelector('.status-metric');
        if (loadElement) {
            const load = Math.floor(Math.random() * 71) + 15; // Random between 15-85
            loadElement.textContent = `Neural Load: ${load}%`;
        }
    }

    // Update neural load every 3-5 seconds
    setInterval(updateNeuralLoad, Math.random() * 2000 + 3000); // 3-5 seconds

    // Initial update
    updateNeuralLoad();

    // Animate Results Dashboard Bars
    function animateBars() {
        const bars = document.querySelectorAll('.bar-fill');
        bars.forEach((bar, index) => {
            const value = bar.getAttribute('data-value');
            bar.style.setProperty('--bar-height', `${value}%`);
        });
    }

    // Update dashboard metrics dynamically
    function updateDashboardMetrics() {
        const processingStatus = document.getElementById('processing-status');
        const confidenceLevel = document.getElementById('confidence-level');
        const dataPoints = document.getElementById('data-points');

        if (processingStatus) {
            const statuses = ['Analyzing...', 'Processing...', 'Synthesizing...', 'Complete'];
            processingStatus.textContent = statuses[Math.floor(Math.random() * statuses.length)];
        }

        if (confidenceLevel) {
            const confidence = (Math.random() * 10 + 90).toFixed(1);
            confidenceLevel.textContent = `${confidence}%`;
        }

        if (dataPoints) {
            const points = Math.floor(Math.random() * 1000000) + 2000000;
            dataPoints.textContent = `${(points / 1000000).toFixed(1)}M`;
        }
    }

    // Initialize dashboard animations
    animateBars();
    updateDashboardMetrics();

    // Update metrics every 4-6 seconds
    setInterval(updateDashboardMetrics, Math.random() * 2000 + 4000);

    // Dynamic Memory Stats Updater
    function updateMemoryStats() {
        const totalMemory = document.getElementById('total-memory');
        const activeSessions = document.getElementById('active-sessions');
        const syncRate = document.getElementById('sync-rate');
        const neuralLinks = document.getElementById('neural-links');

        if (totalMemory) {
            const memory = (40 + Math.random() * 20).toFixed(1);
            totalMemory.textContent = `${memory} TB`;
        }

        if (activeSessions) {
            const sessions = Math.floor(1000 + Math.random() * 1000);
            activeSessions.textContent = sessions.toLocaleString();
        }

        if (syncRate) {
            const rate = (95 + Math.random() * 5).toFixed(1);
            syncRate.textContent = `${rate}%`;
        }

        if (neuralLinks) {
            const links = Math.floor(8000 + Math.random() * 2000);
            neuralLinks.textContent = links.toLocaleString();
        }
    }

    // Update memory stats every 5-8 seconds
    setInterval(updateMemoryStats, Math.random() * 3000 + 5000);

    // Initialize memory stats
    updateMemoryStats();

    // ===== OUTPUT GENERATOR ENHANCED FUNCTIONALITY =====

    // Dynamic Output Status Updates
    function updateOutputStatus() {
        const generationProgress = document.getElementById('generation-progress');
        const generationStatus = document.getElementById('generation-status');
        const outputQuality = document.getElementById('output-quality');
        const processingSpeed = document.getElementById('processing-speed');
        const dataSources = document.getElementById('data-sources');
        const docTimestamp = document.getElementById('doc-timestamp');

        // Update generation progress (animated ring)
        if (generationProgress) {
            const progress = Math.floor(Math.random() * 40) + 60; // 60-100%
            generationProgress.style.background = `conic-gradient(var(--neon-cyan) ${progress * 3.6}deg, transparent 0deg)`;
            generationProgress.textContent = `${progress}%`;
        }

        // Update generation status
        if (generationStatus) {
            const statuses = ['Ready', 'Analyzing', 'Processing', 'Synthesizing', 'Optimizing', 'Complete'];
            generationStatus.textContent = statuses[Math.floor(Math.random() * statuses.length)];
        }

        // Update output quality
        if (outputQuality) {
            const quality = (95 + Math.random() * 5).toFixed(1);
            outputQuality.textContent = `${quality}%`;
        }

        // Update processing speed
        if (processingSpeed) {
            const speed = (1.5 + Math.random() * 2).toFixed(1);
            processingSpeed.textContent = `${speed}s`;
        }

        // Update data sources
        if (dataSources) {
            const sources = Math.floor(1000 + Math.random() * 1000);
            dataSources.textContent = sources.toLocaleString();
        }

        // Update document timestamp
        if (docTimestamp) {
            const now = new Date();
            const timestamp = now.toISOString().replace('T', ' ').substring(0, 19);
            docTimestamp.textContent = timestamp;
        }
    }

    // Initialize output status updates
    updateOutputStatus();
    setInterval(updateOutputStatus, Math.random() * 3000 + 4000); // 4-7 seconds

    // Format Card Interactions
    const formatCards = document.querySelectorAll('.format-card');
    formatCards.forEach(card => {
        card.addEventListener('click', function() {
            const format = this.getAttribute('data-format');

            // Remove active class from all cards
            formatCards.forEach(c => c.classList.remove('active'));
            // Add active class to clicked card
            this.classList.add('active');

            // Show processing overlay
            showProcessingOverlay();

            // Simulate processing delay
            setTimeout(() => {
                hideProcessingOverlay();
                showSuccessMessage(format);
            }, 2000 + Math.random() * 2000);
        });
    });

    // Processing Overlay Functions
    function showProcessingOverlay() {
        const overlay = document.getElementById('processing-overlay');
        if (overlay) {
            overlay.classList.add('active');
        }
    }

    function hideProcessingOverlay() {
        const overlay = document.getElementById('processing-overlay');
        if (overlay) {
            overlay.classList.remove('active');
        }
    }

    // Success Message Function
    function showSuccessMessage(format) {
        // Create success notification
        const notification = document.createElement('div');
        notification.className = 'success-notification';
        notification.innerHTML = `
            <div class="success-icon">CHK</div>
            <div class="success-text">
                <div class="success-title">${format.toUpperCase()} Export Complete</div>
                <div class="success-desc">Your research intelligence has been generated successfully</div>
            </div>
        `;

        document.body.appendChild(notification);

        // Animate in
        setTimeout(() => notification.classList.add('show'), 100);

        // Remove after 3 seconds
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    // Enhanced Button Interactions
    const pdfBtn = document.getElementById('pdf-download-btn');
    const exportBtn = document.getElementById('export-schema-btn');
    const apiBtn = document.getElementById('data-api-btn');
    const shareBtn = document.getElementById('share-btn');

    if (pdfBtn) {
        pdfBtn.addEventListener('click', async function() {
            showProcessingOverlay();
            if (window.currentTaskId) {
                try {
                    const res = await fetch(`${window.API_BASE_URL}/api/output/generate`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ task_id: window.currentTaskId, format: "pdf" })
                    });
                    
                    if (res.ok) {
                        const data = await res.json();
                        showSuccessMessage('pdf');
                        if (data.data && data.data.download_url) {
                            // Real PDF download from backend
                            window.open(`${window.API_BASE_URL}${data.data.download_url}`, '_blank');
                        }
                    } else {
                        console.error("Output generation failed");
                    }
                } catch (e) {
                    console.error("Error calling output endpoint", e);
                } finally {
                    hideProcessingOverlay();
                }
            } else {
                hideProcessingOverlay();
                alert("Please initialize a research query first.");
            }
        });
    }

    if (exportBtn) {
        exportBtn.addEventListener('click', function() {
            showProcessingOverlay();
            setTimeout(() => {
                hideProcessingOverlay();
                showSuccessMessage('schema');
            }, 1800);
        });
    }

    if (apiBtn) {
        apiBtn.addEventListener('click', function() {
            // Toggle API stream
            this.classList.toggle('active');
            if (this.classList.contains('active')) {
                this.innerHTML = '<span>API Stream Active</span>';
                startAPIStream();
            } else {
                this.innerHTML = '<span>Data API Stream</span>';
                stopAPIStream();
            }
        });
    }

    if (shareBtn) {
        shareBtn.addEventListener('click', function() {
            showProcessingOverlay();
            setTimeout(() => {
                hideProcessingOverlay();
                showSuccessMessage('share');
                // Simulate share functionality
                if (navigator.share) {
                    navigator.share({
                        title: 'ResearchX AI Intelligence Report',
                        text: 'Advanced AI-generated research insights',
                        url: window.location.href
                    });
                }
            }, 1500);
        });
    }

    // API Stream Simulation
    let apiStreamInterval;
    function startAPIStream() {
        const statusElement = document.getElementById('generation-status');
        if (statusElement) {
            apiStreamInterval = setInterval(() => {
                const dataPoints = ['Streaming...', 'Processing...', 'Analyzing...', 'Synthesizing...'];
                statusElement.textContent = dataPoints[Math.floor(Math.random() * dataPoints.length)];
            }, 1000);
        }
    }

    function stopAPIStream() {
        if (apiStreamInterval) {
            clearInterval(apiStreamInterval);
            const statusElement = document.getElementById('generation-status');
            if (statusElement) {
                statusElement.textContent = 'Ready';
            }
        }
    }

    // Add CSS for success notification
    const style = document.createElement('style');
    style.textContent = `
        .success-notification {
            position: fixed;
            top: 20px;
            right: 20px;
            background: rgba(0, 0, 0, 0.9);
            border: 1px solid var(--neon-cyan);
            border-radius: 12px;
            padding: 20px;
            display: flex;
            align-items: center;
            gap: 15px;
            z-index: 1000;
            transform: translateX(100%);
            transition: transform 0.3s ease;
            backdrop-filter: blur(10px);
        }

        .success-notification.show {
            transform: translateX(0);
        }

        .success-icon {
            font-size: 1.5rem;
            color: var(--neon-cyan);
        }

        .success-title {
            font-size: 1.1rem;
            font-weight: bold;
            color: var(--text-main);
            margin-bottom: 5px;
        }

        .success-desc {
            font-size: 0.9rem;
            color: var(--text-muted);
        }

        .format-card.active {
            border-color: var(--neon-cyan);
            box-shadow: 0 0 20px rgba(0,255,255,0.4);
            background: rgba(0,255,255,0.1);
        }

        .btn-secondary.active {
            background: rgba(0,255,255,0.1);
            border-color: var(--neon-cyan);
            box-shadow: 0 0 15px rgba(0,255,255,0.4);
        }
    `;
    document.head.appendChild(style);

    // ===== ENHANCED PROCESS SECTION FUNCTIONALITY =====

    // Process Control Panel Updates


        // Process Control Panel Updates
    async function updateProcessMetrics() {
        const cpuUsage = document.getElementById('cpu-usage');
        const neuralLoad = document.getElementById('neural-load');
        const dataThroughput = document.getElementById('data-throughput');
        const processTime = document.getElementById('process-time');
        const processStatus = document.getElementById('process-status');

        if (window.MOCK_MODE) return; // Managed by startMockResearch in mock mode

        if (window.currentTaskId) {
            try {
                const res = await fetch(`${window.API_BASE_URL}/api/agent/${window.currentTaskId}/status`);
                if (res.ok) {
                    const data = await res.json();
                    if (data.success && data.data) {
                        const status = data.data.status || 'Active';
                        if (processStatus) {
                            const statusText = processStatus.querySelector('.status-text');
                            if (statusText) statusText.textContent = status;
                        }
                        // Real hardware metrics from psutil
                        if (cpuUsage) cpuUsage.textContent = `${Math.round(data.data.cpu_usage)}%`;
                        if (neuralLoad) neuralLoad.textContent = `${Math.round(data.data.ram_usage)}%`;
                        if (dataThroughput) dataThroughput.textContent = `${(data.data.cpu_usage / 25).toFixed(1)}GB/s`;
                    }
                }
            } catch (e) {
                console.error("Failed to fetch process metrics", e);
            }
        } else {
            if (processStatus) {
                const statusText = processStatus.querySelector('.status-text');
                if (statusText) statusText.textContent = "Awaiting Task...";
            }
            if (cpuUsage) cpuUsage.textContent = '0%';
            if (neuralLoad) neuralLoad.textContent = '0%';
            if (dataThroughput) dataThroughput.textContent = '0GB/s';
        }


        // Update process time (incrementing timer)
        if (processTime) {
            const currentTime = processTime.textContent.split(':');
            let hours = parseInt(currentTime[0]);
            let minutes = parseInt(currentTime[1]);
            let seconds = parseInt(currentTime[2]);

            seconds++;
            if (seconds >= 60) {
                seconds = 0;
                minutes++;
                if (minutes >= 60) {
                    minutes = 0;
                    hours++;
                }
            }

            processTime.textContent = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        }

        // Update process status
        if (processStatus) {
            const statuses = ['Active', 'Processing', 'Optimizing', 'Analyzing'];
            const statusText = processStatus.querySelector('.status-text');
            if (statusText) {
                statusText.textContent = statuses[Math.floor(Math.random() * statuses.length)];
            }
        }
    }

    // Initialize process metrics updates
    updateProcessMetrics();
    setInterval(updateProcessMetrics, Math.random() * 2000 + 3000); // 3-5 seconds

    // Step Progress Updates
    function updateStepProgress() {
        const steps = [
            { id: 'step1', progress: 100, text: 'step1-text' },
            { id: 'step2', progress: 87, text: 'step2-text' },
            { id: 'step3', progress: 64, text: 'step3-text' },
            { id: 'step4', progress: 23, text: 'step4-text' }
        ];

        steps.forEach((step, index) => {
            const progressElement = document.getElementById(`${step.id}-progress`);
            const textElement = document.getElementById(step.text);

            if (progressElement && textElement) {
                let currentProgress = parseInt(textElement.textContent) || 0;
                let targetProgress = step.progress;

                // Add some randomness to make it more dynamic
                if (index < 3) { // First 3 steps are mostly complete
                    targetProgress = Math.min(100, targetProgress + Math.floor(Math.random() * 10) - 5);
                } else { // Last step is progressing
                    targetProgress = Math.min(100, currentProgress + Math.floor(Math.random() * 8));
                }

                // Smooth animation
                const increment = targetProgress - currentProgress;
                if (Math.abs(increment) > 0) {
                    const stepIncrement = increment / 20; // 20 frames for smooth animation
                    let frame = 0;

                    const animateProgress = () => {
                        frame++;
                        const newProgress = Math.round(currentProgress + (stepIncrement * frame));

                        progressElement.style.width = `${newProgress}%`;
                        textElement.textContent = `${newProgress}%`;

                        if (frame < 20) {
                            requestAnimationFrame(animateProgress);
                        }
                    };

                    animateProgress();
                }
            }
        });
    }

    // Initialize step progress updates
    updateStepProgress();
    setInterval(updateStepProgress, Math.random() * 4000 + 6000); // 6-10 seconds

    // Step Data Stream Animations
    function updateStepStatuses() {
        const stepStatuses = ['step1-status', 'step2-status', 'step3-status', 'step4-status'];

        stepStatuses.forEach((statusId, index) => {
            const statusElement = document.getElementById(statusId);
            if (statusElement) {
                const dataStream = statusElement.querySelector('.data-stream');
                if (dataStream) {
                    // Different animation speeds and styles for different steps
                    const speeds = ['3s', '2.7s', '2.4s', '2.1s'];
                    const intensities = ['high', 'medium', 'medium', 'low'];

                    dataStream.style.animationDuration = speeds[index];
                    dataStream.setAttribute('data-intensity', intensities[index]);
                }
            }
        });
    }

    updateStepStatuses();

    // Process Visualization Controls
    const vizButtons = document.querySelectorAll('.viz-btn');
    vizButtons.forEach(button => {
        button.addEventListener('click', function() {
            // Remove active class from all buttons
            vizButtons.forEach(btn => btn.classList.remove('active'));
            // Add active class to clicked button
            this.classList.add('active');

            const view = this.getAttribute('data-view');
            switchView(view);
        });
    });

    function switchView(view) {
        const flowDiagram = document.querySelector('.flow-diagram');
        if (flowDiagram) {
            // Add transition effect
            flowDiagram.style.opacity = '0.5';
            setTimeout(() => {
                flowDiagram.style.opacity = '1';
            }, 300);

            // Here you could implement different visualization modes
            console.log(`Switching to ${view} view`);
        }
    }

    // Interactive Step Cards
    const stepCards = document.querySelectorAll('.step');
    stepCards.forEach((card, index) => {
        card.addEventListener('click', function(e) {
            // Add click effect
            this.style.transform = 'scale(0.98)';
            setTimeout(() => {
                this.style.transform = '';
            }, 150);

            // Show step details
            showStepDetails(index + 1, e);
        });

        // Add hover sound effect simulation
        card.addEventListener('mouseenter', function() {
            // Could add audio feedback here
            console.log(`Hovering over step ${index + 1}`);
        });
    });

    function showStepDetails(stepNumber, e) {
        const stepDetails = [
            'Objective: Defining research parameters and scope for autonomous execution',
            'Ingestion: Scanning and parsing data across multiple network nodes',
            'Analysis: Neural pattern synthesis and correlation analysis',
            'Insights: Extracting actionable intelligence vectors'
        ];

        // Create a temporary tooltip
        const tooltip = document.createElement('div');
        tooltip.className = 'step-tooltip';
        tooltip.innerHTML = `
            <div class="tooltip-content">
                <h4>Step ${stepNumber} Details</h4>
                <p>${stepDetails[stepNumber - 1]}</p>
            </div>
        `;

        document.body.appendChild(tooltip);

        // Position tooltip
        const rect = (e.target || e.currentTarget).getBoundingClientRect();
        tooltip.style.left = `${rect.left + rect.width / 2}px`;
        tooltip.style.top = `${rect.top - 10}px`;

        // Animate in
        setTimeout(() => tooltip.classList.add('show'), 10);

        // Remove after 3 seconds
        setTimeout(() => {
            tooltip.classList.remove('show');
            setTimeout(() => tooltip.remove(), 300);
        }, 3000);
    }

    // Data Flow Animation Enhancement
    function enhanceDataFlow() {
        const connectors = document.querySelectorAll('.connector');
        connectors.forEach((connector, index) => {
            const dataPackets = connector.querySelectorAll('.data-packet');

            // Stagger the animations
            dataPackets.forEach((packet, packetIndex) => {
                packet.style.animationDelay = `${index * 0.5 + packetIndex * 0.3}s`;
            });
        });
    }

    enhanceDataFlow();

    // Flow Node Interactions
    const flowNodes = document.querySelectorAll('.flow-node');
    flowNodes.forEach((node, index) => {
        node.addEventListener('click', function() {
            // Highlight the clicked node
            flowNodes.forEach(n => n.classList.remove('selected'));
            this.classList.add('selected');

            // Update step progress to focus on this step
            updateStepFocus(index + 1);
        });
    });

    function updateStepFocus(stepNumber) {
        // Could implement step-specific focus functionality
        console.log(`Focusing on step ${stepNumber}`);
    }

    // Add CSS for step tooltips
    const tooltipStyle = document.createElement('style');
    tooltipStyle.textContent = `
        .step-tooltip {
            position: fixed;
            transform: translate(-50%, -100%) translateY(-10px);
            z-index: 1000;
            pointer-events: none;
            opacity: 0;
            transition: all 0.3s ease;
        }

        .step-tooltip.show {
            opacity: 1;
            transform: translate(-50%, -100%) translateY(0);
        }

        .tooltip-content {
            background: rgba(0, 0, 0, 0.9);
            border: 1px solid var(--neon-cyan);
            border-radius: 8px;
            padding: 15px;
            backdrop-filter: blur(10px);
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
            min-width: 250px;
        }

        .tooltip-content h4 {
            color: var(--neon-cyan);
            margin: 0 0 10px 0;
            font-size: 1rem;
        }

        .tooltip-content p {
            color: var(--text-main);
            margin: 0;
            font-size: 0.9rem;
            line-height: 1.4;
        }

        .flow-node.selected {
            border-color: var(--neon-purple);
            background: rgba(157, 0, 255, 0.1);
            transform: scale(1.05);
        }

        .flow-node.selected .node-pulse {
            background: var(--neon-purple);
            animation: nodePulseSelected 1.5s ease-in-out infinite;
        }

        @keyframes nodePulseSelected {
            0%, 100% {
                transform: scale(1);
                opacity: 0.8;
                box-shadow: 0 0 15px var(--neon-purple);
            }
            50% {
                transform: scale(1.4);
                opacity: 1;
                box-shadow: 0 0 25px var(--neon-purple), 0 0 35px var(--neon-purple);
            }
        }
    `;
    document.head.appendChild(tooltipStyle);


    // --- DYNAMIC DATA INJECTION ---

    // 1. STRATEGY
    async function fetchStrategy() {
        if (!window.currentTaskId) return;
        try {
            const res = await fetch(`${window.API_BASE_URL}/api/strategy/${window.currentTaskId}`);
            if(res.ok) {
                const data = await res.json();
                if(data.success && data.data && data.data.length > 0) {
                    const container = document.querySelector('.strategy-features');
                    if(container && !container.dataset.updated) {
                        container.innerHTML = ''; // clear mock
                        data.data.forEach(step => {
                            container.innerHTML += `<div class="feature glass glow-hover card-3d">
                                <div class="icon">SETTINGS</div>
                                <h4 style="margin-top:10px;">${step.action}</h4>
                                <p style="font-size: 0.9em; margin-top:5px;">${step.description}</p>
                            </div>`;
                        });
                        container.dataset.updated = "true";
                    }
                }
            }
        } catch(err) { console.error("Strategy fetch err", err); }
    }

    // 2. RESULTS
    async function fetchResultsInsights() {
        if (!window.currentTaskId) return;
        try {
            const res = await fetch(`${window.API_BASE_URL}/api/results/${window.currentTaskId}`);
            if(res.ok) {
                const data = await res.json();
                if(data.success && data.data) {
                    const title = document.querySelector('.executive-content .summary-line:nth-child(2)');
                    if(title && !title.dataset.updated) {
                        title.innerHTML = `Pattern recognition: <span class="highlight">${data.data.title || 'SUCCESS'}</span>`;
                        title.dataset.updated = "true";
                    }

                    const insightGrid = document.querySelector('.insights-grid');
                    if(insightGrid && !insightGrid.dataset.updated) {
                        insightGrid.innerHTML = ''; 
                        if (data.data.key_findings) {
                            data.data.key_findings.forEach((finding, idx) => {
                                insightGrid.innerHTML += `<div class="insight-item">
                                    <div class="insight-icon">CHK</div>
                                    <div class="insight-text" style="font-size: 0.9em; flex: 1;">${finding}</div>
                                </div>`;
                            });
                        }
                        insightGrid.dataset.updated = "true";
                    }
                }
            }
        } catch(err) { console.error("Results fetch err", err); }
    }

    // 3. DEEP DIVE & OUTPUT STATE
    function initWaitingStates() {
        if (!window.currentTaskId) {
            const docText = document.querySelector('.doc-text');
            if(docText && !docText.dataset.init) {
                docText.textContent = "Awaiting Initialized Context from Platform... Please start a research query.";
                docText.dataset.init = "true";
            }
            
            const deepDiveSources = document.querySelector('.source-list');
            if(deepDiveSources && !deepDiveSources.dataset.init) {
                deepDiveSources.innerHTML = '<li><span class="neon-dot"></span> Waiting for Intelligence...</li>';
                deepDiveSources.dataset.init = "true";
            }
        }
    }
    initWaitingStates();

    async function fetchDeepDive() {
        if (!window.currentTaskId) return;
        try {
            const res = await fetch(`${window.API_BASE_URL}/api/deep-dive/${window.currentTaskId}/general`);
            if(res.ok) {
                const data = await res.json();
                if(data.success && data.data) {
                    const sourceList = document.querySelector('.source-list');
                    if(sourceList && data.data.citations) {
                        sourceList.innerHTML = '';
                        data.data.citations.forEach(c => {
                            sourceList.innerHTML += `<li><span class="neon-dot"></span> ${c}</li>`;
                        });
                    }
                    const docText = document.querySelector('.doc-text');
                    if(docText && data.data.content) {
                        docText.textContent = data.data.content;
                    }
                }
            }
        } catch(err) { console.error(err); }
    }

    // 4. MEMORY LOGS
    async function fetchMemory() {
        try {
            const res = await fetch(`${window.API_BASE_URL}/api/memory/history`);
            if(res.ok) {
                const data = await res.json();
                if(data.success && data.data) {
                    let memoryContainer = document.getElementById('dynamic-memory-history');
                    if(!memoryContainer) {
                        memoryContainer = document.createElement('div');
                        memoryContainer.id = 'dynamic-memory-history';
                        memoryContainer.style.pointerEvents = 'auto';
                        memoryContainer.innerHTML = '<h3 style="margin-top:20px; color:var(--text-main); font-size: 1.5rem; text-align: center;">Recent Memory Matrix</h3><div class="memory-nodes-grid" id="history-grid" style="margin-top:10px;"></div>';
                        const memSect = document.querySelector('.memory .section-content');
                        if(memSect) memSect.appendChild(memoryContainer);
                    }
                    const histGrid = document.getElementById('history-grid');
                    if(histGrid) {
                        histGrid.innerHTML = '';
                        data.data.forEach((item, index) => {
                            histGrid.innerHTML += `<div class="memory-node enhanced" onclick="window.location.href='memory-detail.html?id=${index % 6}'">
                                <div class="memory-card glass glow-hover">
                                    <h4>Task: ${item.task_id}</h4>
                                    <p style="color:var(--text-muted); font-size:12px; margin-top:5px;">${item.query} <br/> <span style="color:var(--neon-purple);">${item.date}</span></p>
                                </div>
                                <div class="blinking-oval-glow"></div>
                            </div>`;
                        });
                    }
                }
            }
        } catch(err) { console.error(err); }
    }

    setInterval(() => {
        if(window.currentTaskId) {
            fetchStrategy();
            fetchResultsInsights();
            fetchDeepDive();
        } else {
            initWaitingStates();
        }
    }, 5000);

    // Global Modal Access for Memory Matrix
    window.openMemoryModal = function(taskId, query, date) {
        const modal = document.getElementById('mu-modal');
        if (!modal) return;
        
        document.getElementById('mu-modal-icon').textContent = 'MEM';
        document.getElementById('mu-modal-title').textContent = `Task: ${taskId}`;
        document.getElementById('mu-modal-desc').textContent = `Autonomous Research Query: "${query}". This task involved multi-vector semantic mapping and real-time intelligence synthesis across decentralized nodes.`;
        document.getElementById('mu-modal-tags').innerHTML = `<span class="mu-modal-tag">${date}</span><span class="mu-modal-tag">Processed</span><span class="mu-modal-tag">Verified</span>`;
        document.getElementById('mu-modal-bar-fill').style.width = '100%';
        document.getElementById('mu-modal-meta').textContent = `Status: ARCHIVED | Processing Time: 12.4s | Vector Depth: High`;
        
        modal.classList.add('active');
    };

    fetchMemory();
    setInterval(fetchMemory, 15000);

    // --- DEEP DIVE Q&A ---
    const askBtn = document.getElementById('deep-dive-ask-btn');
    const questionInput = document.getElementById('deep-dive-question');
    const answerDiv = document.getElementById('deep-dive-answer');

    if (askBtn && questionInput && answerDiv) {
        askBtn.addEventListener('click', async () => {
            const question = questionInput.value.trim();
            if (!question) return;
            if (!window.currentTaskId) {
                answerDiv.style.display = 'block';
                answerDiv.textContent = 'Please initialize a research query first.';
                return;
            }

            askBtn.textContent = 'Thinking...';
            askBtn.disabled = true;
            answerDiv.style.display = 'block';
            answerDiv.innerHTML = '<span style="color:var(--neon-cyan);">AI is analyzing your question...</span>';

            try {
                const res = await fetch(`${window.API_BASE_URL}/api/deep-dive/explore`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        task_id: window.currentTaskId,
                        topic_id: 'general',
                        question: question
                    })
                });
                if (res.ok) {
                    const data = await res.json();
                    if (data.success && data.data && data.data.response) {
                        answerDiv.innerHTML = `<strong style="color:var(--neon-cyan);">AI Response:</strong><br/>${data.data.response}`;
                    } else {
                        answerDiv.textContent = 'No response received.';
                    }
                } else {
                    answerDiv.textContent = 'Failed to get a response.';
                }
            } catch (e) {
                answerDiv.textContent = 'Error contacting AI.';
                console.error(e);
            } finally {
                askBtn.textContent = 'Ask AI';
                askBtn.disabled = false;
                questionInput.value = '';
            }
        });

        questionInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') askBtn.click();
        });
    }

    // --- MOCK RESEARCH FLOW ---
    // --- Mock Interaction Hooks ---
    async function fetchStrategy() {
        const url = `${window.API_BASE_URL}/api/strategy/${window.currentTaskId}`;
        try {
            const res = await fetch(url);
            if (res.ok) {
                const data = await res.json();
                updateStrategyDisplay(data.data);
            }
        } catch (e) { console.warn("Fetch strategy failed", e); }
    }

    async function fetchResultsInsights() {
        const url = `${window.API_BASE_URL}/api/results/${window.currentTaskId}`;
        try {
            const res = await fetch(url);
            if (res.ok) {
                const data = await res.json();
                updateResultsDisplay(data.data);
            }
        } catch (e) { console.warn("Fetch results failed", e); }
    }

    function updateStrategyDisplay(data) {
        const nodes = document.querySelectorAll('.node.sub');
        if (nodes.length > 0 && Array.isArray(data)) {
            data.forEach((item, i) => {
                if (nodes[i]) {
                    const h4 = nodes[i].querySelector('h4');
                    const p = nodes[i].querySelector('p');
                    if (h4) h4.textContent = item.action;
                    if (p) p.textContent = item.description;
                    nodes[i].classList.add('active');
                }
            });
        }
    }

    function updateResultsDisplay(data) {
        const title = document.querySelector('.results-content h2');
        const list = document.querySelector('.findings-list');
        if (title && data.title) title.textContent = data.title;
        if (list && Array.isArray(data.key_findings)) {
            list.innerHTML = data.key_findings.map(f => `<li><span class="finding-icon">*</span> ${f}</li>`).join('');
        }
    }

    // Existing StartMockResearch
    function startMockResearch() {
        console.log("Starting cinematic mock research flow...");
        
        // 1. Process Section Initialization
        const cpuUsage = document.getElementById('cpu-usage');
        const neuralLoad = document.getElementById('neural-load');
        const dataThroughput = document.getElementById('data-throughput');
        const processStatus = document.getElementById('process-status');
        
        if (cpuUsage) cpuUsage.textContent = '87%';
        if (neuralLoad) neuralLoad.textContent = '94%';
        if (dataThroughput) dataThroughput.textContent = '2.4GB/s';
        if (processStatus) {
            const statusText = processStatus.querySelector('.status-text');
            if (statusText) statusText.textContent = 'Active: Neural Core Sync';
        }

        // Staggered Step Completion
        const steps = [
            { id: 'step1', delay: 1000, progress: 100 },
            { id: 'step2', delay: 3000, progress: 100 },
            { id: 'step3', delay: 6000, progress: 85 },
            { id: 'step4', delay: 9000, progress: 45 }
        ];

        steps.forEach(step => {
            setTimeout(() => {
                const progressFill = document.getElementById(`${step.id}-progress`);
                const progressText = document.getElementById(`${step.id}-text`);
                if (progressFill) progressFill.style.width = `${step.progress}%`;
                if (progressText) progressText.textContent = `${step.progress}%`;
                
                // Trigger Strategy/Results updates as steps complete
                if (step.id === 'step1') fetchStrategy();
                if (step.id === 'step2') fetchResultsInsights();
            }, step.delay);
        });

        // Update Output page state
        setTimeout(() => {
            const docText = document.querySelector('.doc-text');
            if (docText) {
                docText.textContent = "Autonomous research synthesis complete. Market integration probability mapped at 98.4% across all temporal vectors. Neural pathways have identified a high-confidence entry point in the decentralized liquidity mesh.";
                docText.classList.add('fade-in');
            }
            const generationStatus = document.getElementById('generation-status');
            if (generationStatus) generationStatus.textContent = 'Complete';
        }, 12000);
    }

    // Wrap fetches for Mock Mode
    const originalFetch = window.fetch;
    window.fetch = async function(...args) {
        if (window.MOCK_MODE) {
            const url = args[0];
            if (url.includes('/api/strategy/')) {
                return {
                    ok: true,
                    json: async () => ({
                        success: true,
                        data: [
                            { action: "Quantum Data Ingestion", description: "Parsing non-linear datasets via 5th-gen neural nodes." },
                            { action: "Vector Mapping", description: "Mapping 4D semantic vectors to market liquidity clusters." },
                            { action: "Predictive Synthesis", description: "Generating high-confidence predictive models." }
                        ]
                    })
                };
            }
            if (url.includes('/api/results/')) {
                return {
                    ok: true,
                    json: async () => ({
                        success: true,
                        data: {
                            title: "OPTIMAL PARAMETERS FOUND",
                            key_findings: [
                                "Neural sync exceeded 98.7% threshold",
                                "Liquidity gap identified in sector 7-G",
                                "Real-time vector alignment: SUCCESS"
                            ]
                        }
                    })
                };
            }
            if (url.includes('/api/deep-dive/')) {
                return {
                    ok: true,
                    json: async () => ({
                        success: true,
                        data: {
                            citations: ["ArXiv:24-NEURAL", "SEC-X9-FEED", "SENTIMENT-V3"],
                            content: "Deep neural analysis has identified a convergence of liquidity vectors across three major network protocols. The confidence interval is currently mapping at 98.4%."
                        }
                    })
                };
            }
            if (url.includes('/api/memory/')) {
                return {
                    ok: true,
                    json: async () => ({
                        success: true,
                        data: [
                            { task_id: "VEC-0X9A", query: "Logistic Pathway Optimization", date: "2026-03-29" },
                            { task_id: "SYS-0K42", query: "Blockchain Entropy Analysis", date: "2026-03-28" },
                            { task_id: "QTM-7B42", query: "Quantum Analysis Cluster Sync", date: "2026-04-15" },
                            { task_id: "NET-M92",  query: "Global Neural Mesh Mapping", date: "2026-04-18" }
                        ]
                    })
                };
            }
        }
    };
    
    // Real-time Latency HUD Simulation
    const latencyEl = document.getElementById('hero-latency-value');
    if (latencyEl) {
        setInterval(() => {
            const base = 12;
            const variance = Math.random() * 6;
            const latency = (base + variance).toFixed(0);
            latencyEl.textContent = `${latency}ms`;
        }, 2200);
    }

    // Tactical Node Identification (Login Page)
    const nodeEl = document.getElementById('node-identifier');
    if (nodeEl) {
        const nodes = ["QUANTUM-AX7", "NEURAL-V9", "SYNT-X0", "CORE-PRO2", "VEC-ALFA"];
        setInterval(() => {
            const randomNode = nodes[Math.floor(Math.random() * nodes.length)];
            nodeEl.textContent = `Node: ${randomNode}`;
        }, 4000);
    }

    // =======================================================
    // -- State --
    //  MEMORY UNIVERSE - Optimised 3D Canvas Engine
    // ==========================================================
    (function initMemoryUniverse() {
        const section  = document.getElementById('memory');
        const canvas   = document.getElementById('mu-canvas');
        const starsCvs = document.getElementById('mu-stars-canvas');
        const modal    = document.getElementById('mu-modal');
        const mClose   = document.getElementById('mu-modal-close');
        if (!section || !canvas || !starsCvs) return;

        const ctx  = canvas.getContext('2d', { alpha: true });
        const sCtx = starsCvs.getContext('2d', { alpha: true });

        // -- Disable image smoothing for sharp rendering --
        ctx.imageSmoothingEnabled = false;

        // -- Cluster data -----------------------------------------
        const CLUSTER_DATA = [
            { label:'Research Hub',    icon:'CORE', desc:'Central knowledge repository linking all research threads and semantic associations across the neural fabric.',        tags:['Research','Core','Semantic'],    integrity:98, color:[0,243,255],  r:13 },
            { label:'Quantum Analysis',icon:'QTM', desc:'Quantum-accelerated data processing cluster for multi-dimensional probability vector computations.',                  tags:['Quantum','Analysis','Vector'],   integrity:95, color:[157,0,255],  r:10 },
            { label:'Market Signals',  icon:'MKT', desc:'Real-time market sentiment aggregation and predictive forecasting with high-frequency data streams.',                 tags:['Market','Sentiment','Forecast'], integrity:92, color:[0,200,255],  r:9  },
            { label:'Neural Pathways', icon:'NET', desc:'Global knowledge mesh connecting distributed research nodes via synaptic cross-referencing algorithms.',              tags:['Neural','Global','Mesh'],        integrity:99, color:[200,0,255],  r:8  },
            { label:'Insight Engine',  icon:'IDEA', desc:'Autonomous insight generation system that synthesizes patterns into actionable intelligence outputs.',                tags:['Insights','Synthesis','AI'],     integrity:97, color:[255,210,0],  r:9  },
            { label:'Deep Archive',    icon:'DB', desc:'Long-term memory archive storing compressed research vectors for future contextual retrieval.',                       tags:['Archive','Memory','Storage'],    integrity:89, color:[0,150,255],  r:7  },
        ];

        function makeNodes(count, spread, parentR) {
            return Array.from({ length: count }, () => ({
                ox: (Math.random()-0.5)*spread,
                oy: (Math.random()-0.5)*spread,
                oz: (Math.random()-0.5)*spread*0.4,
                r:  parentR*(0.22+Math.random()*0.28),
                phaseX: Math.random()*Math.PI*2,
                phaseY: Math.random()*Math.PI*2,
                speed:  0.35+Math.random()*0.45,
            }));
        }

        const clusters = CLUSTER_DATA.map((d, i) => ({
            ...d,
            angle:      (i/CLUSTER_DATA.length)*Math.PI*2,
            radius:     145+Math.random()*90,
            tiltY:      (Math.random()-0.5)*0.7,
            rotSpeed:   (0.07+Math.random()*0.06)*(Math.random()>0.5?1:-1),
            floatPhase: Math.random()*Math.PI*2,
            nodes:      makeNodes(3+Math.floor(Math.random()*3), 60, d.r),
            hovered:    false,
            sx:0, sy:0, screenR:0,
        }));

        // 11 connections
        const CONNS = [[0,1],[0,2],[0,3],[0,4],[0,5],[1,2],[2,3],[3,4],[4,5],[1,5],[2,4]];

        // -- State --
        let W=0, H=0, DPR=1;
        let camX=0, camY=0;
        let mouseX=0.5, mouseY=0.5;
        let parallaX=0, parallaY=0;
        let hoveredIdx=null;
        let t=0, frameCount=0;
        let isVisible=false; // IntersectionObserver gate
        let rafId=null;

        // -- Size canvas with capped DPR for performance --
        function resize() {
            DPR = Math.min(window.devicePixelRatio||1, 1.5); // cap at 1.5x
            const rect = section.getBoundingClientRect();
            W = rect.width  || window.innerWidth;
            H = rect.height || window.innerHeight;
            canvas.width  = W*DPR; canvas.height  = H*DPR; canvas.style.width  = W+'px'; canvas.style.height  = H+'px';
            starsCvs.width= W*DPR; starsCvs.height= H*DPR; starsCvs.style.width= W+'px'; starsCvs.style.height= H+'px';
            ctx.setTransform(DPR,0,0,DPR,0,0);
            sCtx.setTransform(DPR,0,0,DPR,0,0);
        }

        // -- Star field (painted once, twinkled cheaply) --
        const STARS = Array.from({length:200}, ()=>({
            x:Math.random(), y:Math.random(),
            r:Math.random()*1.2+0.2,
            o:Math.random()*0.5+0.1,
            tw:Math.random()*Math.PI*2,
            ts:0.004+Math.random()*0.006,
        }));
        function animStars() {
            sCtx.clearRect(0,0,W,H);
            STARS.forEach(s=>{
                s.tw += s.ts;
                const o = s.o*(0.5+0.5*Math.sin(s.tw));
                sCtx.globalAlpha = o;
                sCtx.fillStyle   = '#fff';
                sCtx.beginPath();
                sCtx.arc(s.x*W, s.y*H, s.r, 0, Math.PI*2);
                sCtx.fill();
            });
            sCtx.globalAlpha = 1;
        }

        // -- Projection --
        const FOV = 680;
        function project(x3,y3,z3){
            const cx = W/2 + camX + parallaX;
            const cy = H/2 + camY + parallaY;
            const d  = FOV/(FOV+z3);
            return { sx: cx+x3*d, sy: cy+y3*d, depth:d, z:z3 };
        }

        // -- Cluster world position --
        function clusterPos(c){
            const a  = c.angle + t*c.rotSpeed*0.4;
            const fy = 7*Math.sin(c.floatPhase + t*0.28);
            return {
                x: Math.cos(a)*c.radius,
                y: Math.sin(a*0.7)*c.radius*0.38 + fy,
                z: Math.sin(a)*c.radius*0.48 + c.tiltY*75,
            };
        }

        // -- rgba helper --
        function rgba(rgb,a){ return `rgba(${rgb[0]},${rgb[1]},${rgb[2]},${a})`; }

        // -- Draw curved connection --
        function drawConn(p1,p2,c1,c2){
            const d = (p1.depth+p2.depth)*0.5;
            const mx = (p1.sx+p2.sx)*0.5 + Math.sin(t*0.45)*25;
            const my = (p1.sy+p2.sy)*0.5 + Math.cos(t*0.35)*18;
            const g  = ctx.createLinearGradient(p1.sx,p1.sy,p2.sx,p2.sy);
            g.addColorStop(0,   rgba(c1.color, 0.12*d));
            g.addColorStop(0.5, rgba([130,80,255], 0.18*d));
            g.addColorStop(1,   rgba(c2.color, 0.12*d));
            ctx.beginPath();
            ctx.moveTo(p1.sx,p1.sy);
            ctx.quadraticCurveTo(mx,my,p2.sx,p2.sy);
            ctx.strokeStyle = g;
            ctx.lineWidth   = 0.7*d;
            ctx.stroke();
        }

        // -- Draw light pulse travelling on bezier --
        const pulseTimes = CONNS.map(()=>Math.random());
        function drawPulse(p1,p2,pt,color,r){
            const tt = pt%1;
            const mx = (p1.sx+p2.sx)*0.5 + Math.sin(t*0.45)*25;
            const my = (p1.sy+p2.sy)*0.5 + Math.cos(t*0.35)*18;
            const bx = (1-tt)*(1-tt)*p1.sx + 2*(1-tt)*tt*mx + tt*tt*p2.sx;
            const by = (1-tt)*(1-tt)*p1.sy + 2*(1-tt)*tt*my + tt*tt*p2.sy;
            const a  = Math.sin(tt*Math.PI)*0.85;
            ctx.fillStyle = rgba(color, a);
            ctx.beginPath();
            ctx.arc(bx,by,r,0,Math.PI*2);
            ctx.fill();
        }

        // -- Draw one cluster -- (NO ctx.filter - replaced with alpha-based DoF)
        function drawCluster(c, pos){
            const {sx,sy,depth,z} = pos;
            const baseR = c.r * depth;
            const isHov = c.hovered;

            // Alpha-based depth-of-field: far nodes are dimmer (no blur - 10x cheaper)
            const alpha  = Math.min(1, 0.45 + depth*0.65);
            const gSize  = isHov ? baseR*4.2 : baseR*2.8;

            // Outer ambient glow
            const og = ctx.createRadialGradient(sx,sy,0,sx,sy,gSize);
            og.addColorStop(0,   rgba(c.color, (isHov?0.22:0.1)*alpha));
            og.addColorStop(0.4, rgba(c.color, (isHov?0.07:0.03)*alpha));
            og.addColorStop(1,   rgba(c.color, 0));
            ctx.fillStyle = og;
            ctx.beginPath();
            ctx.arc(sx,sy,gSize,0,Math.PI*2);
            ctx.fill();

            // Glass orb - shadowBlur ONLY on hovered cluster to save GPU
            if (isHov) {
                ctx.shadowBlur  = 22;
                ctx.shadowColor = rgba(c.color, 0.85);
            }
            const gg = ctx.createRadialGradient(sx-baseR*0.3,sy-baseR*0.3,0,sx,sy,baseR);
            gg.addColorStop(0,   rgba([255,255,255], 0.38*alpha));
            gg.addColorStop(0.45,rgba(c.color, 0.55*alpha));
            gg.addColorStop(0.85,rgba(c.color, 0.18*alpha));
            gg.addColorStop(1,   rgba([0,0,0], 0.15));
            ctx.fillStyle = gg;
            ctx.beginPath();
            ctx.arc(sx,sy,baseR,0,Math.PI*2);
            ctx.fill();
            if (isHov) ctx.shadowBlur = 0;

            // Rim
            ctx.strokeStyle = rgba(c.color, 0.55*alpha);
            ctx.lineWidth   = isHov ? 1.8 : 0.9;
            ctx.stroke();

            // Specular highlight
            ctx.fillStyle = rgba([255,255,255], 0.28*alpha);
            ctx.beginPath();
            ctx.arc(sx-baseR*0.3, sy-baseR*0.32, baseR*0.25, 0, Math.PI*2);
            ctx.fill();

            // Breathing glow (no shadow, just alpha pulse)
            const breathe = 0.55 + 0.45*Math.sin(t*1.1+c.floatPhase);
            ctx.globalAlpha = breathe*0.4*depth;
            const bg = ctx.createRadialGradient(sx,sy,baseR*0.4,sx,sy,baseR*1.9);
            bg.addColorStop(0, rgba(c.color,0.3));
            bg.addColorStop(1, rgba(c.color,0));
            ctx.fillStyle = bg;
            ctx.beginPath();
            ctx.arc(sx,sy,baseR*1.9,0,Math.PI*2);
            ctx.fill();
            ctx.globalAlpha = 1;

            // Sub-nodes (lighter - no gradient, just solid alpha circles)
            c.nodes.forEach(n=>{
                const na  = n.phaseX + t*n.speed;
                const nb  = n.phaseY + t*n.speed*0.65;
                const nx3 = (pos.sx - W/2 - camX - parallaX) + Math.cos(na)*n.ox;
                const ny3 = (pos.sy - H/2 - camY - parallaY) + Math.sin(nb)*n.oy;
                const np  = project(nx3, ny3, z + Math.sin(na*0.5)*n.oz);
                const nr  = n.r*np.depth;
                if (nr < 0.8) return;
                const na2 = Math.min(1, 0.3+np.depth*0.5);
                // Connector line
                ctx.beginPath();
                ctx.moveTo(sx,sy);
                ctx.lineTo(np.sx,np.sy);
                ctx.strokeStyle = rgba(c.color, 0.12*na2);
                ctx.lineWidth   = 0.4;
                ctx.stroke();
                // Sub-node dot
                ctx.fillStyle = rgba([220,220,255], 0.55*na2);
                ctx.beginPath();
                ctx.arc(np.sx, np.sy, nr, 0, Math.PI*2);
                ctx.fill();
            });

            // Store screen coords for hit-test
            c.sx=sx; c.sy=sy; c.screenR=baseR;
        }

        // -- Main render loop --
        let lastFrame=0;
        function render(now){
            if (!isVisible) { rafId=requestAnimationFrame(render); return; } // pause when off-screen
            rafId = requestAnimationFrame(render);
            const dt = Math.min((now-lastFrame)/1000, 0.05);
            lastFrame = now;
            t += dt;
            frameCount++;

            // Smooth camera drift from mouse
            camX += ((mouseX-0.5)*55 - camX)*0.04 + Math.sin(t*0.065)*0.12;
            camY += ((mouseY-0.5)*38 - camY)*0.04 + Math.cos(t*0.048)*0.09;

            // Stars - update every 4th frame for performance
            if (frameCount%4===0) animStars();

            ctx.clearRect(0,0,W,H);

            // Project all clusters
            const positions = clusters.map(c=>{
                const p = clusterPos(c);
                return project(p.x,p.y,p.z);
            });

            // Painter's algorithm - back to front
            const order = clusters.map((_,i)=>i).sort((a,b)=>positions[b].z-positions[a].z);

            // Connections + pulses
            CONNS.forEach(([ai,bi],ci)=>{
                const pa=positions[ai], pb=positions[bi];
                drawConn(pa,pb,clusters[ai],clusters[bi]);
                pulseTimes[ci] = (pulseTimes[ci]+dt*0.16)%1;
                drawPulse(pa,pb, pulseTimes[ci],        clusters[ai].color, 2.5);
                drawPulse(pa,pb,(pulseTimes[ci]+0.52)%1, clusters[bi].color, 1.8);
            });

            // Clusters back to front
            order.forEach(i=> drawCluster(clusters[i], positions[i]));

            // Hover label (cheap text draw)
            if (hoveredIdx!==null){
                const c=clusters[hoveredIdx];
                ctx.font      = 'bold 12px Space Grotesk,sans-serif';
                ctx.textAlign = 'center';
                ctx.fillStyle = rgba(c.color, 0.92);
                ctx.fillText(c.label, c.sx, c.sy-c.screenR-9);
            }
        }

        // -- IntersectionObserver - pause when not in view --
        const io = new IntersectionObserver(entries=>{
            isVisible = entries[0].isIntersecting;
            if (isVisible && !rafId) rafId=requestAnimationFrame(render);
        }, { threshold:0.05 });
        io.observe(section);

        // -- Also pause video when off-screen for extra perf --
        const bgVid = section.querySelector('.mu-bg-video');
        const vidIo = new IntersectionObserver(entries=>{
            if (!bgVid) return;
            entries[0].isIntersecting ? bgVid.play() : bgVid.pause();
        }, { threshold:0.05 });
        if (bgVid) vidIo.observe(section);

        // -- Mouse --
        canvas.addEventListener('mousemove', e=>{
            const rect=canvas.getBoundingClientRect();
            mouseX=(e.clientX-rect.left)/W;
            mouseY=(e.clientY-rect.top)/H;
            const mx=e.clientX-rect.left, my=e.clientY-rect.top;
            let found=null;
            clusters.forEach((c,i)=>{
                const h=Math.hypot(mx-c.sx,my-c.sy)<c.screenR*2.8;
                c.hovered=h;
                if(h) found=i;
            });
            hoveredIdx=found;
            canvas.style.cursor=found!==null?'pointer':'default';
        });
        canvas.addEventListener('mouseleave',()=>{
            clusters.forEach(c=>c.hovered=false);
            hoveredIdx=null; mouseX=0.5; mouseY=0.5;
        });
        canvas.addEventListener('click',e=>{
            const rect=canvas.getBoundingClientRect();
            const mx=e.clientX-rect.left, my=e.clientY-rect.top;
            clusters.forEach((c, index)=>{ 
                if(Math.hypot(mx-c.sx,my-c.sy) < c.screenR * 4.5) {
                    openModal(c); // Reverting to modal opening instead of redirect
                }
            });
        });

        // Scroll parallax
        window.addEventListener('scroll',()=>{
            const rect=section.getBoundingClientRect();
            const rel=-rect.top/window.innerHeight;
            parallaX=Math.sin(rel*0.8)*35;
            parallaY=rel*55;
        },{passive:true});

        // -- Modal --
        function openModal(c){
            document.getElementById('mu-modal-icon').textContent  = c.icon;
            document.getElementById('mu-modal-title').textContent = c.label;
            document.getElementById('mu-modal-desc').textContent  = c.desc;
            document.getElementById('mu-modal-tags').innerHTML    = c.tags.map(t=>`<span class="mu-modal-tag">${t}</span>`).join('');
            document.getElementById('mu-modal-bar-fill').style.width = c.integrity+'%';
            document.getElementById('mu-modal-meta').textContent  = `Integrity: ${c.integrity}%  |  Depth: ${Math.abs(Math.round(c.tiltY*100))} units`;
            if(modal) modal.classList.add('active');
        }
        if(mClose) mClose.addEventListener('click',()=>modal.classList.remove('active'));
        if(modal)  modal.addEventListener('click',e=>{ if(e.target===modal) modal.classList.remove('active'); });

        // -- HUD counters --
        function updateHUD(){
            const nc=document.getElementById('mu-node-count');
            const lc=document.getElementById('mu-link-count');
            const ic=document.getElementById('mu-insight-count');
            if(nc) nc.textContent=(240+Math.floor(Math.random()*20)).toString();
            if(lc) lc.textContent=(1800+Math.floor(Math.random()*100)).toLocaleString();
            if(ic) ic.textContent=(9200+Math.floor(Math.random()*300)).toLocaleString();
        }
        setInterval(updateHUD, 4000);

        // -- Boot --
        resize();
        window.addEventListener('resize', resize, {passive:true});
        rafId = requestAnimationFrame(render);
    })();

});

// â”€â”€ AI OUTPUT COMMAND CENTER LOGIC â”€â”€
function initOutputCommandCenter() {
    const textEl = document.getElementById('oc-output-text');
    if (!textEl) return;

    // 1. Typing Reveal
    const text = textEl.textContent.trim();
    textEl.textContent = '';
    let i = 0;
    function type() {
        if (i < text.length) {
            textEl.textContent += text.charAt(i);
            i++;
            setTimeout(type, 20);
        }
    }
    
    // Start typing when section is in view
    const observer = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting) {
            type();
            animateRings();
            observer.disconnect();
        }
    }, { threshold: 0.5 });
    observer.observe(textEl);

    // 2. Animate Rings
    function animateRings() {
        const ring = document.getElementById('oc-q-ring');
        if (ring) {
            ring.style.strokeDashoffset = '283';
            setTimeout(() => {
                ring.style.strokeDashoffset = (283 - (283 * 0.987)).toString();
            }, 500);
        }
    }
}

// Initialize on load
document.addEventListener('DOMContentLoaded', initOutputCommandCenter);




/* -----------------------------------------------------------
   AI EXPORT SYSTEM — Cinematic PDF Generation Engine
   ----------------------------------------------------------- */
(function() {
    'use strict';

    /* -- Config -- */
    const TOTAL_DURATION_MS  = 5800;   // total processing animation time
    const DOWNLOAD_DELAY_MS  = 900;    // pause before auto-triggering download after 100%
    const PANEL_EXIT_MS      = 1400;   // time overlay stays after download before closing
    const TOAST_DURATION_MS  = 3200;

    /* -- Log messages sequenced during processing -- */
    const LOG_STEPS = [
        { pct: 0,   tag: '[INIT]',   cls: '',            msg: 'Establishing secure export channel...' },
        { pct: 5,   tag: '[SYS]',    cls: '',            msg: 'Authenticating intelligence node — v2.4.7' },
        { pct: 12,  tag: '[DATA]',   cls: '',            msg: 'Collecting raw data nodes from memory corpus...' },
        { pct: 20,  tag: '[PROC]',   cls: '',            msg: 'Decompressing 2.4 TB neural archive...' },
        { pct: 28,  tag: '[AI]',     cls: '',            msg: 'Structuring multi-dimensional analysis matrix...' },
        { pct: 36,  tag: '[PARSE]',  cls: '',            msg: 'Cross-referencing 1,247 knowledge clusters...' },
        { pct: 44,  tag: '[AI]',     cls: '',            msg: 'Generating insights — confidence threshold: 98.4%' },
        { pct: 52,  tag: '[WARN]',   cls: 'aex-log-warn',msg: 'Ambiguous node detected — auto-resolving...' },
        { pct: 58,  tag: '[PROC]',   cls: '',            msg: 'Resolving schema conflicts via entropy filter...' },
        { pct: 65,  tag: '[REND]',   cls: '',            msg: 'Rendering PDF format — applying holographic layout...' },
        { pct: 73,  tag: '[COMP]',   cls: '',            msg: 'Compressing output to 4.2 MB — lossless mode...' },
        { pct: 80,  tag: '[CHECK]',  cls: '',            msg: 'Running integrity verification — 99.8% pass rate...' },
        { pct: 88,  tag: '[SIGN]',   cls: '',            msg: 'Applying cryptographic signature hash...' },
        { pct: 94,  tag: '[FINAL]',  cls: '',            msg: 'Finalising intelligence document package...' },
        { pct: 100, tag: '[DONE]',   cls: 'aex-log-ok',  msg: 'Document generated successfully — READY FOR EXPORT' },
    ];

    /* -- State -- */
    let overlayActive   = false;
    let animFrameId     = null;
    let particleRaf     = null;
    let aexParticles    = [];
    let footerInterval  = null;
    let waveRaf         = null;

    /* -- DOM refs (resolved at init time) -- */
    let overlay, panel, ringFill, ringPulse, pctEl, checkEl, checkLine,
        logBody, titleEl, subtitleEl, ctaEl, dlBtn, toast,
        waveLeft, waveRight, pcCanvas, pcCtx;

    /* -----------------------------------------
       INITIALISE
    ----------------------------------------- */
    function init() {
        overlay   = document.getElementById('ai-export-overlay');
        panel     = document.getElementById('aex-panel');
        ringFill  = document.getElementById('aex-ring-fill');
        ringPulse = document.getElementById('aex-ring-pulse');
        pctEl     = document.getElementById('aex-pct');
        checkEl   = document.getElementById('aex-check');
        checkLine = document.getElementById('aex-check-line');
        logBody   = document.getElementById('aex-log-body');
        titleEl   = document.getElementById('aex-title');
        subtitleEl= document.getElementById('aex-subtitle');
        ctaEl     = document.getElementById('aex-cta');
        dlBtn     = document.getElementById('aex-dl-btn');
        toast     = document.getElementById('aex-toast');
        waveLeft  = document.getElementById('aex-wave-left');
        waveRight = document.getElementById('aex-wave-right');
        pcCanvas  = document.getElementById('aex-particle-canvas');

        if (!overlay || !panel) return;

        if (pcCanvas) pcCtx = pcCanvas.getContext('2d');

        /* Bind trigger button */
        const triggerBtn = document.getElementById('download-intelligence-btn');
        if (triggerBtn) {
            triggerBtn.addEventListener('click', launchExportSequence);
        }

        /* Download button inside modal */
        if (dlBtn) {
            dlBtn.addEventListener('click', function(e) {
                addRippleEffect(dlBtn);
                triggerPDFDownload();
                setTimeout(closeOverlay, PANEL_EXIT_MS);
            });
        }

        /* Click overlay backdrop to cancel (only before completion) */
        overlay.addEventListener('click', function(e) {
            if (e.target === overlay && !overlayActive) return;
            /* Allow close only after complete */
            if (panel.classList.contains('aex-complete')) {
                closeOverlay();
            }
        });
    }

    /* -----------------------------------------
       LAUNCH SEQUENCE
    ----------------------------------------- */
    function launchExportSequence() {
        if (overlayActive) return;
        overlayActive = true;

        /* Reset state */
        resetUI();

        /* Show overlay */
        overlay.classList.add('aex-active');
        overlay.setAttribute('aria-hidden', 'false');

        /* Start particle engine */
        startPanelParticles();

        /* Animate footer stats */
        startFooterAnimation();

        /* Start wave animation */
        startWaveAnimation();

        /* Run the progress animation */
        animateProgress();
    }

    /* -----------------------------------------
       RESET
    ----------------------------------------- */
    function resetUI() {
        /* Ring */
        setRingProgress(0);
        if (pctEl) pctEl.textContent = '0';

        /* Check hidden */
        if (checkEl) checkEl.classList.remove('aex-visible');

        /* Title / subtitle */
        if (titleEl)    titleEl.textContent   = 'GENERATING INTELLIGENCE DOCUMENT';
        if (subtitleEl) subtitleEl.textContent = 'Compiling structured research output...';

        /* CTA hidden */
        if (ctaEl) ctaEl.classList.remove('aex-visible');
        if (ctaEl) ctaEl.setAttribute('aria-hidden', 'true');

        /* Clear logs */
        if (logBody) logBody.innerHTML = '';

        /* Remove complete state */
        if (panel) panel.classList.remove('aex-complete');

        /* Toast hidden */
        if (toast) toast.classList.remove('aex-toast-show');
    }

    /* -----------------------------------------
       PROGRESS ANIMATION
    ----------------------------------------- */
    function animateProgress() {
        const startTime   = performance.now();
        let   lastLogIdx  = -1;
        let   lastPct     = -1;

        function tick(now) {
            const elapsed = now - startTime;
            const rawPct  = Math.min(elapsed / TOTAL_DURATION_MS, 1);

            /* Eased progress — slow start, fast middle, slow finish */
            const eased = easeInOutCubic(rawPct);
            const pct   = Math.round(eased * 100);

            if (pct !== lastPct) {
                lastPct = pct;
                updateRing(pct);

                /* Drive wave intensity from progress */
                updateWaveIntensity(pct);
            }

            /* Dispatch log steps */
            for (let i = lastLogIdx + 1; i < LOG_STEPS.length; i++) {
                if (pct >= LOG_STEPS[i].pct) {
                    appendLog(LOG_STEPS[i]);
                    lastLogIdx = i;
                } else {
                    break;
                }
            }

            /* Update subtitle with live status hint */
            updateSubtitle(pct);

            if (rawPct < 1) {
                animFrameId = requestAnimationFrame(tick);
            } else {
                onComplete();
            }
        }

        animFrameId = requestAnimationFrame(tick);
    }

    function easeInOutCubic(t) {
        return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    }

    /* -----------------------------------------
       RING UPDATE
    ----------------------------------------- */
    const CIRCUMFERENCE = 2 * Math.PI * 84; // = 527.8

    function setRingProgress(pct) {
        if (!ringFill) return;
        const offset = CIRCUMFERENCE * (1 - pct / 100);
        ringFill.style.strokeDashoffset = offset;
    }

    function updateRing(pct) {
        setRingProgress(pct);
        if (pctEl) pctEl.textContent = pct;

        /* Brighten glow as it fills */
        if (ringFill) {
            const intensity = 0.12 + (pct / 100) * 0.28;
            panel.style.boxShadow = `0 0 ${40 + pct}px rgba(0,243,255,${intensity}), 0 0 ${80 + pct}px rgba(157,0,255,${intensity * 0.5}), inset 0 0 40px rgba(0,243,255,0.03)`;
        }
    }

    /* -----------------------------------------
       SUBTITLE CYCLING
    ----------------------------------------- */
    const SUBTITLES = [
        'Compiling structured research output...',
        'Initialising neural encoding...',
        'Mapping knowledge topology...',
        'Cross-referencing data vectors...',
        'Applying intelligence compression...',
        'Rendering holographic PDF layout...',
        'Verifying cryptographic signature...',
        'Finalising intelligence package...',
    ];
    let subtitleIdx = 0;
    let lastSubPct  = -10;

    function updateSubtitle(pct) {
        if (!subtitleEl) return;
        if (pct - lastSubPct >= 12) {
            lastSubPct = pct;
            subtitleEl.style.opacity = '0';
            setTimeout(() => {
                subtitleEl.textContent = SUBTITLES[subtitleIdx % SUBTITLES.length];
                subtitleEl.style.opacity = '1';
                subtitleIdx++;
            }, 180);
        }
        subtitleEl.style.transition = 'opacity 0.18s ease';
    }

    /* -----------------------------------------
       LOG APPEND
    ----------------------------------------- */
    function appendLog(step) {
        if (!logBody) return;
        const ts = new Date().toTimeString().slice(0, 8);
        const line = document.createElement('div');
        line.className = 'aex-log-line' + (step.cls ? ' ' + step.cls : '');
        line.innerHTML = `<span class="aex-log-ts">[${ts}]</span><span class="aex-log-tag">${step.tag}</span>${step.msg}`;
        logBody.appendChild(line);
        logBody.scrollTop = logBody.scrollHeight;
    }

    /* -----------------------------------------
       COMPLETION
    ----------------------------------------- */
    function onComplete() {
        panel.classList.add('aex-complete');

        /* Hide percentage, show check */
        if (pctEl) pctEl.style.opacity = '0';
        if (checkEl) {
            checkEl.classList.add('aex-visible');
            checkEl.setAttribute('aria-hidden', 'false');
        }

        /* Update title */
        if (titleEl) {
            titleEl.style.transition = 'opacity 0.3s ease';
            titleEl.style.opacity = '0';
            setTimeout(() => {
                titleEl.textContent = 'DOCUMENT READY';
                titleEl.style.background = 'linear-gradient(135deg, #00FF88 0%, #00F3FF 100%)';
                titleEl.style.webkitBackgroundClip = 'text';
                titleEl.style.backgroundClip = 'text';
                titleEl.style.webkitTextFillColor = 'transparent';
                titleEl.style.opacity = '1';
            }, 320);
        }
        if (subtitleEl) {
            subtitleEl.textContent = 'Intelligence document generated — ready for download.';
        }

        /* Wave max intensity */
        updateWaveIntensity(100);

        /* Show CTA */
        setTimeout(() => {
            if (ctaEl) {
                ctaEl.classList.add('aex-visible');
                ctaEl.removeAttribute('aria-hidden');
            }
            /* Auto-trigger download */
            triggerPDFDownload();
            /* Auto-close after delay */
            setTimeout(closeOverlay, PANEL_EXIT_MS + 1200);
        }, DOWNLOAD_DELAY_MS);
    }

    /* -----------------------------------------
       PDF DOWNLOAD TRIGGER
    ----------------------------------------- */
    function triggerPDFDownload() {
        /* Generate a minimal placeholder PDF as a data-URI blob */
        const pdfContent = `%PDF-1.4
1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj
2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj
3 0 obj<</Type/Page/MediaBox[0 0 612 792]/Parent 2 0 R/Resources<<>>>>endobj
xref
0 4
0000000000 65535 f
0000000009 00000 n
0000000058 00000 n
0000000115 00000 n
trailer<</Size 4/Root 1 0 R>>
startxref
216
%%EOF`;
        const blob = new Blob([pdfContent], { type: 'application/pdf' });
        const url  = URL.createObjectURL(blob);
        const a    = document.createElement('a');
        a.href     = url;
        a.download = 'ResearchX_Intelligence_Report.pdf';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(url), 2000);

        showToast();
    }

    /* -----------------------------------------
       CLOSE OVERLAY
    ----------------------------------------- */
    function closeOverlay() {
        if (!overlay) return;

        /* Fade panel out first */
        if (panel) {
            panel.style.transition = 'opacity 0.45s ease, transform 0.45s ease';
            panel.style.opacity = '0';
            panel.style.transform = 'scale(0.92) translateY(14px)';
        }

        setTimeout(() => {
            overlay.classList.remove('aex-active');
            overlay.setAttribute('aria-hidden', 'true');
            overlayActive = false;

            /* Restore panel */
            if (panel) {
                panel.style.opacity = '';
                panel.style.transform = '';
                panel.style.transition = '';
                panel.style.boxShadow = '';
            }

            /* Stop engines */
            stopPanelParticles();
            stopFooterAnimation();
            stopWaveAnimation();
            cancelAnimationFrame(animFrameId);
        }, 480);
    }

    /* -----------------------------------------
       TOAST
    ----------------------------------------- */
    function showToast() {
        if (!toast) return;
        toast.classList.add('aex-toast-show');
        setTimeout(() => toast.classList.remove('aex-toast-show'), TOAST_DURATION_MS);
    }

    /* -----------------------------------------
       RIPPLE ON BUTTON
    ----------------------------------------- */
    function addRippleEffect(btn) {
        const rippleEl = btn.querySelector('.aex-btn-ripple');
        if (!rippleEl) return;
        rippleEl.style.animation = 'none';
        rippleEl.getBoundingClientRect(); /* flush */
        rippleEl.style.animation = '';
    }

    /* -----------------------------------------
       PANEL PARTICLES (Canvas inside panel)
    ----------------------------------------- */
    function startPanelParticles() {
        if (!pcCanvas || !pcCtx) return;

        /* Size canvas to panel */
        resizePanelCanvas();

        aexParticles = [];
        const count = 38;
        for (let i = 0; i < count; i++) {
            aexParticles.push(createPanelParticle());
        }

        function drawLoop() {
            if (!overlayActive) return;
            pcCtx.clearRect(0, 0, pcCanvas.width, pcCanvas.height);
            aexParticles.forEach(p => {
                p.x += p.vx;
                p.y += p.vy;
                p.life -= p.decay;
                if (p.life <= 0 || p.x < 0 || p.x > pcCanvas.width || p.y < 0 || p.y > pcCanvas.height) {
                    Object.assign(p, createPanelParticle());
                }
                const alpha = p.life * p.opacity;
                pcCtx.globalAlpha = alpha;
                pcCtx.fillStyle   = p.color;
                pcCtx.shadowBlur  = 8;
                pcCtx.shadowColor = p.color;
                pcCtx.beginPath();
                pcCtx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                pcCtx.fill();
            });
            pcCtx.globalAlpha = 1;
            pcCtx.shadowBlur  = 0;
            particleRaf = requestAnimationFrame(drawLoop);
        }
        particleRaf = requestAnimationFrame(drawLoop);
    }

    function createPanelParticle() {
        const w = pcCanvas ? pcCanvas.width  : 680;
        const h = pcCanvas ? pcCanvas.height : 600;
        const colors = ['#00F3FF', '#9D00FF', '#00FF88', '#FFD700'];
        return {
            x:       Math.random() * w,
            y:       Math.random() * h,
            size:    Math.random() * 2.2 + 0.6,
            vx:      (Math.random() - 0.5) * 0.55,
            vy:      (Math.random() - 0.5) * 0.55,
            opacity: Math.random() * 0.6 + 0.2,
            life:    1,
            decay:   Math.random() * 0.004 + 0.001,
            color:   colors[Math.floor(Math.random() * colors.length)],
        };
    }

    function resizePanelCanvas() {
        if (!pcCanvas || !panel) return;
        const rect = panel.getBoundingClientRect();
        pcCanvas.width  = rect.width  || 680;
        pcCanvas.height = rect.height || 600;
    }

    function stopPanelParticles() {
        cancelAnimationFrame(particleRaf);
        if (pcCtx && pcCanvas) pcCtx.clearRect(0, 0, pcCanvas.width, pcCanvas.height);
        aexParticles = [];
    }

    /* -----------------------------------------
       FOOTER STATS ANIMATION
    ----------------------------------------- */
    function startFooterAnimation() {
        const latEl = document.getElementById('aex-lat-val');
        const tpEl  = document.getElementById('aex-tp-val');

        footerInterval = setInterval(() => {
            if (latEl) latEl.textContent = (Math.random() * 20 + 8).toFixed(0) + 'ms';
            if (tpEl)  tpEl.textContent  = (Math.random() * 1.5 + 1.8).toFixed(1) + ' GB/s';
        }, 1100);
    }
    function stopFooterAnimation() {
        clearInterval(footerInterval);
    }

    /* -----------------------------------------
       SOUND-WAVE VISUAL (reacts to progress %)
    ----------------------------------------- */
    let currentWaveIntensity = 0.15;
    let targetWaveIntensity  = 0.15;

    function startWaveAnimation() {
        function waveLoop() {
            if (!overlayActive) return;

            /* Smooth lerp toward target */
            currentWaveIntensity += (targetWaveIntensity - currentWaveIntensity) * 0.08;

            /* Drive each bar in both wave groups */
            [waveLeft, waveRight].forEach((wrap, side) => {
                if (!wrap) return;
                const spans = wrap.querySelectorAll('span');
                spans.forEach((span, i) => {
                    /* Individual bar oscillation */
                    const t    = performance.now() / 1000;
                    const freq = 1.4 + i * 0.3;
                    const wave = (Math.sin(t * freq + i * 0.8 + side * Math.PI) + 1) / 2;
                    const h    = 10 + wave * currentWaveIntensity * 90; /* 10%–100% of height */
                    span.style.height = h + '%';
                });
            });

            waveRaf = requestAnimationFrame(waveLoop);
        }
        waveRaf = requestAnimationFrame(waveLoop);
    }

    function updateWaveIntensity(pct) {
        /* Maps 0?100% progress to 0.15?1.0 wave intensity */
        targetWaveIntensity = 0.15 + (pct / 100) * 0.85;
    }

    function stopWaveAnimation() {
        cancelAnimationFrame(waveRaf);
        /* Reset bars */
        [waveLeft, waveRight].forEach(wrap => {
            if (!wrap) return;
            wrap.querySelectorAll('span').forEach(s => s.style.height = '10%');
        });
    }

    /* -----------------------------------------
       BOOT
    ----------------------------------------- */
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();

/* -----------------------------------------------------------
   DEEP DIVE NEURAL REDIRECT
   ----------------------------------------------------------- */
document.addEventListener('DOMContentLoaded', () => {
    const askBtn = document.getElementById('deep-dive-ask-btn');
    const questionInput = document.getElementById('deep-dive-question');
    
    if (askBtn) {
        askBtn.addEventListener('click', (e) => {
            e.preventDefault();
            const q = questionInput && questionInput.value ? questionInput.value.trim() : '';
            if (q) {
                window.location.href = `neural-intel.html?q=${encodeURIComponent(q)}`;
            } else {
                window.location.href = 'neural-intel.html';
            }
        });
    }
    
    if (questionInput) {
        questionInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                askBtn.click();
            }
        });
    }
});




