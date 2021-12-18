function htmlToElement(html) {
    var template = document.createElement('template');
    html = html.trim(); // Never return a text node of whitespace as the result
    template.innerHTML = html;
    return template.content.firstChild;
}

function isLandmarkEmpty(landmark) {
    return landmark.every(x => x[0] == 0 && x[1] == 0 && x[2] == 0);
}

const frame_struct = {
    pose: [33, 4],
    face: [468, 3],
    lh: [21, 3],
    rh: [21, 3]
};

const frame_size = Object.values(frame_struct).reduce((r, v) => r + v[0] * v[1], 0);

const landmarks_pos = function() {
    let pos = 0;
    let locs = {};
    for (let [name, l] of Object.entries(frame_struct)) {
        locs[name] = pos;
        pos += l[0] * l[1];
    }
    return locs;
}();

function getFrameData(array) {
    const frameData = {};
    for (const [name, pos] of Object.entries(landmarks_pos)) {
        const [joints, data] = frame_struct[name];

        const landmark = [];
        for (let i = 0; i < joints; i++) {
            landmark.push(Array.from(array.slice(pos + i * data, pos + (i+1) * data)));
        }
        
        frameData[name] = landmark;
    }

    return frameData;
}

const processTrackBuffer = (buffer) => {
    const trackLength = buffer.byteLength / (frame_size * Float32Array.BYTES_PER_ELEMENT);

    const frames = [];
    for (let i = 0; i < trackLength; i++) {
        frames.push(new Float32Array(
            buffer,
            i * frame_size * Float32Array.BYTES_PER_ELEMENT,
            frame_size
        ))
    }

    const landmarks = frames.map(getFrameData);
    return landmarks;
};

class TrackControls {

    constructor(onPoseUpdate) {
        this.onPoseUpdate = onPoseUpdate;
        this.container = this.createControls();
        this.track = [];
    }

    setTrack(track) {
        this.track = track;

        const frameSlider = this.container.querySelector(".frame-slider");
        frameSlider.value = 0;
        frameSlider.min = 0;
        frameSlider.max = this.track.length - 1;
        this.onFrame(0);
    }

    createControls() {
        const template =
        `<div class="track-controls" style="position: fixed; right: 0; bottom: 0; background-color: white; width: 400px; font-family: sans-serif;">
            <div style="margin: 10px;">
                <input type="file" class="track-file">
                <div>Frame <span class="frame-index-label"></span>:</div>
                <input class="frame-slider" type="range" min="0">
                <div style="display: grid; grid-template-columns: 1fr 1fr;">
                    <div class="pose-label">Pose</div>
                    <div class="face-label">Face</div>
                    <div class="left-hand-label">Left Hand</div>
                    <div class="right-hand-label">Right Hand</div>
                </div>
            </div>
        </div>`;
        document.body.appendChild(htmlToElement(template));
        
        const container = document.querySelector(".track-controls");
        const trackFile = document.querySelector(".track-file");
        const frameSlider = container.querySelector(".frame-slider");

        trackFile.addEventListener("change", async () => {
            const file = trackFile.files[0];
            const buffer = await file.arrayBuffer();
            this.setTrack(processTrackBuffer(buffer));
        });
        

        frameSlider.addEventListener('input', () =>
            this.onFrame(frameSlider.value)
        );

        return container;
    }

    onFrame(index) {
        const frame = this.track[index];

        const container = this.container;
    
        const poseLabel = container.querySelector(".pose-label");
        const faceLabel = container.querySelector(".face-label");
        const leftHandLabel = container.querySelector(".left-hand-label");
        const rightHandLabel = container.querySelector(".right-hand-label");
        const frameIndexLabel = container.querySelector(".frame-index-label");

    
        poseLabel.style.color = isLandmarkEmpty(frame.pose) ? "red" : "black";
        faceLabel.style.color = isLandmarkEmpty(frame.face) ? "red" : "black";
        leftHandLabel.style.color = isLandmarkEmpty(frame.lh) ? "red" : "black";
        rightHandLabel.style.color = isLandmarkEmpty(frame.rh) ? "red" : "black";
    
        frameIndexLabel.textContent = index;
    
        this.onPoseUpdate(frame.pose, frame.lh, frame.rh);
    }
}

export default TrackControls;