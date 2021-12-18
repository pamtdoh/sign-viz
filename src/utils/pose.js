import { Vector3 } from "three";

const fingerNames = [
    "Thumb",
    "Index",
    "Middle",
    "Ring",
    "Little"
]

const fingerIndices = [
    [0, 1, 2, 3, 4],
    [0, 5, 6, 7, 8],
    [0, 9, 10, 11, 12],
    [0, 13, 14, 15, 16],
    [0, 17, 18, 19, 20]
]

class Axes {
    constructor(x, y, z) {
        this.x = x.clone();
        this.y = y.clone();
        this.z = z.clone();
    }

    clone() {
        return new Axes(this.x, this.y, this.z);
    }
    
    applyAxisAngle(axis, angle) {
        this.x.applyAxisAngle(axis, angle);
        this.y.applyAxisAngle(axis, angle);
        this.z.applyAxisAngle(axis, angle);
        return this;
    }
}

function pointBetween(a, b, ratio) {
    var dir = b.clone().sub(a);
    var len = dir.length();
    return a.clone().add(dir.normalize().multiplyScalar(ratio * len));
}

function calc_finger_vectors(handPoints, finger) {
    const points = fingerIndices[finger].map(x => handPoints[x]);

    const metacarpal = new Vector3().subVectors(points[1], points[0]).normalize();
    const proximal = new Vector3().subVectors(points[2], points[1]).normalize();
    const intermediate = new Vector3().subVectors(points[3], points[2]).normalize();
    const distal = new Vector3().subVectors(points[4], points[3]).normalize();

    return {
        metacarpal,
        proximal,
        intermediate,
        distal
    }
}

function calc_body_n_z(posePoints) {
    return new Vector3().crossVectors(
        new Vector3().subVectors(
            posePoints[11],
            posePoints[12]),
        new Vector3().subVectors(
            posePoints[12],
            new Vector3().addVectors(
                posePoints[23],
                posePoints[24]
            ).divideScalar(2))
    ).normalize();
}

function calc_pose_vectors(posePoints, side) {
    const points = (
        side == "LEFT"
        ? [12, 11, 13, 15, 17, 19]
        : [11, 12, 14, 16, 18, 20]
    ).map(x => posePoints[x]);

    const body_n_z = new Vector3(0, 0, -1);

    const shoulder = new Vector3().subVectors(points[1], points[0]).normalize();
    const upper_arm = new Vector3().subVectors(points[2], points[1]).normalize();

    const lower_arm = new Vector3().subVectors(points[3], points[2]).normalize();
    const lower_arm_n_z = lower_arm.clone().negate();

    const hand = new Vector3().subVectors(pointBetween(points[5], points[4], 0.75), points[3]).normalize();
    const hand_n_y = new Vector3().crossVectors(
        points[4].clone().sub(points[3]),
        points[5].clone().sub(points[3])
    ).normalize();
    if (side == "LEFT") hand_n_y.negate();

    return {
        body_n_z,
        shoulder,
        upper_arm,
        lower_arm,
        lower_arm_n_z,
        hand,
        hand_n_y
    }
}

function calc_hand(handPoints, side) {
    const hand = new Vector3().subVectors(handPoints[13], handPoints[0]).normalize();

    const wrist_little = new Vector3().subVectors(handPoints[17], handPoints[0]);
    const wrist_index = new Vector3().subVectors(handPoints[5], handPoints[0]);
    
    const hand_n_y = wrist_little.cross(wrist_index);
    if (side == "LEFT") hand_n_y.negate();

    return {
        hand,
        hand_n_y
    };
}

function angleZY(axes, source, target) {
    axes = axes.clone();

    let proj = target.clone().projectOnPlane(axes.z);
    
    let angle_z = source.angleTo(proj);
    if (source.clone().cross(proj).dot(axes.z) < 0) angle_z = -angle_z;

    axes.applyAxisAngle(axes.z, angle_z);

    let angle_y = proj.angleTo(target);
    if (proj.clone().cross(target).dot(axes.y) < 0) angle_y = -angle_y;
    
    axes.applyAxisAngle(axes.y, angle_y);

    return [
        axes,
        {
            z: angle_z,
            y: angle_y,
        }
    ]
}

