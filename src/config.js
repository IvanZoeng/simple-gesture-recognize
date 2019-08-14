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
    throttleTime: 500,
    verticalPercent: 10,
    horizonalPercent: 10,
    showConfig: false,
    poseSeqLength: 3
}

// const defaultConfig = {
//     leftCB: () => {console.log('l')},
//     rightCB: () => {console.log('r')},
//     upCB: () => {console.log('u')},
//     downCB: () => {console.log('d')},
//     mode: 'all',
//     showCanvas: true,
//     showVideo: true,
//     showSkeleton: true,
//     showPoints: true,
//     showBoundingBox: false,
//     videoWidth: window.innerWidth,
//     videoHeight: window.innerHeight,
//     parentNode: document.getElementsByTagName('body')[0],
//     modelOrigin: 'http',
//     minPoseConfidence: 0.1,
//     minPartConfidence: 0.5,
//     maxPoseDetections: 1,
//     throttleTime: 20,
//     verticalPercent: 2,
//     horizonalPercent: 2,
//     showConfig: true,
//     poseSeqLength: 3
// }

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

    if(getConfig().showConfig) {
        console.log(getConfig())
    }
}


export function getConfig() {
    return config
}