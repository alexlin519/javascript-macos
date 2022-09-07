import React, {
    CSSProperties,
    MouseEvent,
    useCallback,
    useEffect,
    useMemo,
    useState,
} from 'react';

export interface DragEvent {
    id: number;
    translation: Position;
}

interface Position {
    x: number;
    y: number;
}

interface DraggableIconProps {
    children: React.ReactChild;
    id: number;
    onDrag: (e: DragEvent) => void; //drag的发生 触发 DragEvent
    onDragEnd: () => void;
}

interface DraggableIconState {
    dragging: boolean;
    origin: Position;
    translation: Position;
}

const Draggable: React.FC<DraggableIconProps> = (props: DraggableIconProps) => {
    const { children, id, onDrag, onDragEnd } = props; //discract obj
    const [state, setState] = useState<DraggableIconState>({
        dragging: false,
        origin: { x: 0, y: 0 },
        translation: { x: 0, y: 0 },
    });

    //鼠标按下去后会如何
    //useCallback 来memorzation
    const handleMouseDown = useCallback((e: MouseEvent) => {
        const { clientX, clientY } = e; //鼠标的位置
        //drag这样re-render频率特别高的 (每drag一下都要重新)

        //把传参数改成function return  而不是直接obj创建  会略微高效
        setState(state => ({
            ...state,
            dragging: true,
            origin: { x: clientX, y: clientY }, //spread operator ..., 其他不变
        }));
    }, []);

    //拖拽
    const handleMouseMove = useCallback(
        (e: Event) => {
            const { clientX, clientY } = e as unknown as MouseEvent; //e: Event 是MouseEvent的super type  先把e变成 unknown  然后变成MouseEvent
            const translation = {
                x: clientX - state.origin.x,
                y: clientY - state.origin.y,
            };
            //刚刚的写法 传函数而不是直接写obj
            setState(state => ({
                ...state,
                translation,
            }));

            onDrag({ translation, id }); // onDrag: (e: DragEvent) => void;  DragEvent要translation, id 2个properties
            //{ translation:translation, id:id }的简写
        },
        [state.origin, onDrag, id]
    );

    //鼠标松开 完成拖拽
    const handleMouseUp = useCallback(() => {
        setState(state => ({
            ...state,
            dragging: false,
        }));

        onDragEnd();
    }, [onDragEnd]);

    useEffect(() => {
        if (state.dragging) { //在拖动的时候 要检测2个东西
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
        } else {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);

            setState(state => ({ ...state, translation: { x: 0, y: 0 } }));
        }
    }, [state.dragging, handleMouseMove, handleMouseUp]);

    const styles = useMemo(
        () => ({
            cursor: state.dragging ? '-webkit-grabbing' : '-webkit-grab',
            transform: `translate(${state.translation.x}px, ${state.translation.y}px)`,
            transition: state.dragging ? 'none' : 'transform 500ms',
            zIndex: state.dragging ? 2 : 1, //覆盖样式 (2个app重叠时)
        }),
        [state.dragging, state.translation]
    );

    return (
        //higher order component HOC 高阶组件
        //
        <div style={styles as CSSProperties} onMouseDown={handleMouseDown}>
            {children}
        </div>
    );
};

export default Draggable;
