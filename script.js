let scene, camera, renderer, particles;
const count = 12000;
let currentState = 'sphere';
let currentColors = {
    button: '#6366f1',
    svg: '#ffffff',
    text: '#ffffff'
};

function init() {
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x000000);
    document.getElementById('container').appendChild(renderer.domElement);

    camera.position.z = 25;

    createParticles();
    setupEventListeners();
    animate();
}

function createParticles() {
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);

    function sphericalDistribution(i) {
        const phi = Math.acos(-1 + (2 * i) / count);
        const theta = Math.sqrt(count * Math.PI) * phi;

        return {
            x: 8 * Math.cos(theta) * Math.sin(phi),
            y: 8 * Math.sin(theta) * Math.sin(phi),
            z: 8 * Math.cos(phi)
        };
    }

    for (let i = 0; i < count; i++) {
        const point = sphericalDistribution(i);

        positions[i * 3] = point.x + (Math.random() - 0.5) * 0.5;
        positions[i * 3 + 1] = point.y + (Math.random() - 0.5) * 0.5;
        positions[i * 3 + 2] = point.z + (Math.random() - 0.5) * 0.5;

        const color = new THREE.Color();
        const depth = Math.sqrt(point.x * point.x + point.y * point.y + point.z * point.z) / 8;
        color.setHSL(0.5 + depth * 0.2, 0.7, 0.4 + depth * 0.3);

        colors[i * 3] = color.r;
        colors[i * 3 + 1] = color.g;
        colors[i * 3 + 2] = color.b;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const material = new THREE.PointsMaterial({
        size: 0.08,
        vertexColors: true,
        blending: THREE.AdditiveBlending,
        transparent: true,
        opacity: 0.8,
        sizeAttenuation: true
    });

    if (particles) scene.remove(particles);
    particles = new THREE.Points(geometry, material);
    particles.rotation.x = 0;
    particles.rotation.y = 0;
    particles.rotation.z = 0;
    scene.add(particles);
}

function setupEventListeners() {
    const typeBtn = document.getElementById('typeBtn');
    const input = document.getElementById('morphText');
    const colorBtn = document.getElementById('colorBtn');
    const downloadBtn = document.getElementById('downloadBtn');

    typeBtn.addEventListener('click', () => {
        const text = input.value.trim();
        if (text) {
            morphToText(text);
        }
    });

    input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            const text = input.value.trim();
            if (text) {
                morphToText(text);
            }
        }
    });

    // Color picker toggle
    colorBtn.addEventListener('click', () => {
        toggleColorPicker();
    });

    // Download button
    downloadBtn.addEventListener('click', () => {
        downloadCanvasImage();
    });

    // Close color picker when clicking outside
    document.addEventListener('click', (e) => {
        const colorPicker = document.querySelector('.color-picker-panel');
        const colorBtn = document.getElementById('colorBtn');
        if (colorPicker && !colorPicker.contains(e.target) && !colorBtn.contains(e.target)) {
            colorPicker.classList.remove('active');
        }
    });
}

function createTextPoints(text) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const fontSize = 100;
    const padding = 20;

    ctx.font = `bold ${fontSize}px Arial`;
    const textMetrics = ctx.measureText(text);
    const textWidth = textMetrics.width;
    const textHeight = fontSize;

    canvas.width = textWidth + padding * 2;
    canvas.height = textHeight + padding * 2;

    // Use the current text color from color picker
    ctx.fillStyle = currentColors.text;
    ctx.font = `bold ${fontSize}px Arial`;
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'center';
    ctx.fillText(text, canvas.width / 2, canvas.height / 2);

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const pixels = imageData.data;
    const points = [];
    const threshold = 128;

    for (let i = 0; i < pixels.length; i += 4) {
        // Check alpha channel instead of just red channel for better color detection
        if (pixels[i + 3] > 128) {  // Check alpha value
            const x = (i / 4) % canvas.width;
            const y = Math.floor((i / 4) / canvas.width);

            if (Math.random() < 0.3) {
                points.push({
                    x: (x - canvas.width / 2) / (fontSize / 10),
                    y: -(y - canvas.height / 2) / (fontSize / 10)
                });
            }
        }
    }

    return points;
}

