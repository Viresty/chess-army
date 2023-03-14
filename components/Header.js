import { React, ReactDOM, useEffect, useState, useMemo } from "react";
import styles from "../styles/Home.module.scss";
import Link from 'next/link';

const Header = ({ data = {}, logedIn = false, status = "home" }) => {

    const outRoom = () => {
        if (JSON.parse(localStorage.getItem("accountInfo"))) {
            const roomId = window.location.pathname.split("/")[1];
            const playerId = JSON.parse(localStorage.getItem("accountInfo")).id;

            update(ref(database, "room/" + roomId), { gameId: "" });

            get(child(dbRef, "room/" + roomId + "/players/")).then((snapshot) => {
                if (snapshot.exists) {
                    const index = snapshot.val().findIndex(x => x.id === playerId);
                    if (index !== -1) update(ref(database, "room/" + roomId + "/players/" + index), { id: "" });
                }
            })
        }
    }

    const renderPlayButton = useMemo(() => {
        switch (status) {
            case "home":
                return (
                    <Link href="/play">
                        <p>CHƠI</p>
                    </Link>
                )

            case "gamemode":
                return (
                    <p>CHẾ ĐỘ CHƠI</p>
                )

            default:
                break;

            case "room":
                return (
                    <Link href="/play" onClick={() => outRoom()}>
                        <p>THOÁT</p>
                    </Link>
                )
        }
    })

    return (
        <>
            <div className={styles.header}>
                <div className={styles.headerLeft}>
                    <img className={styles.headerLogo}></img>
                </div>
                <div className={styles.playButton}>
                    {renderPlayButton}
                </div>
                <div className={styles.headerRight}>
                    {
                        !logedIn ?
                            <div>
                                <Link href="/login"><p>ĐĂNG NHẬP</p></Link>
                            </div> :
                            <>
                                <div>
                                    <Link href="/login"><p>QUÂN CỜ</p></Link>
                                </div>
                                <div>
                                    <Link href="/login"><p>ĐỘI HÌNH</p></Link>
                                </div>
                                <div>
                                    <Link href="/login"><p>HỒ SƠ</p></Link>
                                </div>
                                <div>
                                    <img></img>
                                    <p>Avatar</p>
                                </div>
                            </>
                    }
                </div>
            </div>
        </>
    )
}

export default Header;