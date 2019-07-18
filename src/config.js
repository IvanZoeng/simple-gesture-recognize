import _ from 'lodash' 

const defaultConfig = {
    leftCB: () => {},
    rightCB: () => {},
    upCB: () => {},
    downCB: () => {},
    mode: 'h',
    showCanvas: true,
    showVideo: true,
    showSkeleton: true,
    showPoints: true,
    showBoundingBox: false,
    videoWidth: 600,
    videoHeight: 500,
    parentNode: document.getElementsByTagName('body')[0],
    modelOrigin: 'http',
    minPoseConfidence: 0.1,
    minPartConfidence: 0.5,
    maxPoseDetections: 1,
    throttleTime: 500
}

let config = _.cloneDeep(defaultConfig)

function mergeConfig(userConfig) {
    for (let key in config) {
        if (userConfig[key] !== void 0) {
            config[key] = userConfig[key]
        }
    }
}

export function setConfig(userConfig) {
    mergeConfig(userConfig)
}


export function getConfig() {
    return config
}