import React, { useState, useEffect } from 'react';
import styles from './Clock.module.css';

interface ClockProps {
    timeFormat: string;
}

export const Clock: React.FC<ClockProps> = ({ timeFormat }) => {
    const [time, setTime] = useState<string>('00:00');
    const [date, setDate] = useState<string>('');

    useEffect(() => {
        const updateClock = () => {
            const now = new Date();

            setTime(
                now.toLocaleTimeString('en', {
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: timeFormat === '12',
                }),
            );

            setDate(
                now.toLocaleDateString('zh-CN', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    weekday: 'long',
                }),
            );
        };

        updateClock();
        const timer = setInterval(updateClock, 1000);

        return () => clearInterval(timer);
    }, [timeFormat]);

    return (
        <div className={styles.timeWrapper}>
            <div className={styles.time}>{time}</div>
            <div className={styles.date}>{date}</div>
        </div>
    );
};