function morphToText(text) {
    currentState = 'text';
    const textPoints = createTextPoints(text);
    const positions = particles.geometry.attributes.position.array;
    const colors = particles.geometry.attributes.color.array;
    const targetPositions = new Float32Array(count * 3);
    
    // Parse the text color and apply to all particles
    const textColor = new THREE.Color(currentColors.text);
    // Krishna Coding Corner

    gsap.to(particles.rotation, {
        x: 0,
        y: 0,
        z: 0,
        duration: 0.5
    });

    for (let i = 0; i < count; i++) {
        if (i < textPoints.length) {
            targetPositions[i * 3] = textPoints[i].x;
            targetPositions[i * 3 + 1] = textPoints[i].y;
            targetPositions[i * 3 + 2] = 0;
            
            // Apply text color to particles forming the text
            colors[i * 3] = textColor.r;
            colors[i * 3 + 1] = textColor.g;
            colors[i * 3 + 2] = textColor.b;
        } else {
            const angle = Math.random() * Math.PI * 2;
            const radius = Math.random() * 20 + 10;
            targetPositions[i * 3] = Math.cos(angle) * radius;
            targetPositions[i * 3 + 1] = Math.sin(angle) * radius;
            targetPositions[i * 3 + 2] = (Math.random() - 0.5) * 10;
        }
    }

    for (let i = 0; i < positions.length; i += 3) {
        gsap.to(particles.geometry.attributes.position.array, {
            [i]: targetPositions[i],
            [i + 1]: targetPositions[i + 1],
            [i + 2]: targetPositions[i + 2],
            duration: 2,
            ease: "power2.inOut",
            onUpdate: () => {
                particles.geometry.attributes.position.needsUpdate = true;
            }
        });
    }
    
    // Animate color changes for particles
    for (let i = 0; i < colors.length; i += 3) {
        gsap.to(particles.geometry.attributes.color.array, {
            [i]: colors[i],
            [i + 1]: colors[i + 1],
            [i + 2]: colors[i + 2],
            duration: 2,
            ease: "power2.inOut",
            onUpdate: () => {
                particles.geometry.attributes.color.needsUpdate = true;
            }
        });
    }

    setTimeout(() => {
        morphToCircle();
    }, 4000);
}

function morphToCircle() {
    currentState = 'sphere';
    const positions = particles.geometry.attributes.position.array;
    const targetPositions = new Float32Array(count * 3);
    const colors = particles.geometry.attributes.color.array;

    function sphericalDistribution(i) {
        const phi = Math.acos(-1 + (2 * i) / count);
        const theta = Math.sqrt(count * Math.PI) * phi;

        return {
            x: 8 * Math.cos(theta) * Math.sin(phi),
            y: 8 * Math.sin(theta) * Math.sin(phi),
            z: 8 * Math.cos(phi)
        };
    }

    for (let i = 0; i < count; i++) {
        const point = sphericalDistribution(i);

        targetPositions[i * 3] = point.x + (Math.random() - 0.5) * 0.5;
        targetPositions[i * 3 + 1] = point.y + (Math.random() - 0.5) * 0.5;
        targetPositions[i * 3 + 2] = point.z + (Math.random() - 0.5) * 0.5;

        const depth = Math.sqrt(point.x * point.x + point.y * point.y + point.z * point.z) / 8;
        const color = new THREE.Color();
        color.setHSL(0.5 + depth * 0.2, 0.7, 0.4 + depth * 0.3);

        colors[i * 3] = color.r;
        colors[i * 3 + 1] = color.g;
        colors[i * 3 + 2] = color.b;
    }

    for (let i = 0; i < positions.length; i += 3) {
        gsap.to(particles.geometry.attributes.position.array, {
            [i]: targetPositions[i],
            [i + 1]: targetPositions[i + 1],
            [i + 2]: targetPositions[i + 2],
            duration: 2,
            ease: "power2.inOut",
            onUpdate: () => {
                particles.geometry.attributes.position.needsUpdate = true;
            }
        });
    }

    for (let i = 0; i < colors.length; i += 3) {
        gsap.to(particles.geometry.attributes.color.array, {
            [i]: colors[i],
            [i + 1]: colors[i + 1],
            [i + 2]: colors[i + 2],
            duration: 2,
            ease: "power2.inOut",
            onUpdate: () => {
                particles.geometry.attributes.color.needsUpdate = true;
            }
        });
    }
}

