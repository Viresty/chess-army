import Head from 'next/head'
import { useEffect, useMemo, useState } from 'react'
import styles from '../../styles/Play.module.scss'
import Router, { useRouter } from 'next/router';

import { ref, child, get, update, orderByChild, query, equalTo, onValue } from "firebase/database";
import { database } from "../api/firebase";

import Header from '../../components/Header';

export default function Room() {
    const [chessDatabase, setChessDatabase] = useState([]);
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

        let chessData;

        await get(query(ref(database, "chess")))
            .then((snapshot) => {
                if (snapshot.exists()) {
                    setChessDatabase(Object.values(snapshot.val()));
                    chessData = Object.values(snapshot.val());
                } else {
                    console.log("Can't found data");
                };
            })
            .catch((error) => {
                console.error(error);
            });

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
        setLoadedData(1);
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

    const renderAllChesses = useMemo(() => {
        if (loadedData === 0) return;

        let color = "w";
        color = playersData.find(x => x.id === accountInfo.id)?playersData.find(x => x.id === accountInfo.id).color:"w";

        return (
            <div className={styles.inventory}>
                {
                    // console.log(accountInfo.items)
                    Object.entries(accountInfo.items.chesses).map((chess) => {
                        const data = chessDatabase.find(x => x.id === chess[0]);
                        return (
                            <div className={styles.inventoryItem}>
                                <img src={color==="w"?data.img.white:data.img.black} />
                            </div>
                        )
                    })
                }
            </div>
        )
    }, [accountInfo, loadedData, playersData]);


    const renderTeamFormat = useMemo(() => {
        return (
            <>
                <div className={styles.playArea}>
                    {
                        [16, 15, 14, 13, 6, 5, 4, 3].map((i) => {
                            return (
                                <div key={i} id={"cell" + i} className={styles.blackBG} style={(i % 2 + Math.floor(i / 10) % 2) === 1 ? { backgroundColor: "#ffffed" } : { backgroundColor: "#90EE90" }}
                                // onClick={() => handleClickCell(i)}
                                >
                                    <div className={styles.selectingCell} />
                                </div>
                            )
                        })
                    }
                </div>
                <div></div>
            </>
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
                        <div className={styles.teamFormatList}>
                            {renderAllChesses}
                        </div>
                        <div className={styles.teamFormat}>
                            {renderTeamFormat}
                        </div>
                        <button className={styles.readyButton}>
                            SẴN SÀNG
                        </button>
                    </div>
                </div>
            </main>
        </>
    )
}
