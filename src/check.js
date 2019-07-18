import _ from 'lodash'
import { getConfig } from './config'

const VERTICAL_THRESHOLD = getConfig().videoHeight * getConfig().verticalPercent / 100
const HORIZOTAL_THRESHOLD = getConfig().videoWidth * getConfig().horizonalPercent / 100
const MIN_PART_CONFIDENCE = getConfig().minPartConfidence

function isDetectHorizonal() {
    return getConfig().mode === 'h' || getConfig().mode === 'all'
}

function isDetectVertical() {
    return getConfig().mode === 'v' || getConfig().mode === 'all'
}

export function check(val) {
    if (!val) {
        return;
    }

    const frame = val[0];
    const frame_last = val[2];

    if (!frame_last) {
        return
    }

    const rightScore = Math.min(
        frame.rightWrist.score,
        frame_last.rightWrist.score
    );
    const leftScore = Math.min(
        frame.leftWrist.score,
        frame_last.leftWrist.score
    );

    let deltaX, deltaY;

    // 右手满足时优先用右手，否则用左手，都不符合时退出
    if (rightScore > MIN_PART_CONFIDENCE) {
        deltaX = frame.rightWrist.x - frame_last.rightWrist.x;
        deltaY = frame.rightWrist.y - frame_last.rightWrist.y;
    } else if (leftScore > MIN_PART_CONFIDENCE) {
        deltaX = frame.leftWrist.x - frame_last.leftWrist.x;
        deltaY = frame.leftWrist.y - frame_last.leftWrist.y;
    } else {
        return;
    }

    const k = Math.abs(deltaY / deltaX);

    if (isDetectHorizonal() && k < 0.3) {
        if (deltaX > HORIZOTAL_THRESHOLD) {
            handleCheck('right')
        } else if (deltaX < -HORIZOTAL_THRESHOLD) {
            handleCheck('left')
        }
    }

    if (isDetectVertical() && k > 3) {
        if (deltaY > VERTICAL_THRESHOLD) {
            handleCheck('down')
        } else if (deltaY < -VERTICAL_THRESHOLD) {
            handleCheck('up')
        }
    }
}

let handleCheck = _.throttle(
    function (tip) {
        switch (tip) {
            case "left":
                getConfig().leftCB()
                break;
            case "down":
                getConfig().downCB()
                break;
            case "right":
                getConfig().rightCB()
                break;
            case "up":
                getConfig().upCB()
                break;
        }
    }, getConfig().throttleTime, {
        trailing: false
    })
