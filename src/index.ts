import { KeyDisplay } from './utils';
import { CharacterControls } from './characterControls';
import * as THREE from 'three'
import { CameraHelper } from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';



initMechContract();

let prefix = '/cb-mech-hanger/src/';
// let prefix = './';


let scale = 5;
// SCENE
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xa8def0);

// CAMERA
const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.y = 5;
camera.position.z = 5;
camera.position.x = 0;

// RENDERER
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
renderer.shadowMap.enabled = true

// CONTROLS
const orbitControls = new OrbitControls(camera, renderer.domElement);
orbitControls.enableDamping = true
orbitControls.minDistance = 0.5
orbitControls.maxDistance = 5
orbitControls.enablePan = false
orbitControls.maxPolarAngle = Math.PI
orbitControls.update();

// LIGHTS
light()

// FLOOR
generateFloor()


var characterControls: CharacterControls



// let mechs = [709, 16, 23, 47, 61, 66, 106, 140, 150, 155, 158, 161, 163, 172, 182, 224, 314, 326, 328, 338, 341, 348, 349, 389, 424, 428, 430, 443, 448, 452, 456, 458, 472, 478, 487, 492, 522, 525, 531, 532, 539, 540, 549, 553, 555, 629, 636, 640, 660, 682];

let wallet: any = '0xa5A0b7c3dD5dddBFbD51e56b9170bb6D1253788b';
let hasWallet: any = getWallet();

if(hasWallet){
    wallet = hasWallet;
}

getMechTokenBalance(wallet).then((mechIds)=>{
    let globalOffsetX = (mechIds.length/4)-1 * scale * 10.4;

    // MODEL WITH ANIMATIONS
    new GLTFLoader().load(prefix+'models/Soldier.glb', function (gltf) {
        const model = gltf.scene;
        model.traverse(function (object: any) {
            if (object.isMesh) object.castShadow = true;
        });

        let globalOffsetZ = ((mechIds.length/4)-1) * scale * 10.5;
        
        model.position.set(0,0,globalOffsetZ);
        scene.add(model);


        const gltfAnimations: THREE.AnimationClip[] = gltf.animations;
        const mixer = new THREE.AnimationMixer(model);
        const animationsMap: Map<string, THREE.AnimationAction> = new Map()
        gltfAnimations.filter(a => a.name != 'TPose').forEach((a: THREE.AnimationClip) => {
            animationsMap.set(a.name, mixer.clipAction(a))
        })

        characterControls = new CharacterControls(model, mixer, animationsMap, orbitControls, camera,  'Idle')
    });

    mechIds.forEach((mechId: any, index: number)=>{

        if(index % 4 == 0){
            new GLTFLoader().load(prefix+'models/hanger.glb', function (gltf) {
                const model = gltf.scene;
                model.traverse(function (object: any) {
                    if (object.isMesh) object.castShadow = true;
                });
                model.position.set(0, 0, (index/4)*scale*20.5+globalOffsetX);
                model.scale.set(scale,scale,scale);
                scene.add(model);
            });
            
        }
        if(index % 16 == 0){
            const light = new THREE.DirectionalLight('white', 0.5);

            light.position.set(0, 50, (index/16)*scale*20.5 - 100);
            scene.add(light);
        }
        
        // new GLTFLoader().load(prefix+'models/mechs/token'+mech+'_mech_1k.glb', function (gltf) {
            new GLTFLoader().load('https://m.cyberbrokers.com/eth/mech/'+mechId+'/files/mech_1k.glb', function (gltf) {
            
            const model = gltf.scene;
            model.traverse(function (object: any) {
                if (object.isMesh) object.castShadow = true;
            });
            model.scale.set(scale*1.5,scale*1.5,scale*1.5);
            let leftSide = index%2 == 0;
            let spacing = scale*6;
            let offsetX = scale*3;
            model.position.set(leftSide ? -spacing : spacing, 0, Math.floor(index/2)*spacing - offsetX + globalOffsetX);
            model.rotation.set(0, leftSide ? Math.PI/2 : -Math.PI/2, 0);
            scene.add(model);
        });
    })

});

