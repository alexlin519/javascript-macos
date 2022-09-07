/* eslint-disable max-lines */
import './index.scss';

import React, { CSSProperties, useCallback, useEffect } from 'react';
import {
    ListView,
    ListViewRow,
    Radio,
    Text,
    TitleBar,
    View,
} from 'react-desktop/macOs';

import Icon from '../../lib/Icon';
import { useModal } from '../../lib/Modal/UseModal';
import { AppState, DockConfig, DockPosition } from '../Dock/types';

//preference的设置 主体是dock 所以要前2个
interface PreferencesProps { //由parent component传递的
    dockConfig: DockConfig;
    setDockConfig: React.Dispatch<React.SetStateAction<DockConfig>>;
    preferencesState: AppState;
    setPreferencesState: React.Dispatch<React.SetStateAction<AppState>>;
}

interface SliderConfig { //滑动条
    title: string;
    value: number;
    maxValue: number;
    minValue: number;
}

const DOCK_POSITIONS = [
    DockPosition.BOTTOM,
    DockPosition.TOP,
    DockPosition.RIGHT,
    DockPosition.LEFT,
];

const CHANGE_DOCK_ICON_SIZE = 'Default icon size';
const CHANGE_DOCK_BIG_ICON_SIZE = 'When you hover over an icon, its size will be';
const CHANGE_DOCK_DISTANCE_BETWEEN_ICONS = 'The distance between icons';
const CHANGE_DOCK_DISTANCE_TO_SCREEN_EDGE =
    'The distance between the dock and the edge of the screen';
const CHANGE_DOCK_POSITION = 'Dock position';

const Preferences: React.FC<PreferencesProps> = (props: PreferencesProps) => {
    const { open, close, RenderModal } = useModal('PreferencesView'); //distract objects
    const { dockConfig, setDockConfig, preferencesState, setPreferencesState } =
        props;
    const sliders: SliderConfig[] = [
        {
            title: CHANGE_DOCK_ICON_SIZE,
            value: dockConfig.iconSize * 1,
            maxValue: 128,
            minValue: 25,
        },
        {
            title: CHANGE_DOCK_BIG_ICON_SIZE,
            value: dockConfig.bigIconSize * 1,
            maxValue: 256,
            minValue: 25,
        },
        {
            title: CHANGE_DOCK_DISTANCE_BETWEEN_ICONS,
            value: dockConfig.distanceBetweenIcons * 1,
            maxValue: 10,
            minValue: 0,
        },
        {
            title: CHANGE_DOCK_DISTANCE_TO_SCREEN_EDGE,
            value: dockConfig.distanceToScreenEdge * 1,
            maxValue: 100,
            minValue: 0,
        },
    ];

    useEffect(() => {
        if (preferencesState === AppState.CLOSED) {
            close();
        } else {
            open();
        }
    }, [close, open, preferencesState]);

    const handleSliderChange = useCallback(
        (value: number, title: string) => {
            switch (title) {
                case CHANGE_DOCK_ICON_SIZE:
                    setDockConfig({ ...dockConfig, iconSize: value });
                    break;
                case CHANGE_DOCK_BIG_ICON_SIZE:
                    setDockConfig({ ...dockConfig, bigIconSize: value });
                    break;
                case CHANGE_DOCK_DISTANCE_BETWEEN_ICONS:
                    setDockConfig({ ...dockConfig, distanceBetweenIcons: value });
                    break;
                case CHANGE_DOCK_DISTANCE_TO_SCREEN_EDGE:
                    setDockConfig({ ...dockConfig, distanceToScreenEdge: value });
                    break;
            }
        },
        [dockConfig, setDockConfig]
    );

    const sliderJSXElements: JSX.Element[] = sliders.map(
        (slider: SliderConfig, index: number) => {
            return (
                <div className="options" key={index + slider.value}>
                    <Text bold marginBottom="10px">
                        {slider.title}
                    </Text>
                    <input
                        min={slider.minValue}
                        max={slider.maxValue}
                        type="range"
                        value={slider.value}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>): void => {
                            handleSliderChange(
                                parseInt(e.target.value), //string 变 number
                                slider.title
                            );
                        }}
                    />
                    <span>{slider.value}</span>
                </div>
            );
        }
    );

    return (
        <RenderModal
            data={{
                width: 684,
                height: 466,
                id: 'PreferencesView',
                moveId: 'PreferencesMove',
                isShow: preferencesState === AppState.RUNNING_IN_FOREGROUND, //preference 设置是否在前台运行
            }}
        >
            <React.Fragment>
                <TitleBar
                    id="PreferencesMove" //移动的时候是在改变titleBar  所以和moveId: 'PreferencesMove' 一样
                    controls
                    inset
                    isFullscreen={false}
                    onCloseClick={(): void => {
                        close();
                        setPreferencesState(AppState.CLOSED);
                    }}
                    onMinimizeClick={(): void => {
                        setPreferencesState(AppState.RUNNING_IN_BACKGROUND); //后台运行
                    }}
                    onMaximizeClick={open}
                />
                <div className="mainSet">
                    <View className="leftSet">
                        <ListView>
                            <ListViewRow background="#bfbfbf" padding="11px 20px">
                                <Icon
                                    type="icon-ios-home"
                                    style={{
                                        marginRight: '6px',
                                    }}
                                />
                                <Text color="#414141" size="14" bold>
                                    General
                                </Text>
                            </ListViewRow>
                        </ListView>
                    </View>

                    <View className="rightSet">
                        <Text bold marginBottom="10px" size="20">
                            General
                        </Text>
                        <div className="divide" />
                        {sliderJSXElements}
                        <Text bold marginBottom="10px">
                            {CHANGE_DOCK_POSITION}
                        </Text>
                        <View
                            style={
                                {
                                    lineHeight: '22px',
                                } as CSSProperties
                            }
                        >
                            {DOCK_POSITIONS.map((dockPosition, index) => {
                                return (
                                    <div
                                        style={
                                            {
                                                paddingRight: 28,
                                            } as CSSProperties
                                        }
                                        key={index + dockPosition}
                                    >
                                        <Radio  //单选按钮
                                            label={dockPosition}
                                            name={dockPosition}
                                            onChange={(
                                                e: React.ChangeEvent<HTMLInputElement> //radio是外部的标签  故我们的e要写type (ts没法自动识别)
                                            ): void => {
                                                setDockConfig({
                                                    ...dockConfig,
                                                    position: e.target
                                                        .value as DockPosition, //把普通string 变成 DockPosition 的type
                                                });
                                            }}
                                            defaultValue={dockPosition}
                                            defaultChecked={ //打勾的情况只有相同的时候
                                                dockPosition === dockConfig.position
                                            }
                                        />
                                    </div>
                                );
                            })}
                        </View>
                    </View>
                </div>
            </React.Fragment>
        </RenderModal>
    );
};

export default Preferences;
