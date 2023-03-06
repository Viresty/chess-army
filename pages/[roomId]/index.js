import Head from 'next/head'
import { useEffect, useMemo, useState } from 'react'
import styles from '../../styles/Play.module.scss'
import Router, { useRouter } from 'next/router';

import { ref, child, get, update, orderByChild, query, equalTo, onValue } from "firebase/database";
import { database } from "../api/firebase";

import Header from '../../components/Header';

export default function Room() {
    const [roomData, setRoomData] = useState({});
    const [playersData, setPlayersData] = useState([]);
    const [accountInfo, setAccountInfo] = useState({});
    const [loadedData, setLoadedData] = useState(0);
    const [logedIn, setLogedin] = useState(false);

    const dbRef = ref(database);
    const router = useRouter();

    async function getData() {
        const roomId = window.location.pathname.split("/")[1];

        let roomdata;
        let accountdata = localStorage.getItem("accountInfo");
        if (!accountdata) accountdata = JSON.parse(sessionStorage.getItem("accountInfo"));
        if (!accountdata) return;
        await get(child(dbRef, "user/" + accountdata.id))
            .then((snapshot) => {
                if (snapshot.exists()) {
                    const data = snapshot.val();
                    if (data.password === accountdata.password) {
                        setLogedin(true);
                        setAccountInfo({ ...data });
                        accountdata = data;
                    }
                } else {
                    console.log("Can't found user data");
                };
            })
            .catch((error) => {
                console.error(error);
            });

        await get(child(dbRef, "room/" + roomId))
            .then((snapshot) => {
                if (snapshot.exists()) {
                    setRoomData(snapshot.val());
                    roomdata = snapshot.val();
                } else {
                    console.log("Can't found room data");
                };
            })
            .catch((error) => {
                console.error(error);
            });

        const playerList = [];
        roomdata.players.map((player) => {
            get(child(dbRef, "user/" + player.id))
                .then((snapshot) => {
                    if (snapshot.exists()) {
                        playerList.push({ ...snapshot.val(), ...player });
                        setPlayersData([...playerList]);
                    } else {
                        console.log("Can't found user data");
                    };
                })
                .catch((error) => {
                    console.error(error);
                });
        })

        // Kiểm tra có phải người chơi thuộc phòng không
        // console.log(roomdata);
        // console.log(accountdata);
        if (roomdata.players.filter(x => x.id === accountdata.id).length > 0) console.log("Welcome to room:", roomId);
        else router.push("/play");
    }

    useEffect(() => {
        getData();
    }, []);

    const header = useMemo(() => {
        return <Header logedIn={logedIn} />
    }, [logedIn])

    const renderPlayers = useMemo(() => {
        return <>
            {
                playersData.map((player, idx) => {
                    return <div key={idx} className={styles.player}>
                        <div className={styles.playerAvatar}>
                            <img src={player.avatar}></img>
                        </div>
                        <p className={styles.playerName}>{player.name}</p>
                        {
                            player.ready ?
                                <p>SẴN SÀNG</p> :
                                <p>ĐANG CHUẨN BỊ ...</p>
                        }
                        <p></p>
                    </div>
                })
            }
        </>
    }, [roomData, playersData]);

    const renderTeamFormat = useMemo(() => {
        return (
            <div className={styles.teamFormat}>
                <div className={styles.playArea}>
                    {
                        [16, 15, 14, 13, 6, 5, 4, 3].map((i) => {
                            return (
                                <div key={i} id={"cell" + i} className={styles.blackBG} style={(i % 2 + Math.floor(i / 4) % 2) === 1 ? {backgroundColor: "#ffffed"} : {backgroundColor: "#90EE90"}}
                                    // onClick={() => handleClickCell(i)}
                                >
                                    <div className={styles.selectingCell} />
                                </div>
                            )
                        })
                    }
                </div>
                <div></div>
            </div>
        )
    }, []);

    return (
        <>
            <main className={styles.main}>
                {header}
                <div className={styles.room}>
                    <div className={styles.roomLeft}>
                        {renderPlayers}
                    </div>
                    <div className={styles.roomRight}>
                        <div className={styles.teamFormatList}></div>
                        {renderTeamFormat}
                        <button className={styles.readyButton}>
                            SẴN SÀNG
                        </button>
                    </div>
                </div>
            </main>
        </>
    )
}
