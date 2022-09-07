/* eslint-disable react/jsx-no-comment-textnodes */
/* eslint-disable max-lines */
import './index.scss';

import React, {
    CSSProperties,
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
} from 'react';

import CalculatorIcon from '../../assets/images/Calculator.png';
import ChromeIcon from '../../assets/images/Chrome.png';
import DrawingIcon from '../../assets/images/Drawing.png';
import FinderIcon from '../../assets/images/Finder.png';
import LaunchpadIcon from '../../assets/images/Launchpad.png';
import PreferencesIcon from '../../assets/images/Preferences.png';
import TerminalIcon from '../../assets/images/Terminal.png';
import { Calculator } from '../Calculator';
import Drawing from '../Drawing';
import { Launchpad } from '../Launchpad';
import Preferences from '../Preferences';
import { AppState, DockConfig, DockPosition } from './types';
/// <reference path="image.d.ts" />


// Dock是苹果的底部菜单栏
const Dock: React.FC = () => {
    const DEFAULT_LENGTH = 68;
    const BOUNCE_ANIMATION_DURATION = 1.5 * 1000; //点击应用后多久跳出来1.5毫秒
    const dockRef = useRef<HTMLDivElement>(null); // 修改status的 ref
    //性能优化: array是 non-premetive type (占用空间较大)
    //每次re render的时候都要运行const Dock: React.FC, 每次都要分配一个array 占空间
    //所以 const dockIcons = { FinderIcon ... } 耗时间 空间, 而且array是固定的
    //
    // ract 提供了 useMemo 函数, 2个参数 返回我们array的函数 和一个dependency array[], dependency array的东西变化后 重新执行返回我们array的函数
    //这个情况, 我们array 不变 故dependency array[]是空
    //memoization: remember previously calculated value and avoid recomputation
    const dockIcons = useMemo(() => {
        return [
            FinderIcon,
            LaunchpadIcon,
            PreferencesIcon,
            ChromeIcon,
            TerminalIcon,
            CalculatorIcon,
            DrawingIcon,
        ];
    }, []);
    const [dockConfig, setDockConfig] = useState<DockConfig>({ //useState<status类型>()  , 之前 useState<boolean>(false), 可以省略Boolean
        position: DockPosition.BOTTOM,
        iconSize: DEFAULT_LENGTH,
        bigIconSize: DEFAULT_LENGTH * 1.5,
        distanceBetweenIcons: 0,
        distanceToScreenEdge: 5, // type不对会报错
        style: {}, //没有style 会报错 因为我们status类型是DockConfig   避免object property写少
    });
    const [preferencesState, setPreferencesState] = useState<AppState>(
        AppState.CLOSED
    );
    const [calculatorState, setCalculatorState] = useState<AppState>(
        AppState.CLOSED
    );
    const [drawingState, setDrawingState] = useState<AppState>(AppState.CLOSED);
    const [showLaunchpad, setShowLaunchPad] = useState(false);

    //点击图标后做的事情
    //也是个memoization,这回hook 不是useMemo (一般变量用这个)  函数用 useCallback这个hook
    //2个参数 一个函数  一个dependency list
    const handleDockIconClick = useCallback(
        (iconName: string) => { //判断点击的是哪个icon
            if (!dockRef || !dockRef.current) {
                return;
            }
            //
            const iconElements = dockRef.current.childNodes;
            const iconIndex = dockIcons.indexOf(iconName);//点击的icon对应的index
            const clickedIconElement = iconElements[iconIndex] as HTMLDivElement;//类型转换 为了clickedIconElement.classList.add('bounce');  div元素 存在classlist这个property
            if (iconName === ChromeIcon) {
                window.open('http://www.google.com/');
                return;
            } else if (
                iconName === PreferencesIcon ||
                iconName === CalculatorIcon ||
                iconName === DrawingIcon
            ) {
                setShowLaunchPad(false); //关掉pad
                let appState: AppState = preferencesState; //初始随便给一个preferencesState  但是我们要判断我们icon点的是PreferencesIcon 还是计算器icon 还是画画
                let setAppState: typeof setPreferencesState = setPreferencesState;
                switch (iconName) {
                    case PreferencesIcon:
                        appState = preferencesState;
                        setAppState = setPreferencesState;
                        break;
                    case CalculatorIcon:
                        appState = calculatorState;
                        setAppState = setCalculatorState;
                        break;
                    case DrawingIcon:
                        appState = drawingState;
                        setAppState = setDrawingState;
                        break;
                }
                //
                if (appState === AppState.CLOSED) {
                    clickedIconElement.classList.add('bounce');
                    setTimeout(() => { //延迟等待后 set status
                        setAppState(AppState.RUNNING_IN_FOREGROUND);
                        clickedIconElement.classList.remove('bounce');
                    }, BOUNCE_ANIMATION_DURATION);
                } else {
                    setAppState(AppState.RUNNING_IN_FOREGROUND);
                }
                return;
            } else if (iconName === LaunchpadIcon) {
                setShowLaunchPad(!showLaunchpad);
                return;
            }
        },
        [
            dockIcons,
            preferencesState,
            calculatorState,
            drawingState,
            BOUNCE_ANIMATION_DURATION,
            showLaunchpad,
        ]
    );


    const computeOffset = useCallback(
        (element: HTMLElement, offset: 'top' | 'left'): number => {
            const elementOffset =
                offset === 'top' ? element.offsetTop : element.offsetLeft;
            if (element.offsetParent === null) {
                return elementOffset;
            }
            return (
                elementOffset +
                computeOffset(element.offsetParent as HTMLElement, offset)
            );
        },
        []
    );
    //鼠标滑动后 放大
    const handleMousemove = useCallback(
        event => {
            const { clientX, clientY } = event;
            if (!dockRef || !dockRef.current) {
                return;
            }
            const iconElements = dockRef.current.childNodes;
            for (let i = 0; i < iconElements.length; i++) {
                const iconElement = iconElements[i] as HTMLDivElement;
                let x, y;
                if (dockConfig.position === DockPosition.BOTTOM) {
                    x = iconElement.offsetLeft + dockConfig.iconSize / 2 - clientX;
                    y =
                        iconElement.offsetTop +
                        computeOffset(dockRef.current, 'top') +
                        iconElement.offsetHeight / 2 -
                        clientY;
                } else if (dockConfig.position === DockPosition.RIGHT) {
                    x = iconElement.offsetTop + dockConfig.iconSize / 2 - clientY;
                    y =
                        iconElement.offsetLeft +
                        computeOffset(dockRef.current, 'left') +
                        iconElement.offsetWidth / 2 -
                        clientX;
                } else {
                    x = iconElement.offsetTop + dockConfig.iconSize / 2 - clientY;
                    y = iconElement.offsetLeft + dockConfig.iconSize / 2 - clientX;
                }
                let magnifyAnimationScale =
                    1 -
                    Math.sqrt(x * x + y * y) /
                        (iconElements.length * dockConfig.iconSize);
                if (
                    magnifyAnimationScale <
                    dockConfig.iconSize / dockConfig.bigIconSize
                ) {
                    magnifyAnimationScale =
                        dockConfig.iconSize / dockConfig.bigIconSize;
                }
                const multiplier = dockConfig.bigIconSize / dockConfig.iconSize;
                if (dockConfig.bigIconSize / dockConfig.iconSize) {
                    iconElement.style.height = iconElement.style.width =
                        dockConfig.iconSize * multiplier * magnifyAnimationScale +
                        'px';
                }
            }
        },
        [dockConfig, computeOffset]
    );

    // set the initial position of the dock and the dock items
    const setInitialPosition = useCallback(() => {
        if (!dockRef.current) {
            return;
        }
        if (dockConfig.position === DockPosition.BOTTOM) {
            setDockConfig({
                ...dockConfig,
                style: {
                    height: dockConfig.iconSize * 1 + 12,
                    marginBottom: dockConfig.distanceToScreenEdge * 1,
                },
            });
        } else if (dockConfig.position === DockPosition.TOP) {
            setDockConfig({
                ...dockConfig,
                style: {
                    height: dockConfig.iconSize * 1 + 12,
                    marginTop: dockConfig.distanceToScreenEdge * 1,
                },
            });
        } else if (dockConfig.position === DockPosition.LEFT) {
            setDockConfig({
                ...dockConfig,
                style: {
                    width: dockConfig.iconSize * 1 + 12,
                    marginLeft: dockConfig.distanceToScreenEdge * 1,
                },
            });
        } else if (dockConfig.position === DockPosition.RIGHT) {
            setDockConfig({
                ...dockConfig,
                style: {
                    width: dockConfig.iconSize * 1 + 12,
                    marginRight: dockConfig.distanceToScreenEdge * 1,
                },
            });
        }
        const iconElements = dockRef.current.childNodes;
        for (let i = 0; i < iconElements.length; i++) {
            const iconElement = iconElements[i] as HTMLDivElement;
            iconElement.style.width = iconElement.style.height =
                dockConfig.iconSize + 'px';
        }
    }, [dockConfig]);

    //什么时候重新运行setInitialPosition
    // eslint-disable-next-line react-hooks/exhaustive-deps
    useEffect(setInitialPosition, [
        dockConfig.position,
        dockConfig.iconSize,
        dockConfig.bigIconSize,
        dockConfig.distanceBetweenIcons,
        dockConfig.distanceToScreenEdge,
    ]);

    //让打开的app 底下有点
    const labelRunningAppIcons = (): void => {
        if (!dockRef || !dockRef.current) {
            return;
        }
        const iconElements = dockRef.current.childNodes;
        const preferencesIndex = dockIcons.indexOf(PreferencesIcon);
        const calculatorIndex = dockIcons.indexOf(CalculatorIcon);
        const drawingIndex = dockIcons.indexOf(DrawingIcon);
        const preferencesIconElement = iconElements[
            preferencesIndex
        ] as HTMLDivElement;
        const calculatorIconElement = iconElements[
            calculatorIndex
        ] as HTMLDivElement;
        const drawingIconElement = iconElements[drawingIndex] as HTMLDivElement;
        if (preferencesState !== AppState.CLOSED) {
            preferencesIconElement.classList.add('active'); //打开的app 那底下就加点
        } else {
            setTimeout(
                () => preferencesIconElement.classList.remove('active'), //关闭app 点就延时消失
                0.5 * 1000
            );
        }
        if (calculatorState !== AppState.CLOSED) {
            calculatorIconElement.classList.add('active');
        } else {
            setTimeout(
                () => calculatorIconElement.classList.remove('active'),
                0.5 * 1000
            );
        }
        if (drawingState !== AppState.CLOSED) {
            drawingIconElement.classList.add('active');
        } else {
            setTimeout(
                () => drawingIconElement.classList.remove('active'),
                0.5 * 1000
            );
        }
    };
    //什么时候重新运行labelRunningAppIcons
    useEffect(labelRunningAppIcons, [
        calculatorState,
        dockIcons,
        drawingState,
        preferencesState,
    ]);

    const iconStyle = useMemo(() => {
        return dockConfig.position === DockPosition.TOP ||
            dockConfig.position === DockPosition.BOTTOM
            ? {
                  marginLeft: dockConfig.distanceBetweenIcons * 1,
                  marginRight: dockConfig.distanceBetweenIcons * 1,
              }
            : {
                  marginTop: dockConfig.distanceBetweenIcons * 1,
                  marginBottom: dockConfig.distanceBetweenIcons * 1,
              };
    }, [dockConfig]);

    return ( //只能return一个jsx  但是我们有多个 所以用 <React.Fragment>包起来
        <React.Fragment>
            <Preferences
                dockConfig={dockConfig}
                setDockConfig={setDockConfig}
                preferencesState={preferencesState}
                setPreferencesState={setPreferencesState}
            />
            <Calculator
                calculatorState={calculatorState}
                setCalculatorState={setCalculatorState}
            />
            <Drawing drawingState={drawingState} setDrawingState={setDrawingState} />
            <Launchpad
                showLaunchpad={showLaunchpad}
                setShowLaunchPad={setShowLaunchPad}
                handleDockIconClick={handleDockIconClick}
            />

            <footer className={dockConfig.position} id="AppFooter">
                <div
                    id="Docker"
                    ref={dockRef}
                    className={dockConfig.position}
                    style={dockConfig.style}
                    onMouseLeave={setInitialPosition}
                    onMouseMove={handleMousemove}
                >
                    {dockIcons.map((item, index) => {
                        return (
                            <div
                                className={ //bool ():()
                                    [ //可以点击的一些app图标:
                                        LaunchpadIcon,
                                        PreferencesIcon,
                                        ChromeIcon,
                                        CalculatorIcon,
                                        DrawingIcon,
                                    ].includes(item)
                                        ? 'pointer DockItem ' + dockConfig.position //光标形状变成手指
                                        : dockConfig.position + ' DockItem'
                                }
                                style={
                                    {
                                        backgroundImage: `url(${item})`,
                                        backgroundPosition: 'center',
                                        backgroundSize: 'cover',
                                        backgroundRepeat: 'no-repeat',
                                        ...iconStyle,
                                    } as CSSProperties
                                }
                                // loop生成元素 通常要key
                                key={index + item} // 要key 不然react很难分辨每个元素  之后render不方便
                                onClick={(): void => handleDockIconClick(item)}
                            />
                        );
                    })}
                </div>
            </footer>
        </React.Fragment>
    );
};

export default Dock;
