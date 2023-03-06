import { React, ReactDOM, useEffect, useState, useMemo } from "react";
import StatusIcon from "./StatusIcon";
import styles from "../styles/Play.module.scss";

const Card = ({ data = {} }) => {
    return (
        <>
            <div className={styles.card}>
                <img className={styles.cardBackground} src={data.bgImg}></img>
                <div className={styles.cardInfo}>
                    <div className={styles.cardName}>
                        <p>{data.name}</p>
                    </div>
                    <div className={styles.cardAbility}>
                        {
                            data.ability.content?<></>:<p>{data.ability.content}</p>
                        }
                    </div>
                </div>
            </div>
        </>
    )
}

export default Card;