import * as dat from 'dat.gui';
import { VRMSchema } from '@pixiv/three-vrm';

class BoneControls {
    constructor(vrm) {
        this.vrm = vrm;
        this.createBoneControls();
    }

    createBoneControls() {
        const addBoneControl = boneName => {
            const boneNode = this.vrm.humanoid.getBoneNode(VRMSchema.HumanoidBoneName[boneName]);

            // rotation
            const rotation = gui.addFolder('rotation');
            rotation.add(boneNode.rotation, 'x', -Math.PI, Math.PI, 0.01).listen();
            rotation.add(boneNode.rotation, 'y', -Math.PI, Math.PI, 0.01).listen();
            rotation.add(boneNode.rotation, 'z', -Math.PI, Math.PI, 0.01).listen();
            rotation.open();
    
            // position
            const position = gui.addFolder('position');
            position.add(boneNode.position, 'x', -1, 1, 0.01).listen();
            position.add(boneNode.position, 'y', -1, 1, 0.01).listen();
            position.add(boneNode.position, 'z', -1, 1, 0.01).listen();
            position.open();
    
            guiParam.currentBoneControls = {
                rotation: rotation,
                position: position
            }
        }
    
        const gui = new dat.GUI();
        const guiParam = {
            currentBone: 'LeftUpperArm',
            currentBoneControls: {
                rotation: null,
                position: null
            }
        };
    
        const bones = Object.keys(VRMSchema.HumanoidBoneName);
        // const bones = ["LeftUpperArm", "LeftLowerArm", "LeftHand", "RightUpperArm", "RightLowerArm", "RightHand"];
        gui.add(guiParam, 'currentBone').options(bones).onChange(() => {
            gui.removeFolder(guiParam.currentBoneControls.rotation);
            gui.removeFolder(guiParam.currentBoneControls.position);
            addBoneControl(guiParam.currentBone);
        });
    
        addBoneControl('LeftUpperArm');
    }
}

export default BoneControls;