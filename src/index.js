import { bindPage, startVideo, stopVideo } from './camera'
import { setConfig } from './config'

// setConfig({
//     leftCB: () => {
//         console.log('zuo')
//     },
//     rightCB: () => {
//         console.log('you')
//     },
//     upCB: () => {
//         console.log('shang')
//     },
//     downCB: () => {
//         console.log('xia')
//     },
//     mode: 'all',
//     showCanvas: true,
//     videoWidth: 200,
//     videoHeight: 200
// })

bindPage()


export default {
    start: bindPage,
    setConfig,
    stopVideo
}