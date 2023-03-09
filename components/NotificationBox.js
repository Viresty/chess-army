import { React, ReactDOM, useEffect, useState, useMemo } from "react";
import styles from "../styles/Home.module.scss";

const NotificationBox = ({ message = "", show = false }) => {

    useEffect(() => {
        if (show) {
            const ele = document.getElementById("notificationBox");
            if (!ele.classList.contains(styles.active)) ele.classList.add(styles.active);
            setTimeout(() => {
                if (ele.classList.contains(styles.active)) ele.classList.remove(styles.active);
            }, 500);
        }
    }, [show])

    const renderMessage = useMemo(() => {
        return <p>{message}</p>;
    }, [message]);

    return (
        <div className={styles.notificationContainer} id="notificationBox">
            <div className={styles.blurBackground} />
            <div className={styles.notificationBox}>
                {renderMessage}
            </div>
        </div>
    )
}

export default NotificationBox;