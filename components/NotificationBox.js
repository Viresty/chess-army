import { React, ReactDOM, useEffect, useState, useMemo } from "react";
import styles from "../styles/Home.module.scss";

const NotificationBox = ({ message = "", show = false }) => {
    const [showNotification, setShowNotification] = useState(false)

    useEffect(() => {
        if (showNotification) {
            const ele = document.getElementById("notificationBox");
            if (!ele.classList.contains("active")) ele.classList.add("active");
            setTimeout(() => {
                if (ele.classList.contains("active")) ele.classList.remove("active");
            }, 3000);
        }
    }, [showNotification])

    return (
        <div className={styles.notificationContainer} id="notificationBox">
            <div className={styles.blurBackground} />
            <div className={styles.notificationBox}>
                <p>{message}</p>
            </div>
        </div>
    )
}

export default NotificationBox;