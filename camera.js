import * as posenet from '@tensorflow-models/posenet';
import _ from 'lodash'
import {check} from './check'

import { drawBoundingBox, drawKeypoints, drawSkeleton } from './demo_util';

const videoWidth = 600;
const videoHeight = 500;
const body = document.getElementsByTagName('body')[0]

// pose序列长度
const POSE_SEQ_LENGTH = 3;
// 最小分数
const POSE_MIN_CONFIDENCE = 0.1;
let posesArr = [];

async function setupCamera() {
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    throw new Error('Browser API navigator.mediaDevices.getUserMedia not available');
  }

  const video = document.createElement('video');
  body.appendChild(video)
  video.style.display = 'none'
  video.style.scaleX = '-1'
  video.width = videoWidth; 
  video.height = videoHeight;

  const stream = await navigator.mediaDevices.getUserMedia({
    'audio': false,
    'video': {
      facingMode: 'user',
      width: videoWidth,
      height: videoHeight,
    },
  });
  video.srcObject = stream;

  return new Promise((resolve) => {
    video.onloadedmetadata = () => {
      resolve(video);
    };
  });
}

async function loadVideo() {
  const video = await setupCamera();
  video.play();

  return video;
}

const defaultQuantBytes = 2;

const defaultMobileNetMultiplier = 0.75;
const defaultMobileNetStride = 16;
const defaultMobileNetInputResolution = 513;

const guiState = {
  algorithm: 'multi-pose',
  input: {
    architecture: 'MobileNetV1',
    outputStride: defaultMobileNetStride,
    inputResolution: defaultMobileNetInputResolution,
    multiplier: defaultMobileNetMultiplier,
    quantBytes: defaultQuantBytes
  },
  singlePoseDetection: {
    minPoseConfidence: 0.1,
    minPartConfidence: 0.5,
  },
  multiPoseDetection: {
    maxPoseDetections: 1,
    minPoseConfidence: 0.15,
    minPartConfidence: 0.1,
    nmsRadius: 30.0,
  },
  output: {
    showVideo: false,
    showSkeleton: true,
    showPoints: true,
    showBoundingBox: false,
  },
  net: null,
};

/**
 * Feeds an image to posenet to estimate poses - this is where the magic
 * happens. This function loops with a requestAnimationFrame method.
 */
function detectPoseInRealTime(video, net) {
  const canvas = document.createElement('canvas');
  body.appendChild(canvas)
  const ctx = canvas.getContext('2d');

  // since images are being fed from a webcam, we want to feed in the
  // original image and then just flip the keypoints' x coordinates. If instead
  // we flip the image, then correcting left-right keypoint pairs requires a
  // permutation on all the keypoints.
  const flipPoseHorizontal = true;

  canvas.width = videoWidth;
  canvas.height = videoHeight;

  async function poseDetectionFrame() {

    let poses = [];
    let minPoseConfidence;
    let minPartConfidence;
    let all_poses = await guiState.net.estimatePoses(video, {
      flipHorizontal: flipPoseHorizontal,
      decodingMethod: 'multi-person',
      maxDetections: guiState.multiPoseDetection.maxPoseDetections,
      scoreThreshold: guiState.multiPoseDetection.minPartConfidence,
      nmsRadius: guiState.multiPoseDetection.nmsRadius
    });

    poses = poses.concat(all_poses);
    minPoseConfidence = +guiState.multiPoseDetection.minPoseConfidence;
    minPartConfidence = +guiState.multiPoseDetection.minPartConfidence;

    ctx.clearRect(0, 0, videoWidth, videoHeight);

    if (guiState.output.showVideo) {
      ctx.save();
      ctx.scale(-1, 1);
      ctx.translate(-videoWidth, 0);
      ctx.drawImage(video, 0, 0, videoWidth, videoHeight);
      ctx.restore();
    }

    // For each pose (i.e. person) detected in an image, loop through the poses
    // and draw the resulting skeleton and keypoints if over certain confidence
    // scores
    check(updatePosesArr(poses))
    poses.forEach(({ score, keypoints }) => {
      if (score >= minPoseConfidence) {
        if (guiState.output.showPoints) {
          drawKeypoints(keypoints, minPartConfidence, ctx);
        }
        if (guiState.output.showSkeleton) {
          drawSkeleton(keypoints, minPartConfidence, ctx);
        }
        if (guiState.output.showBoundingBox) {
          drawBoundingBox(keypoints, ctx);
        }
      }
    });

    requestAnimationFrame(poseDetectionFrame);
  }

  poseDetectionFrame();
}

/**
 * Kicks off the demo by loading the posenet model, finding and loading
 * available camera devices, and setting off the detectPoseInRealTime function.
 */
export async function bindPage() {
  const net = await posenet.load({
    architecture: guiState.input.architecture,
    outputStride: guiState.input.outputStride,
    inputResolution: guiState.input.inputResolution,
    multiplier: guiState.input.multiplier,
    quantBytes: guiState.input.quantBytes
  });

  let video;

  try {
    video = await loadVideo();
  } catch (e) {
    throw e;
  }

  guiState.net = net
  detectPoseInRealTime(video, net);
}

function updatePosesArr(poses) {
  const pose = poses[0];

  // 忽略分数过小的
  if (!pose || pose.score < POSE_MIN_CONFIDENCE) {
    return
  }

  if (posesArr.length >= POSE_SEQ_LENGTH) {
    posesArr.pop()
  }
  posesArr.unshift(analyzePose(pose.keypoints))
  return posesArr;
}

// 7 左肘 8 右肘 9 左手腕 10 右手腕
function analyzePose(keypoints) {
  let obj = {
    leftWrist: keypoints[9].position,
    rightWrist: keypoints[10].position,
    leftElbow: keypoints[7].position,
    rightElbow: keypoints[8].position,
  }
  Object.assign(obj.leftWrist, { score: keypoints[9].score })
  Object.assign(obj.rightWrist, { score: keypoints[10].score })
  Object.assign(obj.leftElbow, { score: keypoints[7].score })
  Object.assign(obj.rightElbow, { score: keypoints[8].score })

  return obj
}



navigator.getUserMedia = navigator.getUserMedia ||
  navigator.webkitGetUserMedia || navigator.mozGetUserMedia;
// kick off the demo
// bindPage();