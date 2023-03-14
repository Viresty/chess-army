import { React, ReactDOM, useEffect, useState, useMemo } from "react";
import styles from "../styles/waitingScreen.module.scss";

const WaitingScreen = ({ data = {} }) => {
    const [loadComplete, setLoadComplete] = useState(false);

    useEffect(() => {
        console.log(data);
        if (data.filter(x => x.connected).length === 2) setLoadComplete(true);
    }, [data])

    const renderScreen = useMemo(() => {
        return <>
            {
                data.map((player, idx) => {
                    return (
                        <div className={styles.halfScreen} key={idx}>
                            <div className={[styles.player, player.color === "w"?styles.whitePlayer:styles.blackPlayer].join(" ")}>
                                <div className={styles.playerAvatar}>
                                    <img src={player.avatar}></img>
                                </div>
                                <div className={styles.playerName}>
                                    <p>
                                        {player.name}
                                    </p>
                                </div>
                            </div>
                            <p className={styles.playerConnect}>{player.connected?"KẾT NỐI THÀNH CÔNG":" ĐANG KẾT NỐI ..."}</p>
                        </div>
                    )
                })
            }
            <div className={styles.centerLetter}><p>V</p><p>S</p></div>
        </>
    }, [data]);

    return (
        <>
            <div className={[styles.waitingScreen, loadComplete?styles.loadSuccess:""].join(" ")} id="WaitingScreen">
                {renderScreen}
            </div>
        </>
    )
}

export default WaitingScreen;