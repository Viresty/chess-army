import Head from 'next/head'
import { useEffect, useMemo, useState } from 'react'
import styles from '../../styles/Play.module.scss'
import Router, { useRouter } from 'next/router';

import { ref, child, get, update, orderByChild, query, equalTo, onValue } from "firebase/database";
import { database } from "../api/firebase";
// Component
import Header from '../../components/Header';
import NotificationBox from '../../components/NotificationBox';
import LoadingScreen from "../../components/LoadingScreen";
import Card from '../../components/Card';
// Data
import notifivn from "../../message/notification_vn";

const formatMap = [" _", " _", " _", " _", " _", " _", " _", " _"]

export default function Room() {
    const [roomData, setRoomData] = useState({});
    const [playersData, setPlayersData] = useState([]);
    const [accountInfo, setAccountInfo] = useState({});
    const [loadedData, setLoadedData] = useState(0);
    const [logedIn, setLogedin] = useState(false);

    const [chessDatabase, setChessDatabase] = useState([]);
    const [chessInfo, setChessInfo] = useState([]);
    const [selectingChess, setSelectingChess] = useState("");

    const [formatChess, setFormatChess] = useState([...formatMap]);

    const [notificationMessage, setNotificationMessage] = useState("");
    const [showNotification, setShowNotification] = useState(false);

    const dbRef = ref(database);
    const router = useRouter();

    // Function
    const setupNotification = (id) => {
        setNotificationMessage(Object.entries(notifivn).find(x => x[0] === id)[1]);
        setShowNotification(true);
    }

    async function getData() {

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

        const roomId = window.location.pathname.split("/")[1];

        let roomdata;
        let accountdata = JSON.parse(localStorage.getItem("accountInfo"));
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
                    if (snapshot.val().status === 1) router.push("/");
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
        roomdata.players.forEach((player) => {
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
        if (roomdata.players.filter(x => x.id === accountdata.id).length > 0) console.log("Welcome to room:", roomId);
        else if (roomdata.players.filter(x => x.id === "").length > 0) {
            const index = roomdata.players.findIndex(x => x.id === "");
            update(ref(database, "room/" + roomId + "/players/" + index), { id: accountdata.id });
            roomdata.players[index].id = accountdata.id;
        }
        else router.push("/play");

        const chessList = [];
        const playerColor = roomdata.players.find(x => x.id === accountdata.id).color;

        Object.entries(accountdata.items.chesses).map((value) => {
            const data = chessData.find(x => x.id === value[0]);
            [...Array(value[1]).keys()].forEach(() => {
                chessList.push({
                    img: playerColor === "w" ? data.img.white : data.img.black,
                    id: chessList.length + "_" + playerColor + "_" + data.id + "_",
                    position: "X"
                });
            })
            setChessInfo([...chessList]);
        })

        setTimeout(() => {
            setLoadedData(1);
        }, 1000);

        fetchDB();
    }

    const fetchDB = () => {
        if (loadedData === 0) return;

        const roomId = window.location.pathname.split("/")[1];

        onValue(query(ref(database, "room/" + roomId)), (snapshot) => {
            if (snapshot.exists) {
                setRoomData(snapshot.val());

                const playerList = [];
                snapshot.val().players.forEach((player) => {
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

                if (snapshot.val().players.filter(x => x.id !== "").length === 2 && snapshot.val().gameId === "" && snapshot.val().status !== 1) {
                    update(ref(database, "room/" + roomId), { gameId: (Date.now() + "").slice(5), status: 1 });
                } else if (snapshot.val().players.filter(x => x.id !== "").length !== 2 && snapshot.val().gameId !== "" && snapshot.val().status !== 0) {
                    update(ref(database, "room/" + roomId), { gameId: "", status: 0 });
                }

                if (snapshot.val().players.filter(x => x.ready).length === 2 && snapshot.val().gameId !== "" && snapshot.status !== 2) {
                    const roomdata = snapshot.val();
                    console.log(playersData);
                    createGame(roomdata).then((snapshot) => {
                        update(ref(database, "game/" + snapshot.gameId), snapshot)
                            .then(() => {
                                update(ref(database, "room/" + roomId), { status: 2 });
                                router.push("play/" + snapshot.gameId);
                            }
                            );
                    });
                }
            }
        })
    }

    async function createGame(roomdata) {
        // Lấy dữ liệu map
        let mapDatabase;
        await get(child(dbRef, "maps"))
            .then((snapshot) => {
                if (snapshot.exists()) {
                    mapDatabase = snapshot.val();
                } else {
                    console.log("Can't found room data");
                };
            })
            .catch((error) => {
                console.error(error);
            });

        const mapKeyList = Object.keys(mapDatabase);
        const mapId = mapKeyList[Math.floor(Math.random() * mapKeyList.length)]

        // Xây dựng map

        // Khởi tạo dữ liệu người chơi
        const players = [];
        playersData.forEach((player) => {
            players.push({
                color: player.color,
                id: player.id,
                lastMove: "",
                timeBonus: 0,
                timer: 900,
                chesses: player.teamFormat[player.format].chesses,
                connected: false,
            })
        })

        // Trả về
        return {
            gameId: roomdata.gameId,
            history: "",
            mapId: mapId,
            otherObjects: "",
            players: players,
            roomId: roomdata.id,
            turn: 0,
            lastUpdateMove: "",
        };
    }

    const handleClickChess = (id) => {
        if (roomData.players.find(x => x.id === accountInfo.id).ready) return;

        const newformat = [...formatChess];
        let index = newformat.findIndex(x => x === selectingChess);
        var chesscell = document.getElementById(id) ? document.getElementById(id) : document.getElementById(id + "*");

        if (id === selectingChess) {
            console.log("Chosing ...");
            const chessinfo = selectingChess.split("_");
            newformat[index] = " _";
            setFormatChess([...newformat]);

            const newChessList = [...chessInfo];
            newChessList[chessinfo[0]].position = "X";
            setChessInfo([...newChessList]);

            if (chesscell.classList.contains(styles.chessSelecting)) chesscell.classList.remove(styles.chessSelecting);
            setSelectingChess("");

            [...Array(8).keys()].forEach((i) => {
                const cell = document.getElementById("cell" + i);
                if (cell.classList.contains(styles.chessSelecting)) cell.classList.remove(styles.chessSelecting);
            })
        } else if (selectingChess === "") {
            setSelectingChess(id);
            formatChess.forEach((value, idx) => {
                if (value === " _") {
                    const cell = document.getElementById("cell" + idx);
                    if (!cell.classList.contains(styles.chessSelecting)) cell.classList.add(styles.chessSelecting);
                }
                if (!chesscell.classList.contains(styles.chessSelecting)) chesscell.classList.add(styles.chessSelecting);
            })
        }
    }

    const handleClickCell = (i, idx) => {
        // console.log(formatChess);
        var chesscell = document.getElementById(selectingChess) ? document.getElementById(selectingChess) : document.getElementById(selectingChess + "*");

        if (selectingChess !== "") {
            const chessinfo = selectingChess.split("_")
            let newformat = [...formatChess];
            let index = newformat.findIndex(x => x === selectingChess);
            if (index !== -1) newformat[index] = " _";
            newformat[idx] = selectingChess;
            setFormatChess([...newformat]);

            const newChessList = [...chessInfo];
            newChessList[chessinfo[0]].position = i;
            setChessInfo([...newChessList]);
            setSelectingChess("");

            if (chesscell.classList.contains(styles.chessSelecting)) chesscell.classList.remove(styles.chessSelecting);
        }

        [...Array(8).keys()].forEach((i) => {
            const cell = document.getElementById("cell" + i);
            if (cell.classList.contains(styles.chessSelecting)) cell.classList.remove(styles.chessSelecting);
        })
    }

    const handleReady = (ready = true) => {
        const chessList = [];
        const roomId = window.location.pathname.split("/")[1];
        const playerId = accountInfo.id;
        const index = roomData.players.findIndex(x => x.id === playerId);

        if (ready) {
            chessInfo.forEach((chess, idx) => {
                if (chess.position === "X") return;
                const chessinfo = chess.id.split("_");
                chessList.push({ chessId: chessinfo[2], position: chess.position });
            })

            if (!chessList.find(x => x.chessId === "king")) {
                setupNotification("ER002");
                return;
            };
            update(ref(database, "user/" + accountInfo.id + "/teamFormat/0"), { chesses: chessList });
        }

        update(ref(database, "room/" + roomId + "/players/" + index), { ready: ready });
    }

    // UseEffect
    useEffect(() => {
        getData();

        const outRoom = () => {
            if (JSON.parse(localStorage.getItem("accountInfo"))) {
                const roomId = window.location.pathname.split("/")[1];
                const playerId = JSON.parse(localStorage.getItem("accountInfo")).id;

                update(ref(database, "room/" + roomId), { gameId: "" });

                get(child(dbRef, "room/" + roomId + "/players/")).then((snapshot) => {
                    if (snapshot.exists) {
                        const index = snapshot.val().findIndex(x => x.id === playerId);
                        if (index !== -1) update(ref(database, "room/" + roomId + "/players/" + index), { id: "", ready: false });
                    }
                })
            }
        }

        window.addEventListener('beforeunload', () => outRoom());

        return () => {
            window.removeEventListener('beforeunload', () => outRoom());
        }
    }, []);

    useEffect(() => {
        fetchDB();
    }, [loadedData]);

    // Render
    const header = useMemo(() => {
        return <Header logedIn={logedIn} status={"room"} />
    }, [logedIn]);

    const renderNotification = useMemo(() => {
        setTimeout(() => {
            setShowNotification(false);
        }, 500);
        return <NotificationBox message={notificationMessage} show={showNotification} />;
    }, [notificationMessage, showNotification])

    const renderPlayers = useMemo(() => {
        return <>
            {
                playersData.map((player, idx) => {
                    return (
                        <div key={idx} className={styles.player}>
                            <div className={styles.playerAvatar}>
                                <img src={player.avatar}></img>
                            </div>
                            <p className={styles.playerName}>{player.name ? player.name : "ĐANG CHỜ ..."}</p>
                            {
                                player.ready ?
                                    <p style={{ color: "green" }}>SẴN SÀNG</p> :
                                    <p>ĐANG CHUẨN BỊ ...</p>
                            }
                            <p></p>
                        </div>
                    )
                })
            }
        </>
    }, [roomData, playersData]);

    const renderAllChesses = useMemo(() => {
        const chessList = chessInfo.filter(x => x.position === "X");
        return (
            <div className={styles.inventoryWrapper}>
                <div className={styles.inventory}>
                    {
                        // console.log(accountInfo.items)
                        chessList.map((chess, idx) => {
                            return (
                                <>
                                    <div key={idx} className={styles.inventoryItem}
                                        onClick={() => { handleClickChess(chess.id) }}
                                    >
                                        <div className={[styles.chessItem, styles.chess].join(" ")} id={chess.id + "*"}>
                                            <img src={chess.img} />
                                        </div>
                                    </div>
                                </>
                            )
                        })
                    }
                </div>
            </div>
        )
    }, [loadedData, chessInfo, formatChess, selectingChess, roomData]);

    const renderReadyButton = useMemo(() => {
        return (
            <>
                {
                    playersData.find(x => x.id === accountInfo.id) ?
                        (playersData.find(x => x.id === accountInfo.id).ready ?
                            <button className={styles.readyButton} onClick={() => { handleReady(false) }}>HỦY</button> :
                            <button className={styles.readyButton} onClick={() => { handleReady(true) }}>SẴN SÀNG</button>) :
                        <></>
                }
            </>
        )
    }, [playersData, accountInfo, roomData]);

    const renderFormatedChess = useMemo(() => {
        const chessList = chessInfo.filter(x => x.position !== "X");

        return <>
            {
                chessList.map((chess, idx) => {
                    return (
                        <>
                            <div key={idx} className={styles.chess}
                                style={{ top: Math.floor((16 - chess.position) / 10) * 100 + "px", left: ((16 - chess.position) % 10) * 100 + "px" }}
                                id={chess.id}
                                onClick={() => handleClickChess(chess.id)}
                            >
                                <img src={chess.img}></img>
                            </div>
                        </>
                    )
                })}
        </>
    }, [loadedData, chessInfo, formatChess, selectingChess])

    const renderTeamFormat = useMemo(() => {
        return (
            <>
                <div className={styles.playArea}>
                    {
                        [16, 15, 14, 13, 6, 5, 4, 3].map((i, idx) => {
                            return (
                                <div key={idx} id={"cell" + idx} className={(i % 2 + Math.floor(i / 10) % 2) === 1 ? styles.blackBG : styles.whiteBG}
                                    onClick={() => handleClickCell(i, idx)}
                                >
                                    <img src={"https://i.ibb.co/VwKTjfW/grassland.png"} alt="grassland" border="0"></img>
                                    <div className={styles.selectingCell} />
                                </div>
                            )
                        })
                    }
                    {renderFormatedChess}
                </div>
                <div></div>
            </>
        )
    }, [chessInfo, selectingChess, formatChess, selectingChess]);

    const renderLoadingScreen = useMemo(() => {
        return <LoadingScreen loaded={loadedData} />
    }, [loadedData]);

    const renderCard = useMemo(() => {
        return <Card />
    }, [])

    return (
        <>
            <Head>
                <title>Chess Army</title>
                <meta name="description" content="Generated by create next app" />
                <meta name="viewport" content="width=device-width, initial-scale=1" />
            </Head>
            {renderNotification}
            {renderLoadingScreen}
            <main className={styles.main}>
                {header}
                <div className={styles.room}>
                    <div className={styles.roomLeft}>
                        {renderPlayers}
                    </div>
                    <div className={styles.roomCenter}>
                        <div className={styles.teamFormatList}>
                            {renderAllChesses}
                        </div>
                        <div className={styles.teamFormat}>
                            {renderTeamFormat}
                        </div>
                        {renderReadyButton}
                    </div>
                    <div className={styles.roomRight}>
                        {renderCard}
                    </div>
                </div>
            </main>
        </>
    )
}
