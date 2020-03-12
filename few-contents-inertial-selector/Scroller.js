const DEFAULT_PRESSED = false
const DEFAULT_TIME = 0
const DEFAULT_POSITION = 0
const DEFAULT_VELOCITY = 0
const DEFAULT_TRACKER = null
const TRACKING_TIME = 50
const MIN_VELOCITY = 0.3
const MIN_ANIMATION_DISTANCE = 0.3
const SCROLL_TIME = 325
const INERTIAL_SCROLL_FACTOR = 0.8
const INERTIAL_ACCELERATION = 1000
const HEIGHT_OF_LIST_ITEM = 34
const HALF_HEIGHT_OF_LIST_ITEM = Math.floor(HEIGHT_OF_LIST_ITEM / 2)
const COUNT_OF_LIST_ITEM = 7
const HALF_COUNT_OF_LIST = Math.floor(COUNT_OF_LIST_ITEM / 2)
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
            여기서의 index값은 시작부터 몇칸 갔는가 입니다.
            0. 원래 인덱스를 구할때는 소수점제거(높이 / 높이)로 구할 수 있다.
            1. 그러나 우리가 구현하고자 하는 스크롤러는 절반이 증가하면 인덱스가 1 증가해야 한다.
            2. 그렇기 때문에 원소의 높이 / 2 + top의 결과값에 원래 엘리먼트의 높이로 나누어준다.
            3. Top의 위치를 기반으로 기준이 되는 엘리먼트를 찾는다.
            4. index는 top의 변위가 엘리먼트 높이 / 2만큼 증가했을때 변화한다.
                - index는 -5 -4 -3 -2 -1 0 1 2 3 4 5.. 등으로 증감 또는 가감한다.
        */
        const index = Math.floor((top + HEIGHT_OF_LIST_ITEM / 2) / HEIGHT_OF_LIST_ITEM)
        
        

        // element index of center
        /*
            여기서의 midestIndex는 몇번째 엘리먼트가 정 중앙에 위치해야 하는가 입니다.
        */
        const midestIndex = this.getIndex(index, length)
        
        /**
            additionalPosition는 블록이 이동하는 위치값이다. 
            1. positionAlignY으로 먼저 정중앙에 렌더링한다. 
            2. 그 후 additionalPosition를 사용해서 중앙에 있는 엘리먼트가 이동하게 만드는 방식이다.
            3. index는 스크롤이 엘리먼트의 높이의 절반만큼 증가할때마다 증가한다. 
            4. top(아이템의 높이가 누적된것 + 마우스가 추가로 움직인 거리)에서 (index * 아이템의 높이)를 차감하면 정중앙에 위치해야할 엘리먼트의 위치가 계산된다.
            5. 스크롤을 아래로 진행하여, index가 0이고 top이 -10인경우를 생각해보면 처음에 positionAlignY를 사용해서 정중앙에 렌더링 했을 것이다.
            6. 그 후 (-10 - 0)을 했기 때문에 -10위치에 0번째 엘리먼트가 그려진다. 
            7. 하지만 엘리먼트 높이의 절반만큼 스크롤이 아래로 진행된 경우 index가 증가하게 되어 -1이 된다.
            9. index가 변경되면 -1번째 엘리먼트가 다시 정중앙에 그려지게 되고, 그 후 현재 위치값을 additionalPosition만큼 이동시키게 되는 것이다.
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
//        console.log(movedPercent)
        
        /**
            additionalDegree는 정중앙 엘리먼트를 기준으로 x축으로 얼마만큼 회전시켜서 롤링하게 만들어줄 것인가이다. 
            1. rotateX의 각도(DEGREE)는 정중앙(0deg)을 기점으로 상수값만큼 위로 아래로 균일하게 증감한다.
            2. 0번째 엘리먼트가 아래로 스크롤될때 movedPercent에 DEGREE를 곱하여 몇 퍼센트를 이동했는지 구할 수 있다.
            3. 그런데, 우리의 스크롤러는 엘리먼트의 높이값의 절반만큼 증가할때마다 인덱스가 증가하는 방식이다.
            4. 아래로 스크롤하여 인덱스가 증가하여 -1이 된 경우, positionAlignY으로 정중앙에 해당 엘리먼트를 다시 렌더링한다.
            5. 그 후 얼마만큼 기울여 줄 것인지를 결정해야 한다.
            6. 정확히 index는 엘리먼트 높이값의 절반마다 증가하므로 우리도 DEGREE(20기준) 0도부터 -10도만큼 엘리먼트의 이동에 따라 계산해주어야 한다.
            7. 즉 index가 0일때 스크롤을 아래로 계속 진행할때 -10도까지 돌리다가, index가 변경되어 -1번째 엘리먼트가 정중앙에 그려지면,
               -1번째 엘리먼트의 시작 각도는 10도만큼 기울어져 있어야 한다는 이야기이다. 그 후 계속 스크롤이 진행되면 기울인 각도는 점점 감소하여 0이 되고 -10이 되며 
               다시 index가 변경될 것이다.
        */
        const additionalDegree = -(movedPercent * DEGREE) / 2