// CONTROL KEYS
const keysPressed = {  }
const keyDisplayQueue = new KeyDisplay();
document.addEventListener('keydown', (event) => {
    keyDisplayQueue.down(event.key)
    if (event.shiftKey && characterControls) {
        characterControls.switchRunToggle()
    } else {
        (keysPressed as any)[event.key.toLowerCase()] = true
    }
}, false);
document.addEventListener('keyup', (event) => {
    keyDisplayQueue.up(event.key);
    (keysPressed as any)[event.key.toLowerCase()] = false
}, false);

const clock = new THREE.Clock();
// ANIMATE
function animate() {
    let mixerUpdateDelta = clock.getDelta();
    if (characterControls) {
        characterControls.update(mixerUpdateDelta, keysPressed);
    }
    orbitControls.update()
    renderer.render(scene, camera);
    requestAnimationFrame(animate);
}
document.body.appendChild(renderer.domElement);
animate();

// RESIZE HANDLER
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    keyDisplayQueue.updatePosition()
}
window.addEventListener('resize', onWindowResize);

function generateFloor() {
    // TEXTURES
    const textureLoader = new THREE.TextureLoader();
    const placeholder = textureLoader.load(prefix+"textures/placeholder/placeholder.png");
    const sandBaseColor = textureLoader.load(prefix+"textures/sand/Sand 002_COLOR.png");
    const sandNormalMap = textureLoader.load(prefix+"textures/sand/Sand 002_NRM.jpg");
    const sandHeightMap = textureLoader.load(prefix+"textures/sand/Sand 002_DISP.jpg");
    const sandAmbientOcclusion = textureLoader.load(prefix+"textures/sand/Sand 002_OCC.jpg");

    const WIDTH = 80
    const LENGTH = 80

    const geometry = new THREE.PlaneGeometry(WIDTH, LENGTH, 512, 512);
    
    const material = new THREE.MeshBasicMaterial({ 
        opacity: 0.0, 
        transparent: true, 
        side: THREE.DoubleSide, 
        depthWrite: false
    });

    // const material = new THREE.MeshStandardMaterial(
    //     {
    //         map: sandBaseColor, normalMap: sandNormalMap,
    //         displacementMap: sandHeightMap, displacementScale: 0.1,
    //         aoMap: sandAmbientOcclusion
    //     })
    // wrapAndRepeatTexture(material.map)
    // wrapAndRepeatTexture(material.normalMap)
    // wrapAndRepeatTexture(material.displacementMap)
    // wrapAndRepeatTexture(material.aoMap)
    // const material = new THREE.MeshPhongMaterial({ map: placeholder})

    const floor = new THREE.Mesh(geometry, material)
    floor.receiveShadow = true
    floor.rotation.x = - Math.PI / 2
    scene.add(floor)
}

function wrapAndRepeatTexture (map: THREE.Texture) {
    map.wrapS = map.wrapT = THREE.RepeatWrapping
    map.repeat.x = map.repeat.y = 10
}

function light() {
    scene.add(new THREE.AmbientLight(0xffffff, 2.0))

    const dirLight = new THREE.DirectionalLight(0xffffff, 1)
    dirLight.position.set(- 60, 100, - 10);
    dirLight.castShadow = true;
    dirLight.shadow.camera.top = 50;
    dirLight.shadow.camera.bottom = - 50;
    dirLight.shadow.camera.left = - 50;
    dirLight.shadow.camera.right = 50;
    dirLight.shadow.camera.near = 0.1;
    dirLight.shadow.camera.far = 200;
    dirLight.shadow.mapSize.width = 4096;
    dirLight.shadow.mapSize.height = 4096;
    scene.add(dirLight);
    // scene.add( new THREE.CameraHelper(dirLight.shadow.camera))

    
}
