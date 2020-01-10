const DEFAULT_PRESSED = false
const DEFAULT_TIME = 0
const DEFAULT_POSITION = 0
const DEFAULT_VELOCITY = 0
const DEFAULT_TRACKER = null
const TRACKING_TIME = 50
const MIN_VELOCITY = 0.3
const MIN_ANIMATION_DISTANCE = 0.5
const SCROLL_TIME = 150
const INERTIAL_SCROLL_FACTOR = 0.8
const INERTIAL_ACCELERATION = 9

const Scroller = class {
    #container
    #content
    #pressed
    #startX
    #minX
    #maxX
    #left
    #lastLeft
    #velocity
    #lastTime
    #tracker
    #handler
    
    static of (container, content) {
        return new Scroller(container, content)
    }
    
    static getPosition (e) {
        let target = e
        const {changedTouches} = target
        if (changedTouches) {
            const [touch] = changedTouches
            if (!touch) {
                return DEFAULT_POSITION
            }
            target = touch
        }
        return {
            x: target.clientX,
            y: target.clientY
        }
    }
    
    /**
     * TODO 클릭에 대한 것은 이 녀석의 소관이 아니다. 얘는 단순히 스크롤러여야만 한다.
     * - 클릭은 외부에서 해당 컨텐츠롤 기반으로 어떤 컨텐츠가 클릭 되었는지 알려 줄 수 있도록 구현 되어야 하며 얘는 단순히 스크롤만 진행한다.
     *
     * 1. content를 주입받고 있지만 스크롤러가 나중에 view로 변화한다면 Renderer를 주입 받는것으로 변경한다.
     * 2. 화면을 그리는데 필요한 모든 값은 Renderer로 이전 된다.
     */
    constructor (container, content) {
        this.#container = container
        this.#content = content
        this.#pressed = false
        this.#startX = DEFAULT_POSITION
        this.#minX = DEFAULT_POSITION
        this.#maxX = this.getContentWidth() - this.#container.offsetWidth
        console.log(this.getContentWidth(), this.#container.offsetWidth)
        this.#left = DEFAULT_POSITION
        this.#lastLeft = DEFAULT_POSITION
        this.#velocity = DEFAULT_VELOCITY
        this.#lastTime = DEFAULT_TIME
        this.#tracker = DEFAULT_TRACKER
        this.#handler = new Map()
            .set('down', this.down.bind(this))
            .set('move', this.move.bind(this))
            .set('up', this.up.bind(this))
        this.bindEvent()
    }
    
    getContentWidth () {
        return Array.from(this.#content.children).reduce((accumulator, el) => {
            const {width, marginLeft, marginRight} = window.getComputedStyle(el)
            console.log(width, marginLeft, marginRight)
            return accumulator += [width, marginLeft, marginRight].reduce((accumulator, v) => accumulator += parseFloat(v), 0)
        }, 0)
    }
    
    /**
     1. transform이 진행되는 도중에 마우스가 클릭되는 경우 현재 top의 위치를 재설정 하고, transition 클래스를 제거하여 스크롤을 멈춥니다.
     2. 속도 트랙킹에서 사용되는 값들을 초기화 해 줍니다.
     - #startX는 현재 y의 위치입니다.
     - #lastTime은 마지막 인터렉션의 시간 입니다.
     - #lastTop은 마지막 top의 위치 입니다.
     */
    down (e) {
        e.preventDefault()
        e.stopPropagation()
        const {x} = Scroller.getPosition(e)
        this.#pressed = !DEFAULT_PRESSED
        this.#startX = x
        this.#velocity = DEFAULT_VELOCITY
        this.#lastTime = Date.now()
        this.#lastLeft = this.#left
        this.endTrackingVelocity()
        this.startTrackingVelocity()
    }
    
    startTrackingVelocity () {
        this.#tracker = setInterval(this.track.bind(this), TRACKING_TIME)
    }
    
    /**
     1. 터치가 시작된 후 부터 TRACKING_TIME 초 마다 실행하여 속력을 계산 합니다.
     2. 속력은 이동한 거리(현재 top의 위치 - 직전 top의 위치) / 경과한 시간(현재 시간 - 직전 시간)으로 구합니다.
     3. 마지막 시간은 현재 시간으로, 마지막 top의 위치는 현재 top의 위치로 매번 갱신 합니다.
     */
    track () {
        const now = Date.now()
        this.#velocity = (this.#left - this.#lastLeft) / (now - this.#lastTime)
        this.#lastTime = now
        this.#lastLeft = this.#left
    }
    
    endTrackingVelocity () {
        if (!this.#tracker) {
            return
        }
        clearInterval(this.#tracker)
        this.#tracker = null
    }
    
    /**
     1. 이동중인 좌표의 y값을 구합니다.
     2. 현재 위치의 이전 위치의 시작 Y 좌표값에서 현재 Y좌표값을 빼서, 이동한 만큼의 거리값을 얻습니다.
     3. 최종 위치에서 이동한 만큼의 Y값만큼 스크롤 이동 합니다.
     4. 다음 move 이벤트를 위해서
     */
    move (e) {
        e.preventDefault()
        e.stopPropagation()
        if (!this.#pressed) {
            return
        }
        const {x} = Scroller.getPosition(e)
        this.scroll(this.#left + this.#startX - x)
        this.#startX = x
    }
    
    /**
     1. 이동할 top의 값을 전달 받습니다.
     2. minimum과 maxmum을 비교한 뒤 content의 top을 변경 합니다.
     */
    scroll (left) {
        if (left > this.#maxX) {
            left = this.#maxX
        }
        if (left < this.#minX) {
            left = this.#minX
        }
        this.#content.style.transform = `translateX(${-(this.#left = left)}px)`
    }
    
    /**
     1. 터치 트랙킹을 종료 합니다.
     2. 최종 속력이 MIN_VELOCITY 보다 낮은 경우 관성 스크롤을 사용하지 않습니다.
     */
    up (e) {
        e.preventDefault()
        e.stopPropagation()
        this.endTrackingVelocity()
        if (!this.#pressed) {
            return this.#pressed = DEFAULT_PRESSED
        }
        this.#pressed = DEFAULT_PRESSED
        this.animateInertialScroll()
    }
    
    /**
     @description:
     inertialDistance: 총 거리를 관성 가속도로 나눈 값입니다. 관성 스크롤을 할 총 거리 입니다.
     tunedDistance: 관성 거리에 속력만큼 가감 합니다. 그 후 관성 지수를 곱하여 최종 거리를 조절 합니다.
     - INERTIAL_SCROLL_FACTOR를 값이 0에 수렴할수록 스크롤이 무뎌집니다.
     destination: 현재 top의 위치에 가야할 거리를 더한 최종 목적지 입니다.
     
     1. 경과 시간을 구하고 elapsed에 저장합니다.
     2. 최종 목적지인 destination에서 매번 감소해야하는 값을 구합니다.
     - tunedDistance(최종 관성 거리)를 음수로 만듭니다.
     - 지수적 감쇠함수에 경과 시간을 주입하여 점차적으로 0에 수렴하게 만들어 감속 시킵니다.
     - https://en.wikipedia.org/wiki/Exponential_decay
     - 시간 상수 SCROLL_TIME은 IOS 스크롤 표준 시간을 따릅니다.
     - https://developer.apple.com/documentation/uikit/uiscrollview#/apple_ref/doc/c_ref/UIScrollViewDecelerationRateNormal
     - 두 값을 곱하여 실제 목적지인 destination에서 차감한 거리만큼 스크롤 합니다.
     */
    animateInertialScroll () {
        if (Math.abs(this.#velocity) < MIN_VELOCITY) {
            return
        }
        const inertialDistance = this.getContentWidth() / INERTIAL_ACCELERATION
        const tunedDistance = INERTIAL_SCROLL_FACTOR * this.#velocity * inertialDistance
        const destination = Math.round(this.#left + tunedDistance)
        const f = () => {
            if (this.#pressed) {
                return
            }
            const elapsed = Date.now() - this.#lastTime;
            const distance = -tunedDistance * Math.exp(-elapsed / SCROLL_TIME)
            if (Math.abs(distance) < MIN_ANIMATION_DISTANCE) {
                return this.scroll(destination)
            }
            this.scroll(destination + distance)
            requestAnimationFrame(f)
        }
        requestAnimationFrame(f)
    }
    
    bindEvent () {
        const container = this.#container
        const down = this.#handler.get('down')
        const move = this.#handler.get('move')
        const up = this.#handler.get('up')
        container.addEventListener('mousedown', down, false)
        container.addEventListener('touchstart', down, false)
        container.addEventListener('mousemove', move, false)
        container.addEventListener('touchmove', move, false)
        container.addEventListener('mouseup', up, false)
        container.addEventListener('touchend', up, false)
        container.addEventListener('mouseleave', up, false)
        container.addEventListener('touchcancel', up, false)
    }
    
    unbindEvent () {
        const container = this.#container
        const down = this.#handler.get('down')
        const move = this.#handler.get('move')
        const up = this.#handler.get('up')
        container.removeEventListener('mousedown', down, false)
        container.removeEventListener('touchstart', down, false)
        container.removeEventListener('mousemove', move, false)
        container.removeEventListener('touchmove', move, false)
        container.removeEventListener('mouseup', up, false)
        container.removeEventListener('touchend', up, false)
        container.removeEventListener('mouseleave', up, false)
        container.removeEventListener('touchcancel', up, false)
    }
    
}

Scroller.of(
  document.querySelector('#content'),
  document.querySelector('#view')
)
