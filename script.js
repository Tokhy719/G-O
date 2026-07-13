// ==========================================
// 1. Three.js - 3D Envelope Setup
// ==========================================
let scene, camera, renderer, envelopeGroup, flap, card;
let isEnvelopeOpen = false;
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

function initThreeJS() {
    const container = document.getElementById('three-container');
    
    // Scene
    scene = new THREE.Scene();
    
    // Camera
    camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 0, 12);
    
    // Renderer
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    container.appendChild(renderer.domElement);

    // Lighting for Luxurious Look
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0xfff0d4, 1); // Warm Gold
    dirLight1.position.set(5, 5, 5);
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0xffffff, 0.5); // Cool White
    dirLight2.position.set(-5, -5, 5);
    scene.add(dirLight2);

    // Envelope Group
    envelopeGroup = new THREE.Group();
    scene.add(envelopeGroup);

    // Materials
    const whiteMat = new THREE.MeshStandardMaterial({ 
        color: 0xffffff, 
        roughness: 0.3, 
        metalness: 0.1,
        side: THREE.DoubleSide 
    });
    
    const goldMat = new THREE.MeshStandardMaterial({ 
        color: 0xD4AF37, 
        roughness: 0.2, 
        metalness: 0.8,
        side: THREE.DoubleSide 
    });

    // Envelope Back
    const backGeo = new THREE.PlaneGeometry(6, 4);
    const back = new THREE.Mesh(backGeo, whiteMat);
    back.position.z = -0.1;
    envelopeGroup.add(back);

    // Envelope Front
    const frontGeo = new THREE.PlaneGeometry(6, 4);
    const front = new THREE.Mesh(frontGeo, whiteMat);
    front.position.z = 0.1;
    envelopeGroup.add(front);

    // Envelope Flap (Triangle)
    const flapShape = new THREE.Shape();
    flapShape.moveTo(-3, 0);
    flapShape.lineTo(3, 0);
    flapShape.lineTo(0, -2.5);
    flapShape.lineTo(-3, 0);
    
    const flapGeo = new THREE.ShapeGeometry(flapShape);
    // Shift geometry so the top edge (Y=0) becomes the pivot point
    flapGeo.translate(0, 1.25, 0); 
    
    flap = new THREE.Mesh(flapGeo, goldMat);
    flap.position.set(0, 2, 0.15); // Position at top of envelope
    envelopeGroup.add(flap);

    // Invitation Card (Inside)
    const cardGeo = new THREE.PlaneGeometry(5.5, 3.5);
    const cardMat = new THREE.MeshStandardMaterial({ 
        color: 0xFFDF73, // Soft Gold/White
        roughness: 0.4, 
        metalness: 0.3,
        side: THREE.DoubleSide 
    });
    card = new THREE.Mesh(cardGeo, cardMat);
    card.position.set(0, -0.5, 0); // Start inside the envelope
    envelopeGroup.add(card);

    // Add a subtle rotation to the envelope for 3D effect
    envelopeGroup.rotation.x = 0.1;
    envelopeGroup.rotation.y = -0.1;

    // Event Listeners
    window.addEventListener('resize', onWindowResize);
    renderer.domElement.addEventListener('click', onMouseClick);
    renderer.domElement.addEventListener('touchstart', onTouchStart, { passive: false });

    animate();
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function getMouseCoords(event) {
    const x = (event.clientX / window.innerWidth) * 2 - 1;
    const y = -(event.clientY / window.innerHeight) * 2 + 1;
    mouse.set(x, y);
}

function onMouseClick(event) {
    if (isEnvelopeOpen) return;
    getMouseCoords(event);
    checkIntersection();
}

function onTouchStart(event) {
    if (isEnvelopeOpen) return;
    if (event.touches.length > 0) {
        const touch = event.touches[0];
        const x = (touch.clientX / window.innerWidth) * 2 - 1;
        const y = -(touch.clientY / window.innerHeight) * 2 + 1;
        mouse.set(x, y);
        checkIntersection();
    }
}

