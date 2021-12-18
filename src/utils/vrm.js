import { VRMSchema } from "@pixiv/three-vrm";
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';

export function loadGLTF(vrmSrc) {
    const loader = new GLTFLoader();
    return new Promise(function(resolve, reject) {
        loader.load(vrmSrc, resolve, null, reject);
    });
}

export function getBoneNames(vrm) {
    return Object.values(VRMSchema.HumanoidBoneName).reduce((o, x) => {
        const node = vrm.humanoid.getBoneNode(x);
        if (node) o[x] = node.name;
        return o;
    }, {});
}
