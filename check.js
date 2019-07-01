import { bindPage, getPosesArr } from './camera'

const SCORE_THRESHOLD = 0.1
const MAIN_THRESHOLD = 30
const CROSS_THRESHOLD = 10
let isDetectHorizontal = true

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
    if (rightScore > SCORE_THRESHOLD) {
        deltaX = frame.rightWrist.x - frame_last.rightWrist.x;
        deltaY = frame.rightWrist.y - frame_last.rightWrist.y;
    } else if (leftScore > SCORE_THRESHOLD) {
        deltaX = frame.leftWrist.x - frame_last.leftWrist.x;
        deltaY = frame.leftWrist.y - frame_last.leftWrist.y;
    } else {
        return;
    }

    const k = Math.abs(deltaY / deltaX);

    if (isDetectHorizontal && k < 0.3) {
        if (deltaX > MAIN_THRESHOLD) {
            console.log('right')
        } else if (deltaX < -MAIN_THRESHOLD) {
            console.log('left')
        }
    }

    if (!isDetectHorizontal && k > 3) {
        if (deltaY > MAIN_THRESHOLD) {
            console.log('up')
        } else if (deltaY < -MAIN_THRESHOLD) {
            console.log('down')
        }
    }
}