function checkIntersection() {
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(envelopeGroup.children);
    
    if (intersects.length > 0) {
        openEnvelope();
    }
}

function openEnvelope() {
    isEnvelopeOpen = true;
    document.getElementById('click-hint').style.display = 'none';

    // Play music automatically when envelope opens
    const audio = document.getElementById('bg-music');
    const btn = document.getElementById('music-toggle');
    const playIcon = document.getElementById('play-icon');
    const pauseIcon = document.getElementById('pause-icon');
    
    audio.play().then(() => {
        playIcon.style.display = 'none';
        pauseIcon.style.display = 'block';
        btn.classList.add('playing');
    }).catch(e => console.log("Audio autoplay prevented:", e));

    // GSAP Cinematic Animation
    const tl = gsap.timeline();

    // 1. Open Flap
    tl.to(flap.rotation, {
        x: -Math.PI,
        duration: 1.5,
        ease: "power2.inOut"
    });

    // 2. Slide Card Out
    tl.to(card.position, {
        y: 4,
        z: 2,
        duration: 2,
        ease: "power3.out"
    }, "-=0.5");

    // 3. Move Camera back slightly and fade out 3D scene
    tl.to(camera.position, {
        z: 15,
        duration: 2,
        ease: "power1.inOut"
    }, "-=1.5");

    tl.to('#three-container', {
        opacity: 0,
        duration: 1.5,
        ease: "power2.in",
        onComplete: () => {
            document.getElementById('three-container').style.pointerEvents = 'none';
        }
    }, "-=1");

    // 4. Reveal Main Content
    tl.to('#main-content', {
        opacity: 1,
        visibility: 'visible',
        duration: 1.5,
        ease: "power2.out"
    }, "-=1");
    
    // Animate cards appearing one by one
    tl.from('.glass-card', {
        y: 50,
        opacity: 0,
        duration: 1,
        stagger: 0.2,
        ease: "power2.out"
    }, "-=1");
}

function animate() {
    requestAnimationFrame(animate);
    
    // Subtle floating effect for the envelope before opening
    if (!isEnvelopeOpen) {
        envelopeGroup.position.y = Math.sin(Date.now() * 0.001) * 0.2;
        envelopeGroup.rotation.y = -0.1 + Math.sin(Date.now() * 0.0005) * 0.05;
    }

    renderer.render(scene, camera);
}

// ==========================================
// 2. Particles (Roses & Sparkles)
// ==========================================
const particlesCanvas = document.getElementById('particles-canvas');
const pCtx = particlesCanvas.getContext('2d');
let particles = [];

function resizeParticlesCanvas() {
    particlesCanvas.width = window.innerWidth;
    particlesCanvas.height = window.innerHeight;
}

class Particle {
    constructor(type) {
        this.type = type; // 'rose' or 'sparkle'
        this.reset();
        this.y = Math.random() * particlesCanvas.height; // Start at random Y initially
    }

    reset() {
        this.x = Math.random() * particlesCanvas.width;
        this.y = -20;
        this.size = Math.random() * 10 + 5;
        this.speedY = Math.random() * 1.5 + 0.5;
        this.speedX = Math.random() * 1 - 0.5;
        this.rotation = Math.random() * Math.PI * 2;
        this.rotationSpeed = Math.random() * 0.02 - 0.01;
        this.opacity = Math.random() * 0.5 + 0.5;
        
        if (this.type === 'sparkle') {
            this.size = Math.random() * 3 + 1;
            this.twinkleSpeed = Math.random() * 0.05 + 0.02;
            this.twinklePhase = Math.random() * Math.PI * 2;
        }
    }

