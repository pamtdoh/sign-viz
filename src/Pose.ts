import * as THREE from 'three';

type point = [number, number, number]

export class Pose {
    static POSE_NUM_LANDMARKS = 33;
    static POSE_CONNECTIONS: Array<[number, number]> = [
        [0, 1], [1, 2], [2, 3], [3, 7], [0, 4], [4, 5],
        [5, 6], [6, 8], [9, 10], [11, 12], [11, 13],
        [13, 15], [15, 17], [15, 19], [15, 21], [17, 19],
        [12, 14], [14, 16], [16, 18], [16, 20], [16, 22],
        [18, 20], [11, 23], [12, 24], [23, 24], [23, 25],
        [24, 26], [25, 27], [26, 28], [27, 29], [28, 30],
        [29, 31], [30, 32], [27, 31], [28, 32]
    ];

    static HAND_NUM_LANDMARKS = 21;
    static HAND_CONNECTIONS: Array<[number, number]> = [
        [0, 1], [0, 5], [9, 13], [13, 17], [5, 9], [0, 17],
        [1, 2], [2, 3], [3, 4],
        [5, 6], [6, 7], [7, 8],
        [9, 10], [10, 11], [11, 12],
        [13, 14], [14, 15], [15, 16],
        [17, 18], [18, 19], [19, 20]
    ];

    numLandmarks: number;
    connections: Array<[number, number]>;
    landmarks: Array<point>;

    group: THREE.Group;
    points: THREE.Points;
    segments: THREE.LineSegments;

    constructor(numLandmarks: number, connections: Array<[number, number]>) {
        this.numLandmarks = numLandmarks
        this.connections = connections

        this.createPoints();
        this.createSegments();

        this.group = new THREE.Group();
        this.group.add(this.points, this.segments);
    }

    static newPose() {
        return new Pose(this.POSE_NUM_LANDMARKS, this.POSE_CONNECTIONS);
    }

    static newHand() {
        return new Pose(this.HAND_NUM_LANDMARKS, this.HAND_CONNECTIONS);
    }

    createPoints() {
        const pointsGeometry = new THREE.BufferGeometry();

        const positions = new Float32Array(this.numLandmarks * 3);
        pointsGeometry.setAttribute(
            'position',
            new THREE.BufferAttribute(positions, 3));

        this.points = new THREE.Points(pointsGeometry);
    }

    createSegments() {
        const segmentsGeometry = new THREE.BufferGeometry();

        const positions = new Float32Array(this.connections.length * 6);
        segmentsGeometry.setAttribute(
            'position',
            new THREE.BufferAttribute(positions, 3));

        this.segments = new THREE.LineSegments(segmentsGeometry);
    }

    updateLandmarks(landmarks: Array<point>) {
        this.landmarks = landmarks;


        // Create modified landmarks adjusted to world space
        const localLandmarks = landmarks.map(p => {
            const normFactor = {
                x: 16/9, y: 1, z: 1
            }
        
            return {
                x: (p[0] - 0.5) * normFactor.x,
                y: (0.5 - p[1]) * normFactor.y,
                z: -p[2] * normFactor.z
            }
        });


        // Update pose points
        const pointPositions = this.points.geometry.attributes.position;
        
        const pointArray = pointPositions.array as Float32Array;
        for (let i = 0; i < this.numLandmarks; i++) {
            const p = localLandmarks[i];
            pointArray.set([p.x, p.y, p.z], i*3);
        }
        
        pointPositions.needsUpdate = true;
        

        // Update pose segments
        const segmentPositions = this.segments.geometry.attributes.position;
        
        const segmentArray = segmentPositions.array as Float32Array;
        for (let i = 0; i < this.connections.length; i++) {
            const [c1, c2] = this.connections[i];
            
            const p1 = localLandmarks[c1];
            const p2 = localLandmarks[c2];
            
            segmentArray.set([p1.x, p1.y, p1.z, p2.x, p2.y, p2.z], i*6);
        }

        segmentPositions.needsUpdate = true;
    }
}