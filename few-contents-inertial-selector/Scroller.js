const DEFAULT_PRESSED = false
const DEFAULT_TIME = 0
const DEFAULT_POSITION = 0
const DEFAULT_VELOCITY = 0
const DEFAULT_TRACKER = null
const TRACKING_TIME = 50
const MIN_VELOCITY = 0.3
const MIN_ANIMATION_DISTANCE = 0.5
const SCROLL_TIME = 325
const INERTIAL_SCROLL_FACTOR = 0.8
const INERTIAL_ACCELERATION = 1500
const HEIGHT_OF_LIST_ITEM = 34
const HALF_HEIGHT_OF_LIST_ITEM = Math.floor(HEIGHT_OF_LIST_ITEM / 2)
const COUNT_OF_LIST_ITEM = 9
const HALF_COUNT_OF_LIST = Math.floor(COUNT_OF_LIST_ITEM / 2)
const HALF_COUNT_EXCEPT_CENTER = Math.floor(HALF_COUNT_OF_LIST - 1)
const DEGREE = 20
const DISTANCE_OF_Z = 50

const Scroller = class {
    #container
    #element
    #elements
    #pressed
    #startedY
    #top
    #lastTop
    #velocity
    #lastTime
    #tracker
    #handler
    
    static of (container, element) {
        return new Scroller(container, element)
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

    constructor (container, element) {
        this.#container = container
        this.#element = element
        this.#pressed = false
        this.#startedY = DEFAULT_POSITION
        this.#top = DEFAULT_POSITION
        this.#lastTop = DEFAULT_POSITION
        this.#velocity = DEFAULT_VELOCITY
        this.#lastTime = DEFAULT_TIME
        this.#tracker = DEFAULT_TRACKER
        this.#handler = new Map()
            .set('down', this.down.bind(this))
            .set('move', this.move.bind(this))
            .set('up', this.up.bind(this))
        this.setElements()
        this.bindEvent()
        this.scroll(0)
    }
    
    scroll (top) {
        const elements = this.#elements
        const length = COUNT_OF_LIST_ITEM
        /**
            1. Top의 위치를 기반으로 기준이 되는 엘리먼트를 찾는다.
            2. index는 top의 변위가 엘리먼트 높이 / 2만큼 증가했을때 변화한다.
                - index는 -5 -4 -3 -2 -1 0 1 2 3 4 5.. 등으로 증감 또는 가감한다.
        */
        const index = Math.floor((top + HEIGHT_OF_LIST_ITEM / 2) / HEIGHT_OF_LIST_ITEM)

        // element index of center
        const midestIndex = this.getIndex(index, length)
        
        /**
            1. top의 위치는 아이템의 높이가 누적된 값이다.
            2. index는 아이템의 높이가 누적된 개수이다. 
            3. top의 변위량을 구한다.
                - top(아이템의 높이가 누적된것 + 마우스가 추가로 움직인 거리) - (index * 아이템의 높이)(top에 누적된 아이템의 높이개수)
                - 위에서 구해진 값은 가운데 블록이 그려져야 할 위치가 된다.
        */
        let additionalPosition = -(top - index * HEIGHT_OF_LIST_ITEM)
    
        /**
            1. 리스트의 높이를 기준으로 정중앙을 구한다.
            2. 아이템의 높이의 절반만큼 차감하여 렌더링 포지션의 시작지점을 구한다.
        */
        const positionAlignY = this.#element.offsetHeight / 2 - HALF_HEIGHT_OF_LIST_ITEM
        
        /**
            1. 인덱스는 마우스가 아이템 높이의 절반만큼 움직일때 증가하기 때문에, 마우스가 추가적으로 움직이는 변위량은 아이템 높이의 절반까지이다. 
                - 34px의 아이템 높이 기준.
                - 중앙값은 17px 
                - -0 ~ 17 ~ 0의 마우스 위치값을 갖는다.
            2. 현재 움직인 추가적인 거리를 아이템높이의 절반값으로 나누어 얼마만큼 움직였는지 percent를 구한다.
        */
        const movedPercent = additionalPosition / HALF_HEIGHT_OF_LIST_ITEM
        
        /**
            1. rotateX의 각도는 정중앙을 기점으로 상수값만큼 위로 아래로 균일하게 증감한다.
            2. 이 스크롤러는 최소한의 div만으로 스크롤해야 하기 때문에 스크롤시 추가적인 스크롤 값이 필요하다.
            3. 따라서 마우스의 위치에 따라 계산된 movePercent를 기본으로, 추가해야할 각도를 계산한다.
            4. 인덱스는 아이템 높이의 절반마다 증가하므로, 추가해야할 각도 또한 2로 나누어준다.
        */
        const additionalDegree = -(movedPercent * DEGREE) / 2
        
        /**
            1. 투명도는 1을 기점으로, 아이템의 개수로 나누어서 각 아이템당 얼마만큼의 투명도를 가지게 할 지를 결정짓는다.
            2. 스크롤시에 오파시티값도 계속 변해야 하므로 추가해야할 값을 계산한다.
        */
        const OPACITY = 1
        const basedOpacity = OPACITY / HALF_COUNT_OF_LIST
        const additionalOpacity = movedPercent * basedOpacity / 2
        
        console.log('additionalOpacity: ', additionalOpacity)
        
        // midest
        const center = elements[midestIndex]
        center.style.transform = ` 
            translateY(${positionAlignY}px)
            translateY(${additionalPosition}px) 
            rotateX(${additionalDegree}deg)
            translateZ(${DISTANCE_OF_Z}px)
        `
        center.style.opacity = OPACITY + additionalOpacity
        
        for (let i = 1; i <= HALF_COUNT_OF_LIST; i++) {
            const opacity = 1 - i * basedOpacity
            
            // above side
            const above = elements[this.getIndex(midestIndex - i, length)]
            above.style.transform = `
                translateY(${positionAlignY}px) 
                translateY(${additionalPosition - i * HEIGHT_OF_LIST_ITEM}px) 
                rotateX(${DEGREE * i + additionalDegree}deg)
                translateZ(${DISTANCE_OF_Z}px)
            `
            above.style.opacity = opacity + additionalOpacity
            
            // below side
            const below = elements[this.getIndex(midestIndex + i, length)]
            below.style.transform = `
                translateY(${positionAlignY}px) 
                translateY(${additionalPosition  + i * HEIGHT_OF_LIST_ITEM}px)
                rotateX(-${DEGREE * i - additionalDegree}deg)
                translateZ(${DISTANCE_OF_Z}px)
            `
            below.style.opacity = opacity - additionalOpacity
        }
        this.#top = top
    }
    
    setElements () {
        this.#elements = document.querySelectorAll('.item')
    }
    
    /**
        1. transform이 진행되는 도중에 마우스가 클릭되는 경우 현재 top의 위치를 재설정 하고, transition 클래스를 제거하여 스크롤을 멈춥니다.
        2. 속도 트랙킹에서 사용되는 값들을 초기화 해 줍니다.
            - #startedY는 현재 y의 위치입니다.
            - #lastTime은 마지막 인터렉션의 시간 입니다.
            - #lastTop은 마지막 top의 위치 입니다.
    */
    down (e) {
        e.preventDefault()
        e.stopPropagation()
        const {y} = Scroller.getPosition(e)
        this.#pressed = !DEFAULT_PRESSED
        this.#startedY = y
        this.#velocity = DEFAULT_VELOCITY
        this.#lastTime = Date.now()
        this.#lastTop = this.#top
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
        this.#velocity = (this.#top - this.#lastTop) / (now - this.#lastTime)
        this.#lastTime = now
        this.#lastTop = this.#top
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
        const {y} = Scroller.getPosition(e)
        this.scroll(this.#top + this.#startedY - y)
        this.#startedY = y
    }

    /**
        1. 인덱스가 음수인 경우 해당 위치의 엘리먼트를 순차적으로 찾기 위한 메소드입니다.
        2. length가 5이고 i가 -5인경우 실제로는 0번째 값을 반환 받아야 합니다. (순환식)
        3. -5 % 5는 0이므로 전체 길이인 5에서 -0을 더하여 다시 한번 재귀호출 하여 5 % 5의 결과인 0을 반환 받습니다.
    */
    getIndex (i, length) {
        if (i >= length) {
            return i % length
        }
        if (i < 0) {
            return this.getIndex(length + (i % length), length)
        }
        return i
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
        inertialDistance: 총 높이를 관성 가속도로 나눈 값입니다. 관성 스크롤을 할 총 거리 입니다.
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
        let destination = this.#top // 기본적으로 목적지는 탑이다.
        let tunedDistance // 추가적인 거리는 아직 미정이다.
        if (Math.abs(this.#velocity) > MIN_VELOCITY) { // 애니메이션이 필요한 경우라면
            tunedDistance = INERTIAL_SCROLL_FACTOR * this.#velocity * INERTIAL_ACCELERATION
            destination += tunedDistance // 목적지 + 추가적인 거리를 넣는다.
        }
        destination = Math.round(destination / HEIGHT_OF_LIST_ITEM) * HEIGHT_OF_LIST_ITEM // 목적지를 원소 개수만큼 나눈 다음 다시 곱해서 top을 맞춘돠.
        tunedDistance = destination - this.#top // 계산이 완료된 목적지에서 원래 탑을 빼주면 그 값이 추가적인 거리이다.
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