    update() {
        this.y += this.speedY;
        this.x += this.speedX;
        this.rotation += this.rotationSpeed;

        if (this.type === 'sparkle') {
            this.twinklePhase += this.twinkleSpeed;
            this.opacity = 0.3 + Math.abs(Math.sin(this.twinklePhase)) * 0.7;
        }

        if (this.y > particlesCanvas.height + 20) {
            this.reset();
        }
    }

    draw() {
        pCtx.save();
        pCtx.translate(this.x, this.y);
        pCtx.rotate(this.rotation);
        pCtx.globalAlpha = this.opacity;

        if (this.type === 'rose') {
            // Draw a simple rose petal shape
            pCtx.fillStyle = `hsl(${340 + Math.random() * 20}, 70%, ${60 + Math.random() * 20}%)`;
            pCtx.beginPath();
            pCtx.moveTo(0, -this.size);
            pCtx.bezierCurveTo(this.size, -this.size, this.size, this.size, 0, this.size);
            pCtx.bezierCurveTo(-this.size, this.size, -this.size, -this.size, 0, -this.size);
            pCtx.fill();
        } else {
            // Draw sparkle
            pCtx.fillStyle = '#D4AF37';
            pCtx.shadowBlur = 10;
            pCtx.shadowColor = '#FFD700';
            pCtx.beginPath();
            pCtx.arc(0, 0, this.size, 0, Math.PI * 2);
            pCtx.fill();
        }
        
        pCtx.restore();
    }
}

function initParticles() {
    resizeParticlesCanvas();
    window.addEventListener('resize', resizeParticlesCanvas);

    // Create 40 roses and 60 sparkles
    for (let i = 0; i < 40; i++) particles.push(new Particle('rose'));
    for (let i = 0; i < 60; i++) particles.push(new Particle('sparkle'));

    animateParticles();
}

function animateParticles() {
    pCtx.clearRect(0, 0, particlesCanvas.width, particlesCanvas.height);
    particles.forEach(p => {
        p.update();
        p.draw();
    });
    requestAnimationFrame(animateParticles);
}

// ==========================================
// 3. Fireworks at the bottom
// ==========================================
const fwCanvas = document.getElementById('fireworks-canvas');
const fwCtx = fwCanvas.getContext('2d');
let fireworks = [];
let fwParticles = [];
let fwActive = false;

function resizeFwCanvas() {
    const section = document.getElementById('fireworks-section');
    fwCanvas.width = section.clientWidth;
    fwCanvas.height = section.clientHeight;
}

class Firework {
    constructor() {
        this.x = Math.random() * fwCanvas.width;
        this.y = fwCanvas.height;
        this.targetY = Math.random() * (fwCanvas.height * 0.5) + 50;
        this.speed = Math.random() * 3 + 4;
        this.angle = Math.atan2(this.targetY - this.y, 0); // Straight up mostly
        this.hue = Math.random() * 60 + 30; // Gold/Yellow hues
        this.alive = true;
    }

    update() {
        this.y -= this.speed;
        if (this.y <= this.targetY) {
            this.explode();
            this.alive = false;
        }
    }

    explode() {
        const particleCount = 60;
        for (let i = 0; i < particleCount; i++) {
            fwParticles.push(new FwParticle(this.x, this.y, this.hue));
        }
    }

    draw() {
        fwCtx.beginPath();
        fwCtx.arc(this.x, this.y, 2, 0, Math.PI * 2);
        fwCtx.fillStyle = `hsl(${this.hue}, 100%, 70%)`;
        fwCtx.fill();
    }
}

class FwParticle {
    constructor(x, y, hue) {
        this.x = x;
        this.y = y;
        this.hue = hue;
        this.angle = Math.random() * Math.PI * 2;
        this.speed = Math.random() * 5 + 1;
        this.friction = 0.95;
        this.gravity = 0.05;
        this.opacity = 1;
        this.decay = Math.random() * 0.015 + 0.005;
    }

