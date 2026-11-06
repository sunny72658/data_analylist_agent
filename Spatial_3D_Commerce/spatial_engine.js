/**
 * ⚡ Nexus3D — Photorealistic CAD GLTF Car & Spatial WebGL Engine
 */

class SpatialEngine {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.controls = null;

        // Camera View Mode ('exterior' | 'interior' | 'front' | 'rear')
        this.viewMode = 'exterior';

        // 3D Car Model References
        this.carModel = null;
        this.bodyMeshes = [];
        this.glassMeshes = [];
        this.rimMeshes = [];
        this.interiorMeshes = [];
        this.hotspots = [];

        // Materials
        this.paintMaterial = null;
        this.glassMaterial = null;
        this.rimMaterial = null;

        this.init();
    }

    init() {
        // 1. Scene setup
        this.scene = new THREE.Scene();
        this.scene.fog = new THREE.FogExp2(0x050811, 0.01);

        // 2. Camera setup
        this.camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.camera.position.set(4.5, 2.0, 5.5);

        // 3. Renderer setup
        this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.35;
        this.container.appendChild(this.renderer.domElement);

        // 4. OrbitControls setup
        this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
        this.controls.maxPolarAngle = Math.PI / 2.05;
        this.controls.minDistance = 0.4;
        this.controls.maxDistance = 15;

        // 5. Studio Environment Map & Lighting
        this.setupStudioEnvironment();
        this.setupLighting();

        // 6. Load High-Detail CAD GLTF Car Model
        this.loadCADCarModel();

        // 7. Ground Reflective Floor
        this.setupGround();

        // 8. 3D Hotspots
        this.setup3DHotspots();

        // 9. Event Listeners
        window.addEventListener('resize', () => this.onWindowResize());
        this.container.addEventListener('click', (e) => this.onRaycastClick(e));

        // 10. Animation Loop
        this.animate();
    }

    setupStudioEnvironment() {
        // Generate dynamic HDRI gradient canvas texture for photorealistic reflections
        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 256;
        const ctx = canvas.getContext('2d');

        const gradient = ctx.createLinearGradient(0, 0, 0, 256);
        gradient.addColorStop(0, '#ffffff');
        gradient.addColorStop(0.3, '#4a5b7e');
        gradient.addColorStop(0.7, '#111625');
        gradient.addColorStop(1, '#050811');

        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 512, 256);

        // Studio softbox highlights
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.ellipse(256, 50, 200, 35, 0, 0, Math.PI * 2);
        ctx.fill();

        const envTexture = new THREE.CanvasTexture(canvas);
        envTexture.mapping = THREE.EquirectangularReflectionMapping;
        this.scene.environment = envTexture;
    }

    setupLighting() {
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.85);
        this.scene.add(ambientLight);

        // Key Studio Directional Light
        const keyLight = new THREE.DirectionalLight(0xffffff, 2.5);
        keyLight.position.set(10, 20, 12);
        keyLight.castShadow = true;
        keyLight.shadow.mapSize.width = 2048;
        keyLight.shadow.mapSize.height = 2048;
        keyLight.shadow.bias = -0.0001;
        this.scene.add(keyLight);

        // Fill Cyan Rim Light
        const fillLight = new THREE.DirectionalLight(0x00E5FF, 1.6);
        fillLight.position.set(-12, 12, -12);
        this.scene.add(fillLight);
    }

    loadCADCarModel() {
        const loader = new THREE.GLTFLoader();

        // High-Poly CAD Ferrari model from official Three.js repository
        const modelUrl = 'https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/models/gltf/Ferrari.glb';

        loader.load(
            modelUrl,
            (gltf) => {
                this.carModel = gltf.scene;
                this.carModel.scale.set(1.1, 1.1, 1.1);
                this.carModel.position.set(0, 0, 0);

                // Initialize Custom PBR Body Paint Material
                this.paintMaterial = new THREE.MeshPhysicalMaterial({
                    color: 0xff0000, // Rosso Corsa Red
                    metalness: 0.9,
                    roughness: 0.1,
                    clearcoat: 1.0,
                    clearcoatRoughness: 0.05,
                    reflectivity: 1.0
                });

                this.rimMaterial = new THREE.MeshStandardMaterial({
                    color: 0xEAEAEA,
                    metalness: 0.95,
                    roughness: 0.1
                });

                // Traverse GLTF Hierarchy to bind materials and shadows
                this.carModel.traverse((node) => {
                    if (node.isMesh) {
                        node.castShadow = true;
                        node.receiveShadow = true;

                        const name = node.name.toLowerCase();
                        if (name.includes('body') || name.includes('paint') || name.includes('car_body')) {
                            node.material = this.paintMaterial;
                            this.bodyMeshes.push(node);
                        } else if (name.includes('rim') || name.includes('wheel')) {
                            this.rimMeshes.push(node);
                        } else if (name.includes('glass')) {
                            this.glassMeshes.push(node);
                        }
                    }
                });

                this.scene.add(this.carModel);

                // Hide Loading Screen
                const loaderEl = document.getElementById('loading-screen');
                if (loaderEl) {
                    loaderEl.style.opacity = '0';
                    setTimeout(() => loaderEl.style.display = 'none', 500);
                }
            },
            (xhr) => {
                // Progress
                const percent = Math.round((xhr.loaded / (xhr.total || 10000000)) * 100);
                const textEl = document.querySelector('.loading-subtext');
                if (textEl) textEl.innerText = `Loading CAD Meshes: ${percent}%`;
            },
            (error) => {
                console.warn('GLTF load failed, using procedural fallback:', error);
                this.buildProceduralFallbackModel();
                const loaderEl = document.getElementById('loading-screen');
                if (loaderEl) loaderEl.style.display = 'none';
            }
        );
    }

    buildProceduralFallbackModel() {
        const bodyGeo = new THREE.BoxGeometry(4.4, 0.9, 2.2);
        bodyGeo.translate(0, 0.7, 0);
        this.paintMaterial = new THREE.MeshPhysicalMaterial({ color: 0xff0000, metalness: 0.9, roughness: 0.1, clearcoat: 1.0 });
        const mesh = new THREE.Mesh(bodyGeo, this.paintMaterial);
        this.scene.add(mesh);
    }

    setupGround() {
        const floorGeo = new THREE.PlaneGeometry(100, 100);
        floorGeo.rotateX(-Math.PI / 2);

        const floorMat = new THREE.MeshStandardMaterial({
            color: 0x050811,
            roughness: 0.35,
            metalness: 0.85
        });

        const floorMesh = new THREE.Mesh(floorGeo, floorMat);
        floorMesh.position.y = 0;
        floorMesh.receiveShadow = true;
        this.scene.add(floorMesh);

        // Reflection Studio Grid
        const gridHelper = new THREE.GridHelper(60, 40, 0x00E5FF, 0x161B22);
        gridHelper.position.y = 0.01;
        this.scene.add(gridHelper);
    }

    setup3DHotspots() {
        const hotspotData = [
            { id: "engine", title: "Mid-Rear V8 Twin-Turbo Engine", category: "ENGINEERING", pos: new THREE.Vector3(-0.8, 0.9, 0), desc: "3.9L Twin-Turbo V8 producing 710 hp with 0-60 mph acceleration in 2.9 seconds." },
            { id: "cockpit", title: "F1 Digital Cockpit", category: "INTERIOR", pos: new THREE.Vector3(0.2, 1.1, 0.35), desc: "Carbon fiber steering wheel with integrated F1 shift lights and telemetry console." },
            { id: "brakes", title: "Carbon Ceramic Brakes", category: "PERFORMANCE", pos: new THREE.Vector3(1.3, 0.5, 0.9), desc: "High-performance carbon ceramic rotors for ultimate track stopping power." }
        ];

        const sphereGeo = new THREE.SphereGeometry(0.08, 16, 16);
        const sphereMat = new THREE.MeshBasicMaterial({ color: 0x00E5FF });

        hotspotData.forEach(h => {
            const mesh = new THREE.Mesh(sphereGeo, sphereMat);
            mesh.position.copy(h.pos);
            mesh.userData = h;
            this.hotspots.push(mesh);
            this.scene.add(mesh);
        });
    }

    // --- Camera View Mode Switcher ---
    setCameraViewMode(mode) {
        this.viewMode = mode;
        const modeBadgeText = document.getElementById('view-mode-text');
        const hudNavText = document.getElementById('hud-nav-mode');

        if (mode === 'interior') {
            // Smooth Camera Fly-In into 1st-Person Cockpit
            gsap.to(this.camera.position, {
                x: 0.15,
                y: 0.98,
                z: 0.35,
                duration: 1.6,
                ease: "power2.inOut"
            });
            gsap.to(this.controls.target, {
                x: 0.8,
                y: 0.92,
                z: 0.25,
                duration: 1.6,
                ease: "power2.inOut",
                onUpdate: () => this.controls.update()
            });

            if (modeBadgeText) modeBadgeText.innerText = "1st-Person Interior Cockpit Mode";
            if (hudNavText) hudNavText.innerHTML = '<i class="fa-solid fa-arrows-spin"></i> Drag to Look 360° Inside Cockpit';
        } else if (mode === 'front') {
            gsap.to(this.camera.position, { x: 4.2, y: 1.0, z: 0, duration: 1.5, ease: "power2.inOut" });
            gsap.to(this.controls.target, { x: 0, y: 0.8, z: 0, duration: 1.5, ease: "power2.inOut", onUpdate: () => this.controls.update() });
        } else if (mode === 'rear') {
            gsap.to(this.camera.position, { x: -4.2, y: 1.2, z: 0, duration: 1.5, ease: "power2.inOut" });
            gsap.to(this.controls.target, { x: 0, y: 0.8, z: 0, duration: 1.5, ease: "power2.inOut", onUpdate: () => this.controls.update() });
        } else { // exterior 360
            gsap.to(this.camera.position, {
                x: 4.5,
                y: 2.0,
                z: 5.5,
                duration: 1.6,
                ease: "power2.inOut"
            });
            gsap.to(this.controls.target, {
                x: 0,
                y: 0.6,
                z: 0,
                duration: 1.6,
                ease: "power2.inOut",
                onUpdate: () => this.controls.update()
            });

            if (modeBadgeText) modeBadgeText.innerText = "Photorealistic Exterior Mode";
            if (hudNavText) hudNavText.innerHTML = '<i class="fa-solid fa-rotate"></i> Drag to 360° Orbit Studio';
        }
    }

    // --- Customizer Controls ---
    setPaintColor(hexColor, finish = "metallic") {
        if (this.paintMaterial) {
            this.paintMaterial.color.setHex(hexColor);
            if (finish === "matte") {
                this.paintMaterial.metalness = 0.2;
                this.paintMaterial.roughness = 0.85;
                this.paintMaterial.clearcoat = 0.0;
            } else if (finish === "pearl") {
                this.paintMaterial.metalness = 0.6;
                this.paintMaterial.roughness = 0.15;
                this.paintMaterial.clearcoat = 0.85;
            } else {
                this.paintMaterial.metalness = 0.9;
                this.paintMaterial.roughness = 0.1;
                this.paintMaterial.clearcoat = 1.0;
            }
        }
    }

    setWheelPackage(type) {
        if (this.rimMaterial) {
            if (type === "black") {
                this.rimMaterial.color.setHex(0x111625);
                this.rimMaterial.roughness = 0.25;
            } else {
                this.rimMaterial.color.setHex(0xEAEAEA);
                this.rimMaterial.roughness = 0.1;
            }
        }
    }

    onRaycastClick(event) {
        const raycaster = new THREE.Raycaster();
        const mouse = new THREE.Vector2();

        mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

        raycaster.setFromCamera(mouse, this.camera);
        const intersects = raycaster.intersectObjects(this.hotspots);

        if (intersects.length > 0) {
            const data = intersects[0].object.userData;
            window.showHotspotModal(data);
        }
    }

    animate() {
        requestAnimationFrame(() => this.animate());

        if (this.viewMode === 'exterior' && this.carModel) {
            this.carModel.rotation.y += 0.002;
        }

        const time = performance.now() * 0.004;
        this.hotspots.forEach(h => {
            h.scale.setScalar(1.0 + Math.sin(time * 3) * 0.25);
        });

        this.controls.update();
        this.renderer.render(this.scene, this.camera);
    }

    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }
}

// Global instance setup
window.addEventListener('DOMContentLoaded', () => {
    window.spatialEngine = new SpatialEngine('webgl-container');
});
