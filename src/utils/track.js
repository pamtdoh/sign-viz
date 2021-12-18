import { Vector3 } from "three";

export function landmarksToVector3(landmarks, normFactor={x: 16/9, y: 1, z: 16/9}) {
    return landmarks.map(p => (p.length == 0)
        ? new Vector3(NaN, NaN, NaN)
        : new Vector3(
            p[0] * normFactor.x,
            (1-p[1]) * normFactor.y,
            -p[2] * normFactor.z
        ));
}
