import * as THREE from 'three';
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { VRM, VRMSchema } from '@pixiv/three-vrm';

import { armAngles } from './utils/pose';
import { landmarksToVector3 } from './utils/track'
import { loadGLTF } from './utils/vrm'

import { Pose } from './Pose'
import TrackControls from './trackControls';
import BoneControls from './boneControls';


import VRMUrl from 'url:./models/three-vrm-girl.vrm'

function setupScene() {
    const scene = new THREE.Scene();

    // helpers
    const gridHelper = new THREE.GridHelper(10, 10);
    scene.add(gridHelper);

    const axesHelper = new THREE.AxesHelper(5);
    scene.add(axesHelper);

    for (let i = 1; i <= 5; i++) {
        var ar1 = new THREE.ArrowHelper(undefined, new THREE.Vector3(i, 0, 1));
        ar1.name = "R" + i;
        ar1.setColor(0xFF0000);

        var ar2 = new THREE.ArrowHelper(undefined, new THREE.Vector3(i, 0, 1));
        ar2.name = "G" + i;
        ar2.setColor(0x00FF00);

        var ar3 = new THREE.ArrowHelper(undefined, new THREE.Vector3(i, 0, 1));
        ar3.name = "B" + i;
        ar3.setColor(0x0000FF);

        scene.add(ar1, ar2, ar3);
    }

    // light
    const light = new THREE.DirectionalLight("white", 1);
    light.position.set(1.0, 1.0, 1.0).normalize();
    scene.add(light);

    return scene;
}

function setRotations(node, angle) {
    node.rotation.x = angle.x;
    node.rotation.y = angle.y;
    node.rotation.z = angle.z;
}

function UpdatePose(vrm, poseLandmark, leftHandLandmark, rightHandLandmark) {
    const posePoints = landmarksToVector3(poseLandmark);
    const leftHandPoints = landmarksToVector3(leftHandLandmark);
    const rightHandPoints = landmarksToVector3(rightHandLandmark);

    const leftArmAngles = armAngles(posePoints, "LEFT");
    // const leftArmAngles = armAngles(posePoints, "LEFT", leftHandPoints);
    for (const [key, angle] of Object.entries(leftArmAngles)) {
        // if (['Hand', 'UpperArm', 'LowerArm'].includes(key))
        setRotations(
            vrm.humanoid.getBoneNode(VRMSchema.HumanoidBoneName["Left" + key]),
            angle
        )
    }

    const rightArmAngles = armAngles(posePoints, "RIGHT");
    // const rightArmAngles = armAngles(posePoints, "RIGHT", rightHandPoints);
    for (const [key, angle] of Object.entries(rightArmAngles)) {
        // if (['Hand', 'UpperArm', 'LowerArm'].includes(key))
        setRotations(
            vrm.humanoid.getBoneNode(VRMSchema.HumanoidBoneName["Right" + key]),
            angle
        )
    }
}

function OnVRMLoad(loadedVRM) {
    vrm = loadedVRM;

    scene.add(vrm.scene);
    window.scene = scene;

    new BoneControls(vrm);
    new TrackControls((poseLandmark, leftHandLandmark, rightHandLandmark) => {
        UpdatePose(vrm, poseLandmark, leftHandLandmark, rightHandLandmark);
        poseDebug.updateLandmarks(poseLandmark);
        rightHandDebug.updateLandmarks(rightHandLandmark);
        leftHandDebug.updateLandmarks(leftHandLandmark);
    });
}


// scene
const scene = setupScene();
// scene.background = new THREE.Color(0x0000ff)
var vrm;
var mixer;

const poseDebug = Pose.newPose();
poseDebug.points.material = new THREE.PointsMaterial({ color: 0xFF0000, size: 0.05 });
poseDebug.segments.material = new THREE.LineBasicMaterial({ color: 0x00FF00, linewidth: 5 });
poseDebug.group.position.x = -1;
poseDebug.group.position.y = 1.2;
scene.add(poseDebug.group);

const rightHandDebug = Pose.newHand();
rightHandDebug.points.material = new THREE.PointsMaterial({ color: 0xFF0000, size: 0.02 });
rightHandDebug.segments.material = new THREE.LineBasicMaterial({ color: 0x00FF00 });
rightHandDebug.group.position.x = -1;
rightHandDebug.group.position.y = 1.2;
scene.add(rightHandDebug.group);

const leftHandDebug = Pose.newHand();
leftHandDebug.points.material = new THREE.PointsMaterial({ color: 0xFF0000, size: 0.02 });
leftHandDebug.segments.material = new THREE.LineBasicMaterial({ color: 0x00FF00 });
leftHandDebug.group.position.x = -1;
leftHandDebug.group.position.y = 1.2;
scene.add(leftHandDebug.group);

// renderer
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
document.body.appendChild(renderer.domElement);

// camera
const camera = new THREE.PerspectiveCamera(40.0, window.innerWidth / window.innerHeight, 0.1, 20.0);
camera.position.set(0.0, 1.0, 5.0);

// camera controls
const controls = new OrbitControls(camera, renderer.domElement);
controls.screenSpacePanning = true;
controls.target.set(0.0, 1.0, 0.0);
controls.update();

// animation
const clock = new THREE.Clock();
function animate() {
    requestAnimationFrame(animate);
    const delta = clock.getDelta();
    if (vrm) {
        vrm.update(delta);
    }
    if (mixer) {
        mixer.update(delta)
    }
    renderer.render(scene, camera);
}

async function setup() {
    const gltf = await loadGLTF(VRMUrl);
    const vrm = await VRM.from(gltf);

    vrm.scene.rotation.y = Math.PI;
    for (const boneName of Object.values(VRMSchema.HumanoidBoneName)) {
        const node = vrm.humanoid.getBoneNode(boneName);
        if (node) {
            node.rotation.order = "ZYX";
        }
    }

    OnVRMLoad(vrm);
    animate();
}

setup();