function animate() {
    requestAnimationFrame(animate);

    if (currentState === 'sphere') {
        particles.rotation.y += 0.002;
    }

    renderer.render(scene, camera);
}

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// Color Picker Functions
function toggleColorPicker() {
    let panel = document.querySelector('.color-picker-panel');
    
    if (!panel) {
        createColorPickerPanel();
        panel = document.querySelector('.color-picker-panel');
    }
    
    panel.classList.toggle('active');
}

function createColorPickerPanel() {
    const inputContainer = document.querySelector('.input-container');
    
    const panel = document.createElement('div');
    panel.className = 'color-picker-panel';
    
    panel.innerHTML = `
        <div class="color-option">
            <label>Button:</label>
            <input type="color" id="buttonColorPicker" value="${currentColors.button}">
        </div>
        <div class="color-option">
            <label>SVG Icon:</label>
            <input type="color" id="svgColorPicker" value="${currentColors.svg}">
        </div>
        <div class="color-option">
            <label>Text:</label>
            <input type="color" id="textColorPicker" value="${currentColors.text}">
        </div>
        <div class="color-actions">
            <button id="applyColors">Apply</button>
            <button id="resetColors">Reset</button>
        </div>
    `;
    
    inputContainer.appendChild(panel);
    
    // Add event listeners for color pickers
    document.getElementById('buttonColorPicker').addEventListener('input', (e) => {
        currentColors.button = e.target.value;
        updateButtonColors();
    });
    
    document.getElementById('svgColorPicker').addEventListener('input', (e) => {
        currentColors.svg = e.target.value;
        updateSVGColors();
    });
    
    document.getElementById('textColorPicker').addEventListener('input', (e) => {
        currentColors.text = e.target.value;
        // If currently showing text, recreate it with new color
        if (currentState === 'text' && particles) {
            const input = document.getElementById('morphText');
            const text = input.value.trim();
            if (text) {
                morphToText(text);
            }
        }
    });
    
    document.getElementById('applyColors').addEventListener('click', () => {
        applyAllColors();
        panel.classList.remove('active');
    });
    
    document.getElementById('resetColors').addEventListener('click', () => {
        resetColors();
    });
}

function updateButtonColors() {
    const buttons = document.querySelectorAll('.color-btn, .download-btn');
    buttons.forEach(btn => {
        btn.style.background = `linear-gradient(135deg, ${currentColors.button} 0%, ${adjustColor(currentColors.button, -20)} 100%)`;
    });
    
    const typeBtn = document.getElementById('typeBtn');
    typeBtn.style.background = `linear-gradient(135deg, ${currentColors.button} 0%, ${adjustColor(currentColors.button, -20)} 100%)`;
}

function updateSVGColors() {
    const svgs = document.querySelectorAll('.color-btn svg, .download-btn svg, #typeBtn svg');
    svgs.forEach(svg => {
        svg.style.color = currentColors.svg;
    });
}

function applyAllColors() {
    updateButtonColors();
    updateSVGColors();
}

function resetColors() {
    currentColors = {
        button: '#6366f1',
        svg: '#ffffff',
        text: '#ffffff'
    };
    
    document.getElementById('buttonColorPicker').value = currentColors.button;
    document.getElementById('svgColorPicker').value = currentColors.svg;
    document.getElementById('textColorPicker').value = currentColors.text;
    
    applyAllColors();
}

function adjustColor(hex, percent) {
    const num = parseInt(hex.replace('#', ''), 16);
    const amt = Math.round(2.55 * percent);
    const R = (num >> 16) + amt;
    const G = (num >> 8 & 0x00FF) + amt;
    const B = (num & 0x0000FF) + amt;
    return '#' + (
        0x1000000 +
        (R < 255 ? (R < 1 ? 0 : R) : 255) * 0x10000 +
        (G < 255 ? (G < 1 ? 0 : G) : 255) * 0x100 +
        (B < 255 ? (B < 1 ? 0 : B) : 255)
    ).toString(16).slice(1);
}

// Download Function
function downloadCanvasImage() {
    renderer.render(scene, camera);
    
    const canvas = renderer.domElement;
    const dataURL = canvas.toDataURL('image/png');
    
    const link = document.createElement('a');
    link.download = '3d-text-animation.png';
    link.href = dataURL;
    link.click();
}

init();