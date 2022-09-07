import './index.scss';

import { inRange, range } from 'lodash';
import React, {
    CSSProperties,
    KeyboardEvent,
    useCallback,
    useEffect,
    useState,
} from 'react';

import CalculatorIcon from '../../assets/images/Calculator.png';
import ChromeIcon from '../../assets/images/Chrome.png';
import DrawingIcon from '../../assets/images/Drawing.png';
import PreferencesIcon from '../../assets/images/Preferences.png';
import DraggableIcon from './DraggableIcon';
import { DragEvent } from './DraggableIcon';

type LaunchpadProps = {
    showLaunchpad: boolean;
    setShowLaunchPad: React.Dispatch<React.SetStateAction<boolean>>;
    handleDockIconClick: (iconName: string) => void; //点击图标就运行  这个func在docker写过了  现在传入
};

interface LaunchpadState {
    dragging: boolean; // true if an icon is being dragged
    order: number[]; // the order of the icon IDs after dragging
    temporaryOrder: number[]; // the temporary order of the icon IDs while dragging
    draggedIconId: number | null; // the ID of the icon that is being dragged, null if no icon is being dragged
}

export const Launchpad: React.FC<LaunchpadProps> = (props: LaunchpadProps) => {
    const [icons] = useState<string[]>([ //[icons,setIcons] 但是我们要icon固定 就不set了
        PreferencesIcon, // id 0
        ChromeIcon, // id 1
        CalculatorIcon, // id 2
        DrawingIcon, // id 3
    ]);
    const iconIds = range(icons.length); //生成array [0,1,2,3] (length为4)
    const [state, setState] = useState<LaunchpadState>({ //初始state
        dragging: false,
        order: iconIds,
        temporaryOrder: iconIds,
        draggedIconId: null,
    });

    const handleDrag = useCallback(
        (e: DragEvent) => {
            const { translation, id } = e;

            setState(state => ({
                ...state,
                dragging: true, //开始拖动
            }));

            const indexTranslation = Math.round(translation.x / 100); //位置以index为单位的改变量  round 因为index是整数
            const index = state.order.indexOf(id);
            const temporaryOrder = state.order.filter( //filter参数是函数
                (index: number) => index !== id //return一个条件
            );


            if (!inRange(index + indexTranslation, 0, iconIds.length)) {
                return;
            }
            //继续运行  说明超出范围:
            temporaryOrder.splice(index + indexTranslation, 0, id);
            setState(state => ({
                ...state,
                draggedIconId: id,
                temporaryOrder,
            }));
        },
        [state.order, iconIds.length]
    );

    const handleDragEnd = useCallback(() => {
        setState(state => ({
            ...state,
            order: state.temporaryOrder,
            draggedIconId: null,
        }));
    }, []);

    useEffect(() => {
        const handleKeydown = (e: Event): void => {
            const { key } = e as unknown as KeyboardEvent;
            if (key === 'Escape') {
                props.setShowLaunchPad(false);
            }
        };

        //点击除了dock和图标的部分  就退出pad
        const handleClick = (e: Event): void => {
            const { target } = e;
            if (!props.showLaunchpad) return; //pad还没展现 就不管了

            const LaunchpadItems = document.getElementsByClassName('LaunchpadImg'); //获取那些pad的app图标
            for (let i = 0; i < LaunchpadItems.length; i++) {
                if (LaunchpadItems[i] === target) {
                    return; //说明我们点击图标 就不管了
                }
            }
            props.setShowLaunchPad(!props.showLaunchpad);
        };

        window.addEventListener('click', handleClick);
        window.addEventListener('keyup', handleKeydown);

        //return函数 会在当前component消失前执行一遍
        return (): void => {//解绑
            window.removeEventListener('click', handleClick);
            window.removeEventListener('keyup', handleKeydown);
        };
    }, [props]);

    const iconJsxElements: JSX.Element[] = icons.map((icon, iconId) => {
        const isDragging = state.draggedIconId === iconId;
        const top = state.temporaryOrder.indexOf(iconId) * 200;
        const draggedTop = state.order.indexOf(iconId) * 200;
        const fileName = icon.split('/').pop(); // e.g. '../../assets/images/Calculator.png'  得到Calculator.png
        const iconLabel = (fileName || '').split('.')[0]; // e.g. 'Calculator'  fileName || '' -> filename是空就用''

        return (
            <DraggableIcon
                key={iconId}
                id={iconId}
                onDrag={handleDrag}
                onDragEnd={handleDragEnd}
            >
                <div
                    className="LaunchpadItem"
                    style={
                        {
                            left: isDragging ? draggedTop : top,
                            transition: isDragging ? 'none' : 'all 500ms',
                        } as CSSProperties
                    }
                >
                    <div
                        className="LaunchpadImg"
                        style={
                            {
                                backgroundImage: 'url(' + icon + ')',
                                backgroundPosition: 'center',
                                backgroundSize: 'cover',
                                backgroundRepeat: 'no-repeat',
                            } as CSSProperties
                        }
                        //点击图标后生效
                        onClick={(): void => {
                            if (!state.dragging) {
                                props.handleDockIconClick(icon);
                            } else {
                                setState(state => ({
                                    ...state,
                                    dragging: false,
                                }));
                            }
                        }}
                    />
                    <span style={{ color: '#fff' }}>{iconLabel}</span>
                </div>
            </DraggableIcon>
        );
    });

    return (
        <React.Fragment>
            {props.showLaunchpad && ( // && : 当前面的是 true 才有后面的render
                <div id="Launchpad">
                    <div id="LaunchpadItemWrapper">{iconJsxElements}</div>
                </div>
            )}
        </React.Fragment>
    );
};
