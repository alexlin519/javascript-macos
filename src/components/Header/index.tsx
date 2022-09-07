/* eslint-disable react/jsx-no-comment-textnodes */
import './index.scss';
import 'dayjs/locale/zh-cn';

import dayjs from 'dayjs'; //日期lib
import React, { useEffect, useState } from 'react';

import Icon from '../../lib/Icon';

dayjs.locale('en');

const Header: React.FC = () => {
    //functional  没有变量
    const timeFormat = 'MMM D, YYYY h:mm A'; // e.g. Aug 16, 2018 8:02 PM
    const [time, setTime] = useState(dayjs().format(timeFormat)); //每60s 更新; useState这个hook; 初始值dayjs().format(timeFormat)
    //左上角的输入框showInput
    const [showInput, setShowInput] = useState(false); //一开始不显示 故 false
    const [inputValue, setInputValue] = useState('Alex Lin');

    useEffect(() => {
        //side effect; 每次重新render的时候  都会执行如下函数
        //update and subscription 2种side effect
        //用于 update,把某些改变的logic放在useeffect
        //用于subscription, 前端从后端获取信息.

        //纯函数, 给的input 必然有固定output
        //React.FC也是 pure func, 就不可以update, subscription
        const updateTime = setInterval(() => {
            //2个参数 一个是函数 一个是60 * 1000
            const newTime = dayjs().format(timeFormat);
            setTime(newTime);
        }, 60 * 1000); //到此, updatetime 结束了 不用return

        //每次重新render退出时, 要 清除,不然有好多updateTime   -> application is scalable
        return (): void => window.clearInterval(updateTime); // 返回一个函数,用于清理
    });

    return (
        <header className="Header">
            <div className="HeaderLeft">
                <div>
                    <Icon
                        type="icon-apple"
                        style={{
                            //要js 代码 需要先花括号
                            fontSize: 16,
                        }}
                    />
                </div>
                <div>
                    {' '}
                    //修改字体 // 一个boolean? (true的时候执行):(false时执行)
                    {showInput ? (
                        <input
                            autoFocus //光标自动移上去
                            value={inputValue}
                            //function 变量   onChange={} e是input变量  e必须是changeEvent 因为在onChange (typescript自动推导的)
                            onChange={(e): void => setInputValue(e.target.value)}
                            //onBlur:  点击其他地方 失去foucs后的event
                            onBlur={(): void => setShowInput(false)}
                        />
                    ) : (
                        <span
                            className="text"
                            onClick={(): void => setShowInput(true)}
                        >
                            {inputValue}
                        </span>
                    )}
                </div>
                <div>File</div>
                <div>Edit</div>
                <div>View</div>
                <div>Go</div>
                <div>Window</div>
                <div>Help</div>
            </div>
            <div className="HeaderRight">
                <a
                    href="https://cgao.info"
                    rel="noopener noreferrer"
                    target="_blank" //新标签
                >
                    <Icon
                        type="icon-ren"
                        style={{
                            fontSize: 22,
                        }}
                    />
                </a>
                <a
                    href="https://github.com/chuntonggao"
                    rel="noopener noreferrer"
                    target="_blank"
                >
                    <Icon
                        type="icon-github"
                        style={{
                            fontSize: 22,
                        }}
                    />
                </a>
                <div>{time}</div>
            </div>
        </header>
    );
};

export default Header;