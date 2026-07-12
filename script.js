/*
 * Wedding-Invitation
 * تفاعلات الموقع كاملة: ظرف Three.js، حركات GSAP، الموسيقى، العداد، البتلات والألعاب النارية.
 */

(() => {
    'use strict';

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const hasGSAP = typeof window.gsap !== 'undefined';
    const hasThree = typeof window.THREE !== 'undefined';

    const elements = {
        body: document.body,
        envelopeStage: document.getElementById('envelopeStage'),
        envelopeCanvas: document.getElementById('envelopeCanvas'),
        envelopeFallback: document.getElementById('envelopeFallback'),
        envelopeHint: document.getElementById('envelopeHint'),
        openButton: document.getElementById('openInvitationButton'),
        invitationContent: document.getElementById('invitationContent'),
        sparkleField: document.getElementById('sparkleField'),
        petalField: document.getElementById('petalField'),
        musicButton: document.getElementById('musicButton'),
        musicAudio: document.getElementById('weddingAudio'),
        audioFileInput: document.getElementById('audioFileInput'),
        audioStatus: document.getElementById('audioStatus'),
        fireworksSection: document.getElementById('fireworksSection'),
        fireworksCanvas: document.getElementById('fireworksCanvas'),
        countdownNote: document.getElementById('countdownNote')
    };

    let invitationOpened = false;
    let selectedAudioUrl = null;
    let threeScene = null;
    let fireworksStarted = false;

    /*
     * التاريخ مضبوط على 14 أغسطس 2026، وهو يوم جمعة.
     * يمكن تغيير التاريخ بسهولة من هذا السطر إذا كانت الدعوة لسنة أخرى.
     */
    const WEDDING_DATE = new Date('2026-08-14T00:00:00+03:00').getTime();

    const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

    function animate(target, vars) {
        if (hasGSAP) {
            return window.gsap.to(target, vars);
        }

        const duration = Math.max((vars.duration || 0.5) * 1000, 0);
        const delay = Math.max((vars.delay || 0) * 1000, 0);
        window.setTimeout(() => {
            Object.entries(vars).forEach(([property, value]) => {
                if (!['duration', 'delay', 'ease', 'onComplete', 'repeat', 'yoyo', 'repeatDelay'].includes(property)) {
                    if (target && target.style && typeof value === 'string') {
                        target.style[property] = value;
                    }
                }
            });
            if (typeof vars.onComplete === 'function') {
                vars.onComplete();
            }
        }, delay + duration);
        return null;
    }

    function setInitialAnimations() {
        if (!hasGSAP || prefersReducedMotion) {
            return;
        }

        window.gsap.from('.topbar', {
            y: -22,
            opacity: 0,
            duration: 1,
            ease: 'power3.out'
        });

        window.gsap.from('.hero-copy > *, .envelope-hint, .gold-button--hero', {
            y: 22,
            opacity: 0,
            duration: 0.85,
            stagger: 0.11,
            delay: 0.18,
            ease: 'power3.out'
        });

        window.gsap.to('.envelope-stage__halo', {
            scale: 1.12,
            opacity: 0.74,
            duration: 2.5,
            repeat: -1,
            yoyo: true,
            ease: 'sine.inOut'
        });

        window.gsap.to('.envelope-stage__rings', {
            rotation: 1,
            scale: 1.025,
            duration: 4.8,
            repeat: -1,
            yoyo: true,
            ease: 'sine.inOut'
        });
    }

    function createSparkles() {
        if (!elements.sparkleField) {
            return;
        }

        const count = window.innerWidth < 600 ? 22 : 38;
        const fragment = document.createDocumentFragment();

        for (let index = 0; index < count; index += 1) {
            const sparkle = document.createElement('span');
            sparkle.className = 'sparkle';
            sparkle.style.left = `${Math.random() * 100}%`;
            sparkle.style.top = `${Math.random() * 100}%`;
            sparkle.style.setProperty('--sparkle-size', `${Math.round(3 + Math.random() * 8)}px`);
            fragment.appendChild(sparkle);
        }

        elements.sparkleField.appendChild(fragment);
        const sparkles = elements.sparkleField.querySelectorAll('.sparkle');

        if (!hasGSAP || prefersReducedMotion) {
            sparkles.forEach((sparkle, index) => {
                sparkle.style.opacity = index % 3 === 0 ? '0.65' : '0.28';
                sparkle.style.transform = 'rotate(45deg) scale(0.75)';
            });
            return;
        }

        sparkles.forEach((sparkle, index) => {
            window.gsap.to(sparkle, {
                opacity: 0.2 + Math.random() * 0.8,
                scale: 0.6 + Math.random() * 0.9,
                rotation: 45 + Math.random() * 90,
                duration: 1.15 + Math.random() * 2.2,
                delay: Math.random() * 2.5 + index * 0.035,
                repeat: -1,
                yoyo: true,
                ease: 'sine.inOut'
            });
        });
    }

    function createFallingPetals() {
        if (!elements.petalField) {
            return;
        }

        const count = window.innerWidth < 600 ? 13 : 22;
        const fragment = document.createDocumentFragment();

        for (let index = 0; index < count; index += 1) {
            const petal = document.createElement('span');
            petal.className = 'petal';
            petal.style.setProperty('--left', `${Math.random() * 100}%`);
            petal.style.setProperty('--petal-width', `${7 + Math.random() * 8}px`);
            petal.style.setProperty('--petal-height', `${10 + Math.random() * 12}px`);
            petal.style.setProperty('--petal-opacity', `${0.27 + Math.random() * 0.43}`);
            petal.style.setProperty('--rotation', `${Math.random() * 360}deg`);
            fragment.appendChild(petal);
        }

        elements.petalField.appendChild(fragment);
        const petals = elements.petalField.querySelectorAll('.petal');

        if (!hasGSAP || prefersReducedMotion) {
            petals.forEach((petal) => {
                petal.style.display = 'none';
            });
            return;
        }

        petals.forEach((petal, index) => {
            const drift = (Math.random() - 0.5) * 230;
            const duration = 8 + Math.random() * 9;
            window.gsap.fromTo(petal,
                {
                    y: `${-12 - Math.random() * 10}vh`,
                    x: 0,
                    rotation: Number.parseFloat(petal.style.getPropertyValue('--rotation')) || 0
                },
                {
                    y: `${window.innerHeight + 140}px`,
                    x: drift,
                    rotation: `+=${180 + Math.random() * 360}`,
                    duration,
                    delay: Math.random() * 8 + index * 0.2,
                    repeat: -1,
                    ease: 'none',
                    onRepeat() {
                        window.gsap.set(petal, {
                            x: 0,
                            y: `${-12 - Math.random() * 15}vh`
                        });
                    }
                }
            );
        });
    }

    function createHeartShape() {
        const shape = new window.THREE.Shape();
        shape.moveTo(0, -0.22);
        shape.bezierCurveTo(-0.53, -0.72, -0.95, -0.08, 0, 0.74);
        shape.bezierCurveTo(0.95, -0.08, 0.53, -0.72, 0, -0.22);
        return shape;
    }

    function createThreeEnvelope() {
        if (!elements.envelopeCanvas) {
            return null;
        }

        if (!hasThree) {
            document.documentElement.classList.add('no-webgl');
            if (elements.envelopeFallback) {
                elements.envelopeFallback.setAttribute('aria-hidden', 'false');
            }
            return null;
        }

        try {
            const THREE = window.THREE;
            const host = elements.envelopeCanvas;
            const scene = new THREE.Scene();
            const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 100);
            const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'high-performance' });
            const envelope = new THREE.Group();
            const flapPivot = new THREE.Group();
            const insertCard = new THREE.Group();
            const pointer = { x: 0, y: 0 };

            renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
            renderer.setClearColor(0x000000, 0);
            renderer.shadowMap.enabled = true;
            renderer.shadowMap.type = THREE.PCFSoftShadowMap;
            host.appendChild(renderer.domElement);

            camera.position.set(0, 0.1, 8.7);
            camera.lookAt(0, 0, 0);

            scene.add(new THREE.HemisphereLight(0xfff9eb, 0xa77c51, 2.4));

            const keyLight = new THREE.DirectionalLight(0xfff4d3, 3.7);
            keyLight.position.set(-4, 6, 7);
            keyLight.castShadow = true;
            scene.add(keyLight);

            const rimLight = new THREE.PointLight(0xd9aa58, 2.3, 12);
            rimLight.position.set(4, -1, 4);
            scene.add(rimLight);

            const paperMaterial = new THREE.MeshPhysicalMaterial({
                color: 0xfffdf8,
                roughness: 0.26,
                metalness: 0.02,
                clearcoat: 0.45,
                clearcoatRoughness: 0.2,
                side: THREE.DoubleSide
            });
            const innerMaterial = new THREE.MeshPhysicalMaterial({
                color: 0xf7edda,
                roughness: 0.41,
                metalness: 0.01,
                side: THREE.DoubleSide
            });
            const goldMaterial = new THREE.MeshPhysicalMaterial({
                color: 0xc79a50,
                roughness: 0.2,
                metalness: 0.72,
                clearcoat: 0.5,
                side: THREE.DoubleSide
            });
            const cardMaterial = new THREE.MeshPhysicalMaterial({
                color: 0xfffcf4,
                roughness: 0.3,
                metalness: 0.01,
                clearcoat: 0.25,
                side: THREE.DoubleSide
            });

            const bodyGeometry = new THREE.BoxGeometry(4.8, 2.86, 0.15);
            const body = new THREE.Mesh(bodyGeometry, paperMaterial);
            body.castShadow = true;
            body.receiveShadow = true;
            envelope.add(body);

            const insideGeometry = new THREE.PlaneGeometry(4.48, 2.56);
            const inside = new THREE.Mesh(insideGeometry, innerMaterial);
            inside.position.set(0, 0.02, -0.09);
            envelope.add(inside);

            const edgeGeometry = new THREE.EdgesGeometry(bodyGeometry);
            const edgeLines = new THREE.LineSegments(
                edgeGeometry,
                new THREE.LineBasicMaterial({ color: 0xc79a50, transparent: true, opacity: 0.53 })
            );
            envelope.add(edgeLines);

            const flapShape = new THREE.Shape();
            flapShape.moveTo(-2.38, 0);
            flapShape.lineTo(2.38, 0);
            flapShape.lineTo(0, -2.3);
            flapShape.lineTo(-2.38, 0);
            const flap = new THREE.Mesh(new THREE.ShapeGeometry(flapShape), paperMaterial);
            flap.position.z = 0.19;
            flapPivot.position.set(0, 1.43, 0.05);
            flapPivot.add(flap);
            envelope.add(flapPivot);

            const flapEdge = new THREE.LineLoop(
                new THREE.BufferGeometry().setFromPoints([
                    new THREE.Vector3(-2.38, 0, 0.012),
                    new THREE.Vector3(2.38, 0, 0.012),
                    new THREE.Vector3(0, -2.3, 0.012)
                ]),
                new THREE.LineBasicMaterial({ color: 0xc79a50, transparent: true, opacity: 0.44 })
            );
            flap.add(flapEdge);

            const diagonalLines = new THREE.LineSegments(
                new THREE.BufferGeometry().setAttribute('position', new THREE.Float32BufferAttribute([
                    -2.39, -1.42, 0.11, 0, 0.08, 0.11,
                    2.39, -1.42, 0.11, 0, 0.08, 0.11
                ], 3)),
                new THREE.LineBasicMaterial({ color: 0xc79a50, transparent: true, opacity: 0.55 })
            );
            envelope.add(diagonalLines);

            const seal = new THREE.Mesh(new THREE.CircleGeometry(0.42, 48), goldMaterial);
            seal.position.set(0, -0.02, 0.29);
            envelope.add(seal);

            const sealRing = new THREE.Mesh(
                new THREE.RingGeometry(0.32, 0.37, 48),
                new THREE.MeshBasicMaterial({ color: 0xffe4a9, transparent: true, opacity: 0.85, side: THREE.DoubleSide })
            );
            sealRing.position.set(0, -0.02, 0.3);
            envelope.add(sealRing);

            const heart = new THREE.Mesh(new THREE.ShapeGeometry(createHeartShape()), new THREE.MeshBasicMaterial({ color: 0xfff0c4, side: THREE.DoubleSide }));
            heart.scale.set(0.25, 0.25, 0.25);
            heart.position.set(0, -0.14, 0.31);
            envelope.add(heart);

            const cardBody = new THREE.Mesh(new THREE.BoxGeometry(3.56, 2.16, 0.055), cardMaterial);
            cardBody.castShadow = true;
            cardBody.position.set(0, -0.08, -0.02);
            insertCard.add(cardBody);

            const cardBorder = new THREE.LineSegments(
                new THREE.EdgesGeometry(new THREE.BoxGeometry(3.56, 2.16, 0.055)),
                new THREE.LineBasicMaterial({ color: 0xc79a50, transparent: true, opacity: 0.52 })
            );
            cardBorder.position.copy(cardBody.position);
            insertCard.add(cardBorder);

            const miniGoldLine = new THREE.Mesh(
                new THREE.PlaneGeometry(1.42, 0.025),
                new THREE.MeshBasicMaterial({ color: 0xc79a50, side: THREE.DoubleSide })
            );
            miniGoldLine.position.set(0, 0.32, 0.04);
            insertCard.add(miniGoldLine);

            const miniHeart = new THREE.Mesh(new THREE.ShapeGeometry(createHeartShape()), new THREE.MeshBasicMaterial({ color: 0xd9a4a0, side: THREE.DoubleSide }));
            miniHeart.scale.set(0.13, 0.13, 0.13);
            miniHeart.position.set(0, 0.03, 0.05);
            insertCard.add(miniHeart);
            envelope.add(insertCard);

            const shadowPlane = new THREE.Mesh(
                new THREE.CircleGeometry(2.3, 64),
                new THREE.MeshBasicMaterial({ color: 0xa77936, transparent: true, opacity: 0.11, depthWrite: false })
            );
            shadowPlane.scale.set(1.55, 0.47, 1);
            shadowPlane.position.set(0, -1.92, -0.3);
            envelope.add(shadowPlane);

            envelope.rotation.set(-0.08, 0.03, 0);
            envelope.position.y = -0.18;
            scene.add(envelope);

            const particleGeometry = new THREE.BufferGeometry();
            const particlePositions = [];
            for (let index = 0; index < 72; index += 1) {
                particlePositions.push((Math.random() - 0.5) * 6.5, (Math.random() - 0.5) * 4.3, (Math.random() - 0.5) * 1.5);
            }
            particleGeometry.setAttribute('position', new THREE.Float32BufferAttribute(particlePositions, 3));
            const particles = new THREE.Points(
                particleGeometry,
                new THREE.PointsMaterial({ color: 0xe2bb6c, size: 0.025, transparent: true, opacity: 0.7, sizeAttenuation: true })
            );
            scene.add(particles);

            function resize() {
                const width = Math.max(host.clientWidth, 1);
                const height = Math.max(host.clientHeight, 1);
                renderer.setSize(width, height, false);
                camera.aspect = width / height;
                camera.updateProjectionMatrix();
            }

            function render() {
                envelope.rotation.y += (pointer.x * 0.12 - envelope.rotation.y) * 0.035;
                envelope.rotation.x += (-0.08 - pointer.y * 0.05 - envelope.rotation.x) * 0.035;
                particles.rotation.y += 0.0008;
                particles.rotation.x = Math.sin(Date.now() * 0.00025) * 0.04;
                renderer.render(scene, camera);
                window.requestAnimationFrame(render);
            }

            function updatePointer(event) {
                const rect = host.getBoundingClientRect();
                const point = event.touches ? event.touches[0] : event;
                pointer.x = clamp(((point.clientX - rect.left) / rect.width) * 2 - 1, -1, 1);
                pointer.y = clamp(((point.clientY - rect.top) / rect.height) * 2 - 1, -1, 1);
            }

            host.addEventListener('pointermove', updatePointer, { passive: true });
            host.addEventListener('pointerleave', () => {
                pointer.x = 0;
                pointer.y = 0;
            });
            window.addEventListener('resize', resize, { passive: true });
            resize();
            render();

            threeScene = {
                envelope,
                flapPivot,
                insertCard,
                renderer,
                cardStartY: insertCard.position.y
            };
            return threeScene;
        } catch (error) {
            console.warn('Three.js could not initialize. The CSS envelope fallback is active.', error);
            document.documentElement.classList.add('no-webgl');
            if (elements.envelopeFallback) {
                elements.envelopeFallback.setAttribute('aria-hidden', 'false');
            }
            return null;
        }
    }

    function openInvitation() {
        if (invitationOpened) {
            return;
        }

        invitationOpened = true;
        elements.body.classList.add('invitation-is-open');
        elements.openButton.disabled = true;
        elements.openButton.setAttribute('aria-label', 'تم فتح الدعوة');
        elements.invitationContent.setAttribute('aria-hidden', 'false');
        elements.envelopeCanvas.setAttribute('aria-label', 'تم فتح ظرف الدعوة');

        if (hasGSAP && !prefersReducedMotion) {
            const timeline = window.gsap.timeline();
            timeline
                .to(elements.envelopeHint, { opacity: 0, y: -10, duration: 0.28, ease: 'power2.in' })
                .to(elements.openButton, { opacity: 0, y: 10, duration: 0.25, ease: 'power2.in' }, '<')
                .to('.envelope-stage__rings', { opacity: 0.18, scale: 1.18, duration: 0.8, ease: 'power2.out' }, '-=0.05');

            if (threeScene) {
                timeline
                    .to(threeScene.flapPivot.rotation, { x: -Math.PI * 0.94, duration: 1.25, ease: 'power3.inOut' }, '-=0.38')
                    .to(threeScene.insertCard.position, { y: 2.38, z: 0.8, duration: 1.55, ease: 'power3.out' }, '-=0.93')
                    .to(threeScene.insertCard.rotation, { z: -0.035, x: -0.04, duration: 1.35, ease: 'power2.out' }, '<')
                    .to(threeScene.envelope.rotation, { y: 0.08, z: -0.035, duration: 1.3, ease: 'power2.out' }, '<');
            } else {
                timeline.to('.fallback-envelope__flap', { rotationX: -170, duration: 1.1, ease: 'power3.inOut' }, '-=0.32');
            }

            timeline.to('.invitation-section', { backgroundColor: 'rgba(255, 253, 249, 0.92)', duration: 0.8 }, '-=0.3');
        } else {
            document.documentElement.classList.add('invitation-open-no-motion');
            if (threeScene) {
                threeScene.flapPivot.rotation.x = -Math.PI * 0.94;
                threeScene.insertCard.position.y = 2.38;
                threeScene.insertCard.position.z = 0.8;
            }
        }

        window.setTimeout(() => {
            elements.invitationContent.scrollIntoView({ behavior: prefersReducedMotion ? 'auto' : 'smooth', block: 'start' });
        }, prefersReducedMotion ? 80 : 560);

        if (hasGSAP && !prefersReducedMotion) {
            window.gsap.fromTo('.invitation-card',
                { y: 90, opacity: 0, rotationX: -8, transformOrigin: '50% 0%' },
                { y: 0, opacity: 1, rotationX: 0, duration: 1.45, delay: 0.84, ease: 'power4.out' }
            );
            window.gsap.fromTo('.section-heading',
                { y: 35, opacity: 0 },
                { y: 0, opacity: 1, duration: 0.85, delay: 0.72, ease: 'power3.out' }
            );
            window.gsap.fromTo('.invitation-card__inner > *',
                { y: 18, opacity: 0 },
                { y: 0, opacity: 1, duration: 0.68, stagger: 0.075, delay: 1.2, ease: 'power2.out' }
            );
        }
    }

    function setupEnvelopeInteractions() {
        elements.openButton.addEventListener('click', openInvitation);
        elements.envelopeCanvas.addEventListener('click', openInvitation);
        elements.envelopeCanvas.addEventListener('keydown', (event) => {
            if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                openInvitation();
            }
        });
    }

    function updateCountdown() {
        const now = Date.now();
        const distance = WEDDING_DATE - now;
        const dayElement = document.getElementById('days');
        const hourElement = document.getElementById('hours');
        const minuteElement = document.getElementById('minutes');
        const secondElement = document.getElementById('seconds');

        if (!dayElement || !hourElement || !minuteElement || !secondElement) {
            return;
        }

        if (distance <= 0) {
            dayElement.textContent = '00';
            hourElement.textContent = '00';
            minuteElement.textContent = '00';
            secondElement.textContent = '00';
            if (elements.countdownNote) {
                elements.countdownNote.textContent = 'ألف مبروك للعروسين — بدأت فرحتنا';
            }
            startFireworks();
            return;
        }

        const days = Math.floor(distance / (1000 * 60 * 60 * 24));
        const hours = Math.floor((distance / (1000 * 60 * 60)) % 24);
        const minutes = Math.floor((distance / (1000 * 60)) % 60);
        const seconds = Math.floor((distance / 1000) % 60);

        dayElement.textContent = String(days).padStart(2, '0');
        hourElement.textContent = String(hours).padStart(2, '0');
        minuteElement.textContent = String(minutes).padStart(2, '0');
        secondElement.textContent = String(seconds).padStart(2, '0');
    }

    function setupMusic() {
        if (!elements.musicButton || !elements.musicAudio) {
            return;
        }

        const setPlayingState = (isPlaying) => {
            elements.musicButton.classList.toggle('is-playing', isPlaying);
            elements.musicButton.setAttribute('aria-pressed', String(isPlaying));
            elements.musicButton.setAttribute('aria-label', isPlaying ? 'إيقاف الأغنية' : 'تشغيل الأغنية');
        };

        elements.musicButton.addEventListener('click', async () => {
            if (elements.musicAudio.paused) {
                try {
                    await elements.musicAudio.play();
                    setPlayingState(true);
                    elements.audioStatus.textContent = 'تعمل الآن: هو حبيبي — أصالة';
                } catch (error) {
                    setPlayingState(false);
                    elements.audioStatus.textContent = 'لم يتم العثور على الملف. أضف assets/wedding-song.mp3 أو اختر ملفاً بديلاً.';
                }
            } else {
                elements.musicAudio.pause();
                setPlayingState(false);
                elements.audioStatus.textContent = 'تم إيقاف الأغنية مؤقتاً';
            }
        });

        elements.musicAudio.addEventListener('ended', () => setPlayingState(false));
        elements.musicAudio.addEventListener('error', () => {
            elements.audioStatus.textContent = 'أضف ملف MP3 باسم wedding-song.mp3 داخل مجلد assets';
        });

        elements.audioFileInput.addEventListener('change', (event) => {
            const [file] = event.target.files;
            if (!file) {
                return;
            }

            if (selectedAudioUrl) {
                URL.revokeObjectURL(selectedAudioUrl);
            }

            selectedAudioUrl = URL.createObjectURL(file);
            elements.musicAudio.src = selectedAudioUrl;
            elements.musicAudio.load();
            elements.audioStatus.textContent = `تم اختيار: ${file.name}`;
            elements.musicButton.classList.remove('is-playing');
            elements.musicButton.setAttribute('aria-pressed', 'false');
        });
    }

    function startFireworks() {
        if (fireworksStarted || !elements.fireworksCanvas) {
            return;
        }

        fireworksStarted = true;
        const canvas = elements.fireworksCanvas;
        const context = canvas.getContext('2d');
        if (!context) {
            return;
        }

        const section = elements.fireworksSection;
        const rockets = [];
        const particles = [];
        const colors = ['#f3d896', '#ffffff', '#e9a7a0', '#c68c43', '#f8e9be', '#dba7c2'];
        let width = 0;
        let height = 0;
        let lastLaunch = 0;
        let animationFrame = 0;

        function resize() {
            const ratio = Math.min(window.devicePixelRatio || 1, 2);
            width = section.clientWidth;
            height = section.clientHeight;
            canvas.width = width * ratio;
            canvas.height = height * ratio;
            canvas.style.width = `${width}px`;
            canvas.style.height = `${height}px`;
            context.setTransform(ratio, 0, 0, ratio, 0, 0);
        }

        function createRocket() {
            rockets.push({
                x: width * (0.12 + Math.random() * 0.76),
                y: height + 12,
                targetY: height * (0.16 + Math.random() * 0.44),
                speed: 5.1 + Math.random() * 2.8,
                color: colors[Math.floor(Math.random() * colors.length)],
                trail: []
            });
        }

        function explode(rocket) {
            const amount = 35 + Math.floor(Math.random() * 35);
            for (let index = 0; index < amount; index += 1) {
                const angle = (Math.PI * 2 * index) / amount + (Math.random() - 0.5) * 0.25;
                const speed = 1.2 + Math.random() * 3.2;
                particles.push({
                    x: rocket.x,
                    y: rocket.y,
                    vx: Math.cos(angle) * speed,
                    vy: Math.sin(angle) * speed,
                    gravity: 0.035 + Math.random() * 0.025,
                    life: 56 + Math.random() * 36,
                    maxLife: 90,
                    size: 0.8 + Math.random() * 1.4,
                    color: rocket.color
                });
            }
        }

        function draw() {
            context.fillStyle = 'rgba(33, 30, 41, 0.21)';
            context.fillRect(0, 0, width, height);

            const now = Date.now();
            if (now - lastLaunch > 710) {
                createRocket();
                lastLaunch = now;
            }

            for (let index = rockets.length - 1; index >= 0; index -= 1) {
                const rocket = rockets[index];
                rocket.trail.push({ x: rocket.x, y: rocket.y });
                if (rocket.trail.length > 7) {
                    rocket.trail.shift();
                }
                rocket.y -= rocket.speed;

                context.beginPath();
                context.moveTo(rocket.x, rocket.y);
                context.lineTo(rocket.x, rocket.y + 10);
                context.strokeStyle = rocket.color;
                context.globalAlpha = 0.72;
                context.lineWidth = 1.2;
                context.stroke();
                context.globalAlpha = 1;

                if (rocket.y <= rocket.targetY) {
                    explode(rocket);
                    rockets.splice(index, 1);
                }
            }

            for (let index = particles.length - 1; index >= 0; index -= 1) {
                const particle = particles[index];
                particle.x += particle.vx;
                particle.y += particle.vy;
                particle.vy += particle.gravity;
                particle.vx *= 0.988;
                particle.life -= 1;

                const opacity = Math.max(particle.life / particle.maxLife, 0);
                context.beginPath();
                context.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
                context.fillStyle = particle.color;
                context.globalAlpha = opacity;
                context.shadowBlur = 8;
                context.shadowColor = particle.color;
                context.fill();
                context.shadowBlur = 0;
                context.globalAlpha = 1;

                if (particle.life <= 0) {
                    particles.splice(index, 1);
                }
            }

            animationFrame = window.requestAnimationFrame(draw);
        }

        resize();
        window.addEventListener('resize', resize, { passive: true });
        createRocket();
        draw();

        window.setTimeout(() => {
            if (animationFrame) {
                window.cancelAnimationFrame(animationFrame);
            }
        }, 120000);
    }

    function setupFireworksObserver() {
        if (!elements.fireworksSection || !('IntersectionObserver' in window)) {
            startFireworks();
            return;
        }

        const observer = new IntersectionObserver((entries) => {
            if (entries.some((entry) => entry.isIntersecting)) {
                startFireworks();
                observer.disconnect();
            }
        }, { threshold: 0.2 });
        observer.observe(elements.fireworksSection);
    }

    function initialize() {
        if (!hasThree) {
            document.documentElement.classList.add('no-webgl');
        }

        createThreeEnvelope();
        setupEnvelopeInteractions();
        setInitialAnimations();
        createSparkles();
        createFallingPetals();
        setupMusic();
        updateCountdown();
        window.setInterval(updateCountdown, 1000);
        setupFireworksObserver();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initialize, { once: true });
    } else {
        initialize();
    }
})();