    update() {
        this.speed *= this.friction;
        this.x += Math.cos(this.angle) * this.speed;
        this.y += Math.sin(this.angle) * this.speed + this.gravity;
        this.opacity -= this.decay;
    }

    draw() {
        fwCtx.save();
        fwCtx.globalAlpha = Math.max(this.opacity, 0);
        fwCtx.beginPath();
        fwCtx.arc(this.x, this.y, 1.5, 0, Math.PI * 2);
        fwCtx.fillStyle = `hsl(${this.hue}, 100%, 60%)`;
        fwCtx.shadowBlur = 5;
        fwCtx.shadowColor = `hsl(${this.hue}, 100%, 50%)`;
        fwCtx.fill();
        fwCtx.restore();
    }
}

function animateFireworks() {
    if (!fwActive) return;
    
    fwCtx.fillStyle = 'rgba(253, 251, 247, 0.2)'; // Trail effect
    fwCtx.fillRect(0, 0, fwCanvas.width, fwCanvas.height);

    // Launch new fireworks occasionally
    if (Math.random() < 0.03) {
        fireworks.push(new Firework());
    }

    fireworks = fireworks.filter(f => {
        f.update();
        f.draw();
        return f.alive;
    });

    fwParticles = fwParticles.filter(p => {
        p.update();
        p.draw();
        return p.opacity > 0;
    });

    requestAnimationFrame(animateFireworks);
}

// Trigger fireworks when scrolled to the bottom section
function initFireworksObserver() {
    resizeFwCanvas();
    window.addEventListener('resize', resizeFwCanvas);

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting && !fwActive) {
                fwActive = true;
                animateFireworks();
            } else if (!entry.isIntersecting && fwActive) {
                fwActive = false;
            }
        });
    }, { threshold: 0.1 });

    observer.observe(document.getElementById('fireworks-section'));
}

// ==========================================
// 4. Countdown Timer
// ==========================================
function initCountdown() {
    // Target: Friday, August 14, 2026 at 8:00 PM
    const targetDate = new Date('2026-08-14T20:00:00').getTime();
    
    const daysEl = document.getElementById('days');
    const hoursEl = document.getElementById('hours');
    const minutesEl = document.getElementById('minutes');
    const secondsEl = document.getElementById('seconds');

    function update() {
        const now = new Date().getTime();
        const distance = targetDate - now;

        if (distance < 0) {
            daysEl.textContent = '00';
            hoursEl.textContent = '00';
            minutesEl.textContent = '00';
            secondsEl.textContent = '00';
            return;
        }

        const days = Math.floor(distance / (1000 * 60 * 60 * 24));
        const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((distance % (1000 * 60)) / 1000);

        daysEl.textContent = days.toString().padStart(2, '0');
        hoursEl.textContent = hours.toString().padStart(2, '0');
        minutesEl.textContent = minutes.toString().padStart(2, '0');
        secondsEl.textContent = seconds.toString().padStart(2, '0');
    }

    update();
    setInterval(update, 1000);
}

// ==========================================
// 5. Music Player
// ==========================================
function initMusic() {
    const audio = document.getElementById('bg-music');
    const btn = document.getElementById('music-toggle');
    const playIcon = document.getElementById('play-icon');
    const pauseIcon = document.getElementById('pause-icon');
    let isPlaying = false;

    btn.addEventListener('click', () => {
        if (isPlaying) {
            audio.pause();
            playIcon.style.display = 'block';
            pauseIcon.style.display = 'none';
            btn.classList.remove('playing');
        } else {
            audio.play().catch(e => console.log("Audio play failed:", e));
            playIcon.style.display = 'none';
            pauseIcon.style.display = 'block';
            btn.classList.add('playing');
        }
        isPlaying = !isPlaying;
    });
}

// ==========================================
// Initialize Everything
// ==========================================
window.addEventListener('DOMContentLoaded', () => {
    initThreeJS();
    initParticles();
    initCountdown();
    initMusic();
    initFireworksObserver();
});
