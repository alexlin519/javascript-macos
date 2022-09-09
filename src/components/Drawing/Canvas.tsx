/* eslint-disable react/jsx-no-comment-textnodes */
/* eslint-disable max-lines */
import dayjs from 'dayjs';
import React, {
    CSSProperties,
    useCallback,
    useEffect,
    useImperativeHandle,
    useRef,
    useState,
} from 'react';
import { CSSTransition } from 'react-transition-group';

import DrawingIcon from '../../assets/images/Drawing.png';
import Icon from '../../lib/Icon';
import useDialog from '../Dialog';
import { AppState } from '../Dock/types';

//Canvas 在drawing index文件里面, drawingRef就指向canvas parent component(在index)
interface CanvasProps {
    width: number;
    height: number;
    drawingRef: any; //最好不用any
    drawingState: AppState;
    setDrawingState: React.Dispatch<React.SetStateAction<AppState>>;
}

interface Position {
    x: number;
    y: number;
}

const Canvas: React.FC<CanvasProps> = (props: CanvasProps): JSX.Element => {
    const { width, height, drawingRef, drawingState, setDrawingState } = props;
    const colors = ['black', 'red', 'green', 'blue'];
    const options = [
        'canvas_save',
        'canvas_clear',
        'turn_left_flat',
        'turn_right_flat',
    ];
    const tools = ['canvas_paint', 'canvas_eraser'];
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const undoButtonRef = useRef<SVGSVGElement>(null);
    const redoButtonRef = useRef<SVGSVGElement>(null);
    const [strokeStyle, setStrokeStyle] = useState('black'); //和html canvas api的命名一样
    const [lineWidth, setLineWidth] = useState(5);
    const [eraserEnabled, setEraserEnabled] = useState(false);
    const [isDrawing, setIsDrawing] = useState(false);
    const [mousePosition, setMousePosition] = useState<Position | undefined>(
        undefined
    );
    const [step, setStep] = useState(-1); //和redo功能有关
    const [canvasHistory, setCanvasHistory] = useState<string[]>([]);//图像转变成string 储存在canvasHistory这个array

    const getCoordinates = (event: MouseEvent): Position | undefined => {
        if (!canvasRef.current) {
            return;
        }
        return {
            x: event.offsetX,
            y: event.offsetY,
        };
    };

    const startDrawing = useCallback((event: MouseEvent) => {
        const coordinates = getCoordinates(event); //返回 Position | undefined
        if (coordinates) { //不是undefined
            setMousePosition(coordinates);
            setIsDrawing(true);
        }
    }, []);

    const drawLine = useCallback(
        (originalMousePosition: Position, newMousePosition: Position) => {
            if (!canvasRef.current) {
                return;
            }
            //存在画板
            const canvas: HTMLCanvasElement = canvasRef.current;
            const context = canvas.getContext('2d');
            if (context) {
                context.strokeStyle = strokeStyle;
                context.lineJoin = 'round';
                context.lineWidth = lineWidth;
                context.beginPath();
                context.moveTo(originalMousePosition.x, originalMousePosition.y);
                context.lineTo(newMousePosition.x, newMousePosition.y);
                context.closePath();
                context.stroke(); // 有颜色
            }
        },
        [lineWidth, strokeStyle]
    );

    interface ClearRectOptions { //规定矩形 清除范围
        x: number;
        y: number;
        width: number;
        height: number;
    }

    const clearRect = useCallback(({ x, y, width, height }: ClearRectOptions) => {
        if (!canvasRef.current) {
            return;
        }
        const canvas: HTMLCanvasElement = canvasRef.current;
        const context = canvas.getContext('2d');
        if (context) {
            context.clearRect(x, y, width, height);
        }
    }, []);

    const handleMouseMove = useCallback(
        (event: MouseEvent) => {
            if (isDrawing) {
                const newMousePosition = getCoordinates(event);
                if (mousePosition && newMousePosition) {
                    if (eraserEnabled) {
                        clearRect({
                            x: newMousePosition.x - lineWidth / 2,
                            y: newMousePosition.y - lineWidth / 2,
                            width: lineWidth,
                            height: lineWidth,
                        });
                    } else {
                        drawLine(mousePosition, newMousePosition); //画笔 要起点和终点
                        setMousePosition(newMousePosition);
                    }
                }
            }
        },
        [isDrawing, eraserEnabled, mousePosition, lineWidth, drawLine, clearRect]
    );

    const saveToHistory = useCallback(() => {
        setStep(step + 1);
        if (!canvasRef.current) {
            return;
        }
        const canvas: HTMLCanvasElement = canvasRef.current;
        canvasHistory.push(canvas.toDataURL()); //canvas.toDataURL() 笔记转换成 string 然后push储存到canvasHistory
        setCanvasHistory(canvasHistory);
        if (!undoButtonRef.current || !redoButtonRef.current) {
            return; //和history相关操作时, 要这2个button在
        }
        const undoButton: SVGSVGElement = undoButtonRef.current;
        const redoButton: SVGSVGElement = redoButtonRef.current;
        undoButton.classList.add('active');
        redoButton.classList.remove('active');
    }, [step, canvasHistory]);

    const stopDrawing = useCallback(() => {
        setIsDrawing(false);
        setMousePosition(undefined);
        saveToHistory();
    }, [saveToHistory]);

    const leaveCanvas = useCallback(() => {//光标移动到画布外
        setIsDrawing(false);
        setMousePosition(undefined);
    }, []);

    useEffect(() => {
        if (!canvasRef.current) {
            return;
        }
        const canvas: HTMLCanvasElement = canvasRef.current;
        canvas.addEventListener('mousedown', startDrawing);
        canvas.addEventListener('mousemove', handleMouseMove);
        canvas.addEventListener('mouseup', stopDrawing);
        canvas.addEventListener('mouseleave', leaveCanvas);
        return (): void => {
            canvas.removeEventListener('mousedown', startDrawing);//不画画了 就解绑
            canvas.removeEventListener('mousemove', handleMouseMove);
            canvas.removeEventListener('mouseup', stopDrawing);
            canvas.removeEventListener('mouseleave', leaveCanvas);
        };
    }, [startDrawing, handleMouseMove, stopDrawing, leaveCanvas]);

    const [showToolbox, setShowToolbox] = useState(true); //一开始工具栏是展开的
    const toggleToolboxOpen = useCallback(() => {
        setShowToolbox(!showToolbox);
    }, [showToolbox]);

    const handleToolClick = useCallback((e, toolName:string) => { //点击橡皮或者画笔后
        const el = e.currentTarget;
        if (el === null){
            return;
        }
        if (el.classList[1]) return; //就说明不是我们点的  (工具有个active边框 是另一个class) 我们点的时候假如有2个classlist 说明点在边框了 说明已经active了
        toolName === 'canvas_eraser'
            ? setEraserEnabled(true)
            : setEraserEnabled(false); //化简: setEraserEnabled(toolName === 'canvas_eraser')
        el.classList.add('active');
        el.parentNode.childNodes.forEach((item: HTMLLIElement) => { //当前按钮和其他按钮
            if (!item.matches('svg') || item === el) return; //不是按钮 /是刚刚的
            item.classList.remove('active'); //因为 是画笔 有active框框, 同时让其他按钮没有active框框
        });
    }, []);

    const handleSelectColor = useCallback(([e, selector, color]) => { //类似选工具  选颜色的有active效果:变大
        const el = e.target;
        if (el.className.includes('active')) return;
        setStrokeStyle(color);
        el.classList.add('active');
        el.parentNode.childNodes.forEach((item: HTMLLIElement) => {
            if (!item.matches(selector) || item === el) return;
            item.classList.remove('active');
        });
    }, []);

    //清空之前有对话框弹出
    //close warning是关闭窗口的  还有一个是清空的  所以showCloseWarning一个bool就足矣
    const { openDialog, closeDialog, RenderDialog } = useDialog();
    const [showDialog, setShowDialog] = useState(false);
    const [showCloseWarning, setShowCloseWarning] = useState(false);

    //创建hook: 把child component函数传给parent. 以此来用child控制parent component
    //drawingCloseClick 连到 drawingRef, parent通过drawingRef 来call drawingCloseClick, 去处理画画关闭时的一系列事件
    useImperativeHandle(drawingRef, () => ({ //第二个参数是函数, return  传给parent的函数
        drawingCloseClick: (): void => {
            if (step === -1) {
                setDrawingState(AppState.CLOSED);
            } else if (showDialog) {
                return;
            }
            setShowCloseWarning(true);
        },
    }));

    const [clearDialogText, setClearDialogText] = useState({
        title: 'Clear drawings?',
        message: 'This action cannot be undone.',
    });

    useEffect(() => { //打开哪个对话框
        if (showCloseWarning) {
            if (!showDialog) {
                setClearDialogText({
                    title: 'Close and exit?',
                    message: 'You will lose your drawings.',
                });
                setShowDialog(true);
            }
        } else {
            setClearDialogText({
                title: 'Clear drawings?',
                message: 'This action cannot be undone.',
            });
        }
    }, [showCloseWarning, showDialog]);

    useEffect(
        () => (showDialog ? openDialog() : closeDialog()),
        [closeDialog, showDialog, openDialog]
    );

    const downloadDrawings = useCallback(() => {
        if (!canvasRef.current) {
            return;
        }
        const canvas: HTMLCanvasElement = canvasRef.current;
        const context = canvas.getContext('2d');
        if (context) {
            const compositeOperation = context.globalCompositeOperation;
            context.globalCompositeOperation = 'destination-over';
            context.fillStyle = '#fff';
            context.fillRect(0, 0, width, height);
            const imageData = canvas.toDataURL('image/png');
            context.putImageData(context.getImageData(0, 0, width, height), 0, 0);
            context.globalCompositeOperation = compositeOperation;
            const a = document.createElement('a');
            document.body.appendChild(a);
            a.href = imageData;
            const timeFormat = 'MMM D, YYYY h:mm A'; // e.g. Aug 16, 2018 8:02 PM
            const timeStamp = dayjs().format(timeFormat);
            a.download = `Saved Drawings ${timeStamp}`; //保存文件时要自动命名 根据时间
            a.target = '_blank';
            a.click();
        }
    }, [width, height]);

    const timeTravel = useCallback(
        (type: 'redo' | 'undo') => {
            if (
                !canvasRef.current ||
                !undoButtonRef.current ||
                !redoButtonRef.current
            ) {
                return;
            }
            const canvas: HTMLCanvasElement = canvasRef.current;
            const context = canvas.getContext('2d');
            const undoButton: SVGSVGElement = undoButtonRef.current;
            const redoButton: SVGSVGElement = redoButtonRef.current;
            if (context) {
                let currentStep = -1;
                if (type === 'undo' && step >= 0) {
                    currentStep = step - 1;
                    redoButton.classList.add('active');
                    if (currentStep < 0) {//没法继续undo了
                        undoButton.classList.remove('active');
                    }
                } else if (type === 'redo' && step < canvasHistory.length - 1) { //canvasHistory.length - 1 才有可能前进
                    currentStep = step + 1;
                    undoButton.classList.add('active');
                    if (currentStep === canvasHistory.length - 1) {
                        redoButton.classList.remove('active');
                    }
                } else {
                    return;
                }
                context.clearRect(0, 0, width, height);  //前清空画布
                const canvasImage = new Image();
                canvasImage.src = canvasHistory[currentStep] as string; //找到历史 重新画出
                canvasImage.addEventListener('load', () => {
                    context.drawImage(canvasImage, 0, 0);
                });
                setStep(currentStep);
            }
        },
        [canvasHistory, step, width, height]
    );

    const handleOptionClick = useCallback( //4个 保存 清除 redo undo  点击后的 stater
        toolName => {
            switch (toolName) {
                case 'canvas_clear':
                    if (step === -1) return;
                    setShowDialog(true);
                    break;
                case 'canvas_save':
                    downloadDrawings();
                    break;
                case 'turn_left_flat':
                    timeTravel('undo');
                    break;
                case 'turn_right_flat':
                    timeTravel('redo');
                    break;
            }
        },
        [downloadDrawings, timeTravel, step]
    );

    const handleCancelDialog = useCallback(() => {
        setShowDialog(false);
        if (showCloseWarning) {
            setShowCloseWarning(false);
        }
    }, [setShowDialog, showCloseWarning, setShowCloseWarning]);

    const handleConfirmDialog = useCallback(() => { //清空
        clearRect({
            x: 0,
            y: 0,
            width,
            height,
        });
        setCanvasHistory([]);
        setStep(-1);
        handleCancelDialog(); //
        if (!undoButtonRef.current || !redoButtonRef.current) {
            return;
        }
        const undoButton: SVGSVGElement = undoButtonRef.current;
        const redoButton: SVGSVGElement = redoButtonRef.current;
        undoButton.classList.remove('active');
        redoButton.classList.remove('active');
        if (showCloseWarning) { //判断只是清除 还是点击关闭
            setDrawingState(AppState.CLOSED); //关闭app
            setShowCloseWarning(false);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [
        handleCancelDialog,
        clearRect,
        width,
        height,
        showCloseWarning,
        setShowCloseWarning,
        drawingState,
        setDrawingState,
    ]);

    return (
        <React.Fragment>
            <canvas id="canvas" ref={canvasRef} height={height} width={width} />
            <div  //一个展开的箭头
                id="toolbox-open"
                style={
                    {
                        borderRadius: showToolbox ? null : 5,
                    } as CSSProperties
                }
            > //div 里面有箭头
                <Icon
                    type={showToolbox ? 'icon-upward_flat' : 'icon-downward_flat'}
                    style={{
                        width: '100%', //栏的全部宽度
                        fontSize: 32,
                    }}
                    clickEvent={toggleToolboxOpen} //展开的动画效果要用CSSTransition
                />
            </div>



            <CSSTransition
                in={showToolbox}
                timeout={300}
                classNames="toolbox"
                unmountOnExit
            >
                <div id="toolbox">
                    <span>Options</span>
                    <div className="options"> //四个option
                        {options.map((option, index) => {
                            return (
                                <Icon
                                    svgRef={
                                        option === 'turn_right_flat'
                                            ? redoButtonRef
                                            : option === 'turn_left_flat'
                                            ? undoButtonRef
                                            : undefined
                                    }
                                    key={index + option} //loop 给key
                                    className={option}
                                    type={'icon-' + option}
                                    style={{ fontSize: 50 }}
                                    clickEvent={(): void =>
                                        handleOptionClick(option)
                                    }
                                />
                            );
                        })}
                    </div>
                    <span>Toolbox</span>


                    <div className="tools"> //画笔和橡皮
                        {tools.map((tool, index) => {
                            return (
                                <Icon
                                    key={index + tool}
                                    className={
                                        tool === 'canvas_eraser'
                                            ? eraserEnabled //橡皮被打开了么
                                                ? 'active'
                                                : '' //橡皮没被打开 就啥不干
                                            : !eraserEnabled //不是橡皮 就是画笔了
                                            ? 'active'
                                            : ''
                                    }
                                    type={'icon-' + tool}
                                    style={{ fontSize: 50 }}
                                    clickEvent={(e): void =>
                                        handleToolClick(e, tool)
                                    }
                                />
                            );
                        })}
                    </div>


                    <div className="sizes">
                        <input
                            style={
                                {
                                    backgroundColor: eraserEnabled
                                        ? '#ebeff4' //橡皮颜色
                                        : strokeStyle,
                                } as CSSProperties
                            }
                            type="range"
                            id="range"
                            name="range"
                            min="1"
                            max="20"
                            value={lineWidth} //双向数据绑定  UI 的value 和react的 status 绑定 就是lineWidth
                            onChange={(e): void =>
                                setLineWidth(parseInt(e.target.value)) //更改这个数据
                            }
                        />
                    </div>

                    //颜色
                    <ol className="colors"> //ol是 order list
                        {colors.map((color, index) => {
                            return (
                                <li
                                    className={
                                        color === strokeStyle
                                            ? color + ' active'
                                            : color
                                    }
                                    key={index + color}
                                    onClick={(e): void =>
                                        handleSelectColor([e, 'li', color])
                                    }
                                />
                            );
                        })}
                        <input
                            type="color"
                            value={strokeStyle}
                            onChange={(e): void => setStrokeStyle(e.target.value)}
                            id="currentColor"
                        />
                    </ol>
                </div>
            </CSSTransition>



            <RenderDialog
                width={300}
                height={120}
                id="clear-dialog"
                title={clearDialogText.title}
                message={clearDialogText.message}
                imgSource={DrawingIcon}
                onConfirm={handleConfirmDialog}
                onCancel={handleCancelDialog}
            />


        </React.Fragment>
    );
};

Canvas.defaultProps = {
    width: window.innerWidth,
    height: window.innerHeight,
};

export default Canvas;