function angleX(axes, target, targetAxis) {
    axes = axes.clone();
    
    let src = axes[targetAxis];
    target = target.clone().projectOnPlane(axes.x);

    let angle_x = src.angleTo(target);
    if (src.clone().cross(target).dot(axes.x) < 0) angle_x = -angle_x;

    axes.applyAxisAngle(axes.x, angle_x);

    return [
        axes,
        {
            x: angle_x
        }
    ]
}

function fingerAngles(handPoints, finger, root, rootAxes) {
    var {metacarpal, proximal, intermediate, distal} = calc_finger_vectors(handPoints, finger);

    var angles = {};
    var axes = rootAxes.clone();

    // [SKIP] Metacarpal
    var [axes, aZY] = angleZY(axes, root, metacarpal);
    // var [axes, aX] = angleX(axes, metacarpal, 'z');

    // Proximal
    var [axes, aZY] = angleZY(axes, metacarpal, proximal);
    // var [axes, aX] = angleX(axes, proximal, 'z');
    angles.Proximal = {
        x: 0,
        y: aZY.y,
        z: aZY.z
    };

    // Intermediate
    var [axes, aZY] = angleZY(axes, proximal, intermediate);
    // var [axes, aX] = angleX(axes, intermediate, 'z');
    angles.Intermediate = {
        x: 0,
        y: 0,
        z: aZY.z
    };

    // Distal
    var [axes, aZY] = angleZY(axes, intermediate, distal);
    // var [axes, aX] = angleX(axes, distal, 'z');
    angles.Distal = {
        x: 0,
        y: 0,
        z: aZY.z
    };

    return angles;
}

export function armAngles(posePoints, side, handPoints) {
    var {body_n_z, shoulder, upper_arm, lower_arm, lower_arm_n_z, hand, hand_n_y} = calc_pose_vectors(posePoints, side);

    var angles = {};
    
    // Starting rotation axes
    var axes;
    {
        let x = side == "LEFT" ? shoulder.clone().negate() : shoulder.clone();
        let z = body_n_z.clone();
        let y = z.clone().cross(x);

        axes = new Axes(x, y, z);
    }

    // Upper Arm
    var [axes, aZY] = angleZY(axes, shoulder, upper_arm);
    var [axes, aX] = angleX(axes, lower_arm_n_z, 'z');
    angles.UpperArm = {
        x: aX.x,
        y: aZY.y,
        z: aZY.z
    };

    // Lower Arm
    var [axes, aZY] = angleZY(axes, upper_arm, lower_arm,);
    angles.LowerArm = {
        y: aZY.y,
        z: aZY.z
    };

    if (!handPoints) {
        // Lower Arm x-axis
        var [axes, aX] = angleX(axes, hand_n_y, 'y');
        angles.LowerArm.x = aX.x;

        // Hand
        var [axes, aZY] = angleZY(axes, lower_arm, hand);
        angles.Hand = {
            x: 0,
            y: aZY.y,
            z: aZY.z
        };

    } else {
        var {hand, hand_n_y} = calc_hand(handPoints, side);
        
        // Lower Arm x-axis
        var [axes, aX] = angleX(axes, hand_n_y, 'y');
        angles.LowerArm.x = aX.x;
    
        // Hand
        var [axes, aZY] = angleZY(axes, lower_arm, hand);
        angles.Hand = {
            x: 0,
            y: aZY.y,
            z: aZY.z
        }
    
        for (const f of [0, 1, 2, 3, 4]) {
            const fa = fingerAngles(handPoints, f, hand, axes);
            angles[fingerNames[f] + "Proximal"] = fa.Proximal;
            angles[fingerNames[f] + "Intermediate"] = fa.Intermediate;
            angles[fingerNames[f] + "Distal"] = fa.Distal;
        }

    }

    return angles;
}



