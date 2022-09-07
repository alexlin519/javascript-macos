import React, { CSSProperties, useMemo, useState } from 'react';
import { Button, Dialog } from 'react-desktop/macOs';

/// <reference path="react-desktop.d.ts" />


// reuse JSX and logic 这个对话框是logic
// reuse logic就是 hook!! 我们自定义hook
//useState useEffect useMemo UseCallBack 是默认hook
//useState : 关于当前component status的逻辑  rerender
//useEffect:  rerender后执行useEffect里面的函数
//useMemo /UseCallBack : dependency没改变时 不用重新计算


interface DialogProps {
    width: number;
    height: number;
    id: string;
    title?: string; //?说明optonal 不是必须
    message?: string;
    imgSource?: string;
    onConfirm: () => void;
    onCancel: () => void;
}

interface UseDialog {
    openDialog: () => void;
    closeDialog: () => void;
    RenderDialog: (props: DialogProps) => JSX.Element; //RenderDialog return JSX 所以首字母都大写
}

const useDialog = (): UseDialog => {
    const [isVisible, setIsVisible] = useState(false);
    const openDialog = (): void => setIsVisible(true);
    const closeDialog = (): void => setIsVisible(false);
    const RenderDialog = (props: DialogProps): JSX.Element => {
        const { width, height, id, title, message, imgSource, onConfirm, onCancel } =
            props;

        const styles = useMemo( //CSS style
            () => ({
                width: width,
                height: height,
                left: `calc(50vw - ${width / 2}px)`, //在string写变量
                top: `calc(50vh - ${height}px)`,
                borderRadius: 4,
            }),
            [width, height]
        );

        //是否放图
        const renderIcon = (): JSX.Element => {
            if (!imgSource) {
                return <React.Fragment></React.Fragment>;
            }
            return <img src={imgSource} width="52" height="52" alt="tip" />; //alt 是图片出不来时展示的文字
        };

        return (
            <React.Fragment>
                {isVisible && (
                    <div id={id} style={styles as CSSProperties}>
                        <Dialog
                            title={title}
                            message={message}
                            icon={renderIcon()}
                            buttons={[
                                <Button key="cancel" onClick={onCancel}>
                                    Cancel
                                </Button>,
                                <Button
                                    key="confirm"
                                    color="blue"
                                    onClick={onConfirm}
                                >
                                    Confirm
                                </Button>,
                            ]}
                        />
                    </div>
                )}
            </React.Fragment>
        );
    };

    return {
        openDialog,
        closeDialog,
        RenderDialog,
    };
};

export default useDialog;
