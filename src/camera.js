import * as posenet from '@tensorflow-models/posenet';
import _ from 'lodash'
import { check } from './check'
import { getConfig } from './config'
import * as tf from '@tensorflow/tfjs'

import { drawBoundingBox, drawKeypoints, drawSkeleton } from './demo_util';

// pose序列长度
const POSE_SEQ_LENGTH = 3;
// 最小分数
const POSE_MIN_CONFIDENCE = 0.1;
let posesArr = [];
let stream;
let video;
let canvas;

async function setupCamera() {
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    throw new Error('Browser API navigator.mediaDevices.getUserMedia not available');
  }

  video = document.createElement('video');
  getConfig().parentNode.appendChild(video)
  video.style.display = 'none'
  video.style.scaleX = '-1'
  video.width = getConfig().videoWidth;
  video.height = getConfig().videoHeight;

  await startVideo()

  return new Promise((resolve) => {
    video.onloadedmetadata = () => {
      resolve(video);
    };
  });
}

async function loadVideo() {
  video = await setupCamera();
  video.play();

  return video;
}

export function stopVideo() {
  if (stream && stream.getVideoTracks) {
    stream.getVideoTracks()[0].stop()
    canvas.style.display = 'none'
  }
}

export async function startVideo() {
  stream = await navigator.mediaDevices.getUserMedia({
    'audio': false,
    'video': {
      facingMode: 'user',
      width: getConfig().videoWidth,
      height: getConfig().videoHeight,
    },
  });

  canvas && (canvas.style.display = 'block')
  video.srcObject = stream;
}

const defaultQuantBytes = 2;

const defaultMobileNetMultiplier = 0.5;
const defaultMobileNetStride = 32;
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
    showVideo: getConfig().showVideo,
    showSkeleton: getConfig().showSkeleton,
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
  canvas = document.createElement('canvas');
  getConfig().parentNode.appendChild(canvas)
  if (getConfig().showCanvas === false) {
    canvas.style.display = 'none'
  }
  const ctx = canvas.getContext('2d');

  // since images are being fed from a webcam, we want to feed in the
  // original image and then just flip the keypoints' x coordinates. If instead
  // we flip the image, then correcting left-right keypoint pairs requires a
  // permutation on all the keypoints.
  const flipPoseHorizontal = true;

  canvas.width = getConfig().videoWidth;
  canvas.height = getConfig().videoHeight;

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

    ctx.clearRect(0, 0, getConfig().videoWidth, getConfig().videoHeight);

    if (getConfig().showVideo) {
      ctx.save();
      ctx.scale(-1, 1);
      ctx.translate(-getConfig().videoWidth, 0);
      ctx.drawImage(video, 0, 0, getConfig().videoWidth, getConfig().videoHeight);
      ctx.restore();
    }

    // For each pose (i.e. person) detected in an image, loop through the poses
    // and draw the resulting skeleton and keypoints if over certain confidence
    // scores
    check(updatePosesArr(poses))
    poses.forEach(({ score, keypoints }) => {
      if (score >= minPoseConfidence) {
        if (getConfig().showPoints) {
          drawKeypoints(keypoints, minPartConfidence, ctx);
        }
        if (getConfig().showSkeleton) {
          drawSkeleton(keypoints, minPartConfidence, ctx);
        }
        if (getConfig().showBoundingBox) {
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
  // const net = await posenet.load({
  //   architecture: guiState.input.architecture,
  //   outputStride: 16,
  //   inputResolution: guiState.input.inputResolution,
  //   multiplier: guiState.input.multiplier,
  //   quantBytes: guiState.input.quantBytes
  // });

  // const net = await posenet.load({
  //   architecture: 'ResNet50',
  //   outputStride: 32,
  //   inputResolution: 257,
  //   quantBytes: 2,
  // });
  const modelOrigin = getConfig().modelOrigin === 'http'
    ? 'http://106.14.120.30:9090/model/model.json'
    : 'https://xcx.cjrsg.cn/imagesForDangjian/jiangyufeng/model/model.json'
  const model = await tf.loadGraphModel(modelOrigin)

  const net = new posenet.PoseNet(new posenet.MobileNet(model, 16), 513)

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

export function getPoseArr() {
  return posesArr
}

console.log(posenet)
