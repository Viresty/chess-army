import { React, ReactDOM, useEffect, useState, useMemo } from "react";
import styles from "../styles/Play.module.scss";

const Card = () => {
    return (
        <>
            <div className={styles.card}>
                <p className={styles.cardStatus}>
                    Sinh Lực: {} <br />
                    Thể Lực: {} <br />
                    Giáp: {} <br />
                    Tấn Công: {} <br />
                    Tốc Độ: {} <br />
                </p>
                <div className={styles.cardInfo}>
                    <div></div>
                    <div></div>
                    <div></div>
                    <div></div>
                    <div></div>
                    <div></div>
                </div>
            </div>
        </>
    )
}

export default Card;