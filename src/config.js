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
    modelOrigin: 'http'
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