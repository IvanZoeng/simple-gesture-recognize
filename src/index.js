import {bindPage} from './camera'
import {setLeftCB, setRightCB, setUpCB, setDownCB} from './check'

bindPage()

export default {
    start: bindPage,
    setLeftCB,
    setRightCB,
    setUpCB,
    setDownCB
}