//        console.log(index, additionalDegree)
        
        /**
            additionalOpacity는 마우스의 움직임에 따라 좀 더 부드럽게 opacity가 조절될 수 있도록 하는 값이다.
            만약 이 값이 없다면 index의 증가치에 따라 단순히 opacity값들이 덜컥 거리며 변경되게 된다. 
            내가 원하는것은 마우스의 위치에 따라 opacity가 조금씩 연해지기를 바란다. 
            
            
            0. 기본적인 투명도는 1이지만, 정 가운데는 1이고 양쪽 맨 끝은 0이 되어야 한다. 
            1. basedOpacity: 기본적인투명도 / 전체목록의 개수 / 2를 하여 얼마만큼 증감 시키면 될지 계산한다. 
            2. movedPercent에 증가시켜야할 basedOpacity를 계산한다. 마지막으로 인덱스는 엘리먼트높이의 절반마다 증가하므로 2로 나누어준다.
            3. 정가운데 위치해야하는 엘리먼트는 index가 변경되기 전까지 위로 스크롤 되든 아래로 스크롤 되든 투명도가 감소되어야 한다. 
               따라서, additionalOpacity는 스크롤 방향에 따라 양수와 음수가 나올 수 있으므로 절대값으로 만들어서 차감한다.
            4. 위로 스크롤시 additionalOpacity는 음수가 나오므로, 위쪽에 위치한 엘리먼트들은 점점 투명해져야하므로 더해주고, 
               아래쪽의 엘리먼트들은 진해져야 하므로 차감한다.
        */
        const OPACITY = 1
        const basedOpacity = OPACITY / HALF_COUNT_OF_LIST
        const additionalOpacity = movedPercent * basedOpacity / 2
//        console.log(additionalOpacity)
        
        
        // midest
        const center = elements[midestIndex]
        center.style.transform = ` 
            translateY(${positionAlignY}px)
            translateY(${additionalPosition}px) 
            rotateX(${additionalDegree}deg)
            translateZ(${DISTANCE_OF_Z}px)
        `
        center.style.opacity = OPACITY - Math.abs(additionalOpacity)
        
        for (let i = 1; i <= HALF_COUNT_OF_LIST; i++) {
            const opacity = OPACITY - i * basedOpacity
            
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
    
    /**
    
        -1 => 8번째 엘리먼트
        -2 => 7번째 엘리먼트
        -3 => 6번째 엘리먼트
        전체값 + -1 => 8
        전체값 + -2 => 7
        전체값 + -3 => 6
        
        -93을 9로 나머지연산하면 -3 
        다시 호출하면서 -3을 전달하면 6이 나오게 하면 됨. 
        
        즉, 0보다 작은경우에는 전체개수 + i를 하게 한다. 

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
        // if (Math.abs(this.#velocity) > MIN_VELOCITY) { // 애니메이션이 필요한 경우라면
        //     tunedDistance = INERTIAL_SCROLL_FACTOR * this.#velocity * INERTIAL_ACCELERATION
        //     destination += tunedDistance // 목적지 + 추가적인 거리를 넣는다.
        // }
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
