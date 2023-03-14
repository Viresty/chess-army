import Head from 'next/head'
import styles from "../../styles/Play.module.scss";

import { ref, child, get, update, query, onValue } from "firebase/database";
import { database } from "../api/firebase";
import { React, ReactDOM, useEffect, useState, useMemo } from "react";
import Router, { useRouter } from "next/router";
// Component
import Card from "../../components/Card";
import NotificationBox from '../../components/NotificationBox';
import LoadingScreen from '../../components/LoadingScreen';
import WaitingScreen from '../../components/WaitingScreen';
// Data
import notifivn from "../../message/notification_vn"

let ObjectMap = [
    [" _", " _", " _", " _", " _", " _", " _", " _", " _", " _"],
    [" _", " _", " _", " _", " _", " _", " _", " _", " _", " _"],
    [" _", " _", " _", " _", " _", " _", " _", " _", " _", " _"],
    [" _", " _", " _", " _", " _", " _", " _", " _", " _", " _"],
    [" _", " _", " _", " _", " _", " _", " _", " _", " _", " _"],
    [" _", " _", " _", " _", " _", " _", " _", " _", " _", " _"],
    [" _", " _", " _", " _", " _", " _", " _", " _", " _", " _"],
    [" _", " _", " _", " _", " _", " _", " _", " _", " _", " _"],
    [" _", " _", " _", " _", " _", " _", " _", " _", " _", " _"],
    [" _", " _", " _", " _", " _", " _", " _", " _", " _", " _"],
]

// " _" là đất trống
// "w" là quân trắng, "b" là quân đen
// "|" là vật thể cao, "/" là hố sâu, "-" là vật che
// "!" là không thể tiêu diệt
// "#" là hiển thị tầm di chuyển của cờ, "*" là hiển thị tạm thời

export default function Play() {
    const [chessDatabase, setChessDatabase] = useState([]);
    const [loadedData, setLoadedData] = useState(0);

    const [turn, setTurn] = useState(2); // White: 2n + 1, Black: 2n
    const [phase, setPhase] = useState(1); // 0: Setting; 1: Waitting, 2: Chosing
    const [mapInfo, setMapInfo] = useState({});
    const [chessInfos, setChessInfos] = useState([]);
    const [objectInfos, setObjectInfos] = useState([]);

    const [gameData, setGameData] = useState({});
    const [userInfo, setUserInfo] = useState({});
    const [playerData, setPlayerData] = useState([]);

    const [selectingChess, setSelectingChess] = useState({});
    const [objectsMap, setObjectsMap] = useState([...ObjectMap]);

    const [notificationMessage, setNotificationMessage] = useState("");
    const [showNotification, setShowNotification] = useState(false);

    // Timer
    const [gameTimerCountDown, setGameTimerCountDown] = useState();
    const [gameTimer, setGameTimer] = useState();

    const dbRef = ref(database);
    const router = useRouter();

    // Function
    const setupNotification = (id) => {
        setNotificationMessage(Object.entries(notifivn).find(x => x[0] === id)[1]);
        setShowNotification(true);
    }

    async function getData() {
        if (loadedData > 0) return;

        let chessData;

        let accountdata = JSON.parse(localStorage.getItem("accountInfo"));
        if (!accountdata) accountdata = JSON.parse(sessionStorage.getItem("accountInfo"));
        if (!accountdata) router.push("/");

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

        await get(child(dbRef, "game/" + window.location.pathname.split("/")[2]))
            .then((snapshot) => {
                if (snapshot.exists()) {
                    setGameData(snapshot.val());
                    if (!snapshot.val().players.find(x => x.id === accountdata.id)) router.push("/");
                    else {
                        const index = snapshot.val().players.findIndex(x => x.id === accountdata.id);
                        update(ref(database, "game/" + window.location.pathname.split("/")[2] + "/players/" + index),
                            { connected: true });
                    }
                    // Lấy các dữ liệu khác như bản đồ, người chơi và quân cờ
                    get(child(dbRef, "maps/" + snapshot.val().mapId))
                        .then((snapshot) => {
                            if (snapshot.exists()) {
                                setMapInfo(snapshot.val());
                            } else {
                                console.log("No data available");
                            }
                        })
                        .catch((error) => {
                            console.log(error)
                        })

                    const playerList = [];
                    snapshot.val().players.forEach((player) => {
                        get(child(dbRef, "user/" + player.id))
                            .then((snapshot) => {
                                if (snapshot.exists()) {
                                    playerList.push({ ...snapshot.val(), ...player });
                                    setPlayerData([...playerList]);
                                } else {
                                    console.log("Can't found user data");
                                };
                            })
                            .catch((error) => {
                                console.error(error);
                            });
                    })

                    const chessList = [];
                    let userColor = "";
                    snapshot.val().players.map((player, idx) => {
                        const playerColor = player.color;

                        if (player.id === accountdata.id) {
                            setUserInfo({ ...accountdata, "color": playerColor, "index": idx });
                            if (userColor !== playerColor) userColor = playerColor;
                            console.log("player color:", userColor);
                        }

                        setGameData(snapshot.val());

                        player.chesses.map((chess, idx) => {
                            const data = chessData.filter(x => x.id === chess.chessId)[0];
                            chessList.push({
                                ...data,
                                position: chess.position === "X" ? "X" : (userColor === playerColor ? 99 - chess.position : chess.position),
                                color: playerColor,
                                id: chessList.length + "_" + playerColor + "_" + data.id + "_"
                            });
                            setChessInfos([...chessList]);
                        })
                    })

                    setTurn(snapshot.val().turn);
                } else {
                    console.log("No data available");
                    router.push("/");
                }
            })
            .catch((error) => {
                console.error(error);
            });
        setTimeout(() => {
            setLoadedData(1);
        }, 1000);
    };

    const updateMove = (chess, newPos) => {
        // update chess's position
        const allChessList = [];
        chessInfos.forEach((chess) => {
            allChessList.push(chess);
        })
        const chessinfo = chess.id.split("_");
        allChessList[chessinfo[0]].position = newPos;

        const chessList = [];
        allChessList.filter(x => x.color === userInfo.color).forEach((chess) => {
            chessList.push({ chessId: chess.id.split("_")[2], position: 99 - chess.position })
        })

        // console.log(chessList);
        chessList.forEach((value, idx) => {
            update(ref(database, "game/" + window.location.pathname.split("/")[2] + "/players/" + userInfo.index + "/chesses/" + idx), value);
        })
        update(ref(database, "game/" + window.location.pathname.split("/")[2] + "/players/" + userInfo.index), { timer: gameTimer });
        update(ref(database, "game/" + window.location.pathname.split("/")[2]), { turn: turn + 1, lastMoveTime: Date.now() });
    }

    const fetchDB = () => {
        if (loadedData === 0) return;

        onValue(query(ref(database, "game/" + window.location.pathname.split("/")[2])), (snapshot) => {
            if (snapshot.exists()) {
                setGameData(snapshot.val());

                if (snapshot.val().players.filter(x => x.connected).length === 2 && snapshot.val().lastMoveTime === "")
                    update(ref(database, "game/" + window.location.pathname.split("/")[2]), { turn: turn + 1, lastMoveTime: Date.now() });

                const playerList = [];
                snapshot.val().players.forEach((player) => {
                    get(child(dbRef, "user/" + player.id))
                        .then((snapshot) => {
                            if (snapshot.exists()) {
                                playerList.push({ ...snapshot.val(), ...player });
                                setPlayerData([...playerList]);
                            } else {
                                console.log("Can't found user data");
                            };
                        })
                        .catch((error) => {
                            console.error(error);
                        });
                })

                const chessList = [];
                let userColor = "";
                snapshot.val().players.forEach((player) => {
                    const playerColor = player.color;

                    if (player.id === userInfo.id) {
                        if (userColor !== playerColor) userColor = playerColor;
                    }

                    player.chesses.forEach((chess) => {
                        const data = chessDatabase.filter(x => x.id === chess.chessId)[0];
                        chessList.push({
                            ...data,
                            position: chess.position === "X" ? "X" : (userColor === playerColor ? 99 - chess.position : chess.position),
                            color: playerColor,
                            id: chessList.length + "_" + playerColor + "_" + data.id + "_"
                        });
                        setChessInfos([...chessList]);
                    })

                    setTurn(snapshot.val().turn);
                })
            }
        })
    }

    const handleClickCell = (i) => {
        if (phase !== 2) return;
        let x = Math.floor(i / 10);
        let y = i % 10;
        let chess = { ...selectingChess };
        let chessinfo = chess.id.split("_");
        let chesses = [...chessInfos];
        let originpos = chess.position;
        let X = Math.floor(originpos / 10);
        let Y = originpos % 10;
        if (objectsMap[x][y].includes("#")) {
            showMovesOff("#");
            showMovesOff("*");
            chess.position = i;
            // console.log(chess);
            chesses[chessinfo[0]] = chess;
            let newMap = [...objectsMap];
            newMap[x][y] = chess.id;
            newMap[X][Y] = " _";
            setObjectsMap(newMap);
            setChessInfos([...chesses]);
            setTurn(turn + 1);
            setPhase(1);
            updateMove(chess, i);
        }
    }

    const isMoveable = (cell, color = "", action = "") => {
        if (cell === null) return false;
        let chessinfo = cell.split("_");
        // Can't move or kill
        if (cell.includes("!")) return false;
        // Only moveable
        if (chessinfo[0] !== " " && action === "move") return false;
        if (chessinfo[0] === " " && action === "attack") return false;
        // Killable
        if (chessinfo[1] === color) return false;
        return true;
    }

    const showMovesOn = (chess, symbol) => {
        let x = Math.floor(chess.position / 10);
        let y = chess.position % 10;
        let limitX, limitY;
        let dataset = [chess.moveset];
        let action = "both";
        // Kiểm tra phạm vi tấn công có trùng với di chuyển không
        if (chess.attackset !== "same") {
            dataset.push(chess.attackset);
            action = "move";
        }
        dataset.forEach((data) => {
            Object.entries(data).map((move) => {
                switch (move[0]) {
                    case "forward":
                        limitX = (x - move[1] >= 0 ? x - move[1] : 0);
                        for (let i = x - 1; i >= limitX; i--) {
                            if (!isMoveable(objectsMap[i][y], chess.color, action)) continue;
                            objectsMap[i][y] += symbol;
                        }
                        break;

                    case "left":
                        limitY = (y - move[1] >= 0 ? y - move[1] : 0);
                        for (let i = y - 1; i >= limitY; i--) {
                            if (!isMoveable(objectsMap[x][i], chess.color, action)) continue;
                            objectsMap[x][i] += symbol;
                        }
                        break;

                    case "right":
                        limitY = (y + move[1] <= 9 ? y + move[1] : 9);
                        for (let i = y + 1; i <= limitY; i++) {
                            if (!isMoveable(objectsMap[x][i], chess.color, action)) continue;
                            objectsMap[x][i] += symbol;
                        }
                        break;

                    case "backward":
                        limitX = (x + move[1] <= 9 ? x + move[1] : 9);
                        for (let i = x + 1; i <= limitX; i++) {
                            if (!isMoveable(objectsMap[i][y], chess.color, action)) continue;
                            objectsMap[i][y] += symbol;
                        }
                        break;

                    case "forward-left":
                        limitX = (x - move[1] >= 0 ? x - move[1] : 0);
                        limitY = (y - move[1] >= 0 ? y - move[1] : 0);
                        for (let i = 1; (x - i >= limitX && y - i >= limitY); i++) {
                            if (!isMoveable(objectsMap[x - i][y - i], chess.color, action)) continue;
                            objectsMap[x - i][y - i] += symbol;
                        }
                        break;

                    case "forward-right":
                        limitX = (x - move[1] >= 0 ? x - move[1] : 0);
                        limitY = (y + move[1] <= 9 ? y + move[1] : 9);
                        for (let i = 1; (x - i >= limitX && y + i <= limitY); i++) {
                            if (!isMoveable(objectsMap[x - i][y + i], chess.color, action)) continue;
                            objectsMap[x - i][y + i] += symbol;
                        }
                        break;

                    case "backward-left":
                        limitX = (x + move[1] <= 9 ? x + move[1] : 9);
                        limitY = (y - move[1] >= 0 ? y - move[1] : 0);
                        for (let i = 1; (x + i <= limitX && y - i >= limitY); i++) {
                            if (!isMoveable(objectsMap[x + i][y - i], chess.color, action)) continue;
                            objectsMap[x + i][y - i] += symbol;
                        }
                        break;

                    case "backward-right":
                        limitX = (x + move[1] <= 9 ? x + move[1] : 9);
                        limitY = (y + move[1] <= 9 ? y + move[1] : 9);
                        for (let i = 1; (x + i <= limitX && y + i <= limitY); i++) {
                            if (!isMoveable(objectsMap[x + i][y + i], chess.color, action)) continue;
                            objectsMap[x + i][y + i] += symbol;
                        }
                        break;

                    case "knight":
                        let topX, bottomX, topY, bottomY;
                        let leftY, rightY, leftX, rightX;
                        topX = bottomX = topY = bottomY = x;
                        leftY = rightY = leftX = rightX = y;
                        for (let i = 1; i <= move[1]; i++) {
                            topX -= 2; bottomX += 2; leftX -= 1; rightX += 1;
                            topY -= 1; bottomY += 1; leftY -= 2; rightY += 2;
                            // forward-left
                            if (topX >= 0 && leftX >= 0)
                                if (isMoveable(objectsMap[topX][leftX], chess.color, action)) objectsMap[topX][leftX] += symbol;
                            // forward-right
                            if (topX >= 0 && rightX < 10)
                                if (isMoveable(objectsMap[topX][rightX], chess.color, action)) objectsMap[topX][rightX] += symbol;
                            // backward-left
                            if (bottomX < 10 && leftX >= 0)
                                if (isMoveable(objectsMap[bottomX][leftX], chess.color, action)) objectsMap[bottomX][leftX] += symbol;
                            // backward-right
                            if (bottomX < 10 && rightX < 10)
                                if (isMoveable(objectsMap[bottomX][rightX], chess.color, action)) objectsMap[bottomX][rightX] += symbol;
                            // forward-left
                            if (topY >= 0 && leftY >= 0)
                                if (isMoveable(objectsMap[topY][leftY], chess.color, action)) objectsMap[topY][leftY] += symbol;
                            // forward-right
                            if (topY >= 0 && rightY < 10)
                                if (isMoveable(objectsMap[topY][rightY], chess.color, action)) objectsMap[topY][rightY] += symbol;
                            // backward-left
                            if (bottomY < 10 && leftY >= 0)
                                if (isMoveable(objectsMap[bottomY][leftY], chess.color, action)) objectsMap[bottomY][leftY] += symbol;
                            // backward-right
                            if (bottomY < 10 && rightY < 10)
                                if (isMoveable(objectsMap[bottomY][rightY], chess.color, action)) objectsMap[bottomY][rightY] += symbol;
                        }

                    default:
                        break;
                }
            });
            action = "attack";
        });
        [...Array(100).keys()].forEach((i) => {
            let x = Math.floor(i / 10);
            let y = i % 10;
            if (objectsMap[x][y].includes(symbol)) {
                let cell = document.getElementById("cell" + i);
                if (!cell.classList.contains(styles.chessHovering) & symbol === "*") cell.classList.add(styles.chessHovering);
                if (!cell.classList.contains(styles.chessSelecting) & symbol === "#") cell.classList.add(styles.chessSelecting);
            }
        })

        var chesscell = document.getElementById(chess.id);
        if (!chesscell.classList.contains(styles.chessHovering) & symbol === "*") chesscell.classList.add(styles.chessHovering);
        if (!chesscell.classList.contains(styles.chessSelecting) & symbol === "#") chesscell.classList.add(styles.chessSelecting);
    }

    const showMovesOff = (symbol) => {
        [...Array(100).keys()].forEach((i) => {
            let x = Math.floor(i / 10);
            let y = i % 10;
            if (objectsMap[x][y].includes(symbol)) {
                let cell = document.getElementById("cell" + i);

                if (symbol === "*") {
                    objectsMap[x][y] = objectsMap[x][y].replace("*", "");
                    if (cell.classList.contains(styles.chessHovering)) cell.classList.remove(styles.chessHovering);
                }

                if (symbol === "#") {
                    objectsMap[x][y] = objectsMap[x][y].replace("#", "");
                    if (cell.classList.contains(styles.chessSelecting)) cell.classList.remove(styles.chessSelecting);
                }
            }
        })
        chessInfos.forEach((chess) => {
            var chesscell = document.getElementById(chess.id);
            if (chesscell.classList.contains(styles.chessHovering) & symbol === "*") chesscell.classList.remove(styles.chessHovering);
            if (chesscell.classList.contains(styles.chessSelecting) & symbol === "#") chesscell.classList.remove(styles.chessSelecting);
        })
    }

    const handleClickChess = (chess) => {
        switch (phase) {
            case 1:
                if (turn % 2 === 1 && userInfo.color !== "w" || turn % 2 === 0 && userInfo.color !== "b") {
                    setupNotification("ER000");
                    return;
                };
                if (userInfo.color !== chess.color) {
                    setupNotification("ER001");
                    return;
                };
                setSelectingChess(chess);
                showMovesOn(chess, "#", "move");
                setPhase(2);
                break;

            case 2:
                let position = chess.position;
                let x = Math.floor(position / 10);
                let y = position % 10;
                if (objectsMap[x][y].includes("#")) {
                    chess.position = "X";
                    let chesses = [...chessInfos]
                    chesses[chess.id.split("_")[0]] = chess;
                    setChessInfos([...chesses]);
                }
                handleClickCell(position);
                setSelectingChess({});
                showMovesOff("#");
                setPhase(1);
                break;

            default:
                break;
        }
    }

    const handleHoverChess = (chess) => {
        showMovesOn(chess, "*");
    }

    const cancelHoverChess = () => {
        showMovesOff("*");
    }

    // getData
    useEffect(() => {
        getData();
    }, [])

    // Update game
    useEffect(() => {
        const newMap = [];
        ObjectMap.forEach((row) => {
            newMap.push([...row]);
        })

        chessInfos.map((chess) => {
            let x = Math.floor(chess.position / 10);
            let y = chess.position % 10;
            if (chess.position !== "X") {
                newMap[x][y] = chess.id;
            }
        })
        setObjectsMap([...newMap]);
    }, [turn, chessInfos]);

    // Update
    useEffect(() => {
        fetchDB();
    }, [loadedData]);

    useEffect(() => {
        if (!gameData.players) return;
        const turnColor = turn % 2 === 1 ? "w" : "b";
        setGameTimer(gameData.players.find(x => x.color === turnColor).timer + 10);

        clearInterval(gameTimerCountDown);
        setGameTimerCountDown(setInterval(() => {
            setGameTimer(gameData.players.find(x => x.color === turnColor).timer - Math.floor((Date.now() - gameData.lastMoveTime) / 1000));
        }, 500))
    }, [turn, gameData]);

    // Render
    const renderNotification = useMemo(() => {
        setTimeout(() => {
            setShowNotification(false);
        }, 500);
        return <NotificationBox message={notificationMessage} show={showNotification} />;
    }, [notificationMessage, showNotification])

    const renderGround = useMemo(() => {
        return (
            <>
                {
                    [...Array(100).keys()].map((i) => {
                        return (
                            <div key={i} id={"cell" + i} className={(i % 2 + Math.floor(i / 10) % 2) === 1 ? styles.blackBG : styles.whiteBG}
                                onClick={() => handleClickCell(i)}
                            >
                                <img src={mapInfo.imgUrl ? mapInfo.imgUrl.cell : ""} alt="grassland" border="0"></img>
                                <div className={styles.selectingCell} />
                            </div>
                        )
                    })
                }
            </>
        )
    }, [mapInfo, objectsMap, turn, phase]);

    const renderObject = useMemo(() => {
        return (
            <>
                {
                    chessInfos.map((chess, idx) => {
                        return (
                            <>
                                {
                                    chess.position !== "X" &&
                                    <div key={idx} className={styles.chess}
                                        style={{ top: Math.floor(chess.position / 10) * 100 + "px", left: (chess.position % 10) * 100 + "px" }}
                                        id={chess.id}
                                        onMouseEnter={() => handleHoverChess(chess)}
                                        onMouseLeave={() => cancelHoverChess()}
                                        onClick={() => handleClickChess(chess)}
                                    >
                                        <img src={chess.color === "w" ? chess.img.white : chess.img.black}></img>
                                    </div>
                                }
                            </>
                        )
                    })
                }
            </>
        )
    }, [chessInfos, turn, objectsMap, objectInfos, phase])

    const renderPlayArea = useMemo(() => {
        return (
            <>
                <img className={styles.inGameBackground} src="https://i.ibb.co/n30yjHG/grassland-bg.jpg" alt="grassland-bg" border="0"></img>
                < div className={styles.playArea} >
                    {renderGround}
                    {renderObject}
                </div >
            </>
        )
    }, [chessInfos, mapInfo, objectsMap, turn, phase]);

    const renderWaitingScreen = useMemo(() => {
        return <>
            <WaitingScreen data={playerData} />
        </>
    }, [playerData]);

    const renderLoadingScreen = useMemo(() => {
        return <LoadingScreen loaded={loadedData} />
    }, [loadedData]);

    const Timer = useMemo(() => {
        if (!gameData.players) return;
        var timer = gameTimer;

        const turnColor = turn % 2 === 1 ? "w" : "b";
        timer += playerData.find(x => x.color !== turnColor) ? playerData.find(x => x.color !== turnColor).timer : 0;

        function dragElement(elmnt) {
            if (!elmnt) return;
            var pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
            var divMove = false;

            elmnt.onmousedown = dragMouseDown;

            function dragMouseDown(e) {
                e = e || window.event;
                e.preventDefault();
                // get the mouse cursor position at startup:
                pos3 = e.clientX;
                pos4 = e.clientY;
                document.onmouseup = closeDragElement;
                // call a function whenever the cursor moves:
                document.onmousemove = elementDrag;
            }

            function elementDrag(e) {
                divMove = true;
                e = e || window.event;
                e.preventDefault();
                // calculate the new cursor position:
                pos1 = pos3 - e.clientX;
                pos2 = pos4 - e.clientY;
                pos3 = e.clientX;
                pos4 = e.clientY;
                const rect = elmnt.getBoundingClientRect();
                // set the element's new position:
                if (elmnt.offsetTop - pos2 > 10 && (elmnt.offsetTop - pos2 + rect.height) < window.innerHeight - 10)
                    elmnt.style.top = (elmnt.offsetTop - pos2) + "px";
                if (elmnt.offsetLeft - pos1 > 10 && (elmnt.offsetLeft - pos1 + rect.width) < window.innerWidth - 10)
                    elmnt.style.left = (elmnt.offsetLeft - pos1) + "px";
            }

            function closeDragElement() {
                /* stop moving when mouse button is released:*/
                document.onmouseup = null;
                document.onmousemove = null;
                // if (divMove) { alert("Div move"); }
                // else {
                //     alert("Click func")
                // }
                divMove = false;
            }
        }

        dragElement(document.getElementById("gameTimer"));

        return (
            <>
                <div className={[styles.timerWrapper, turnColor === "w" ? styles.whiteTurn : styles.blackTurn].join(' ')} id="gameTimer">
                    {
                        playerData.map((player) => {
                            const playertimer = player.color === turnColor ? gameTimer : player.timer;
                            return <>
                                <div className={[player.color === "w" ? styles.whitePlayer : styles.blackPlayer,
                                player.id === userInfo.id ? styles.timerBottom : styles.timerTop].join(" ")}>
                                    <p className={styles.playerName}>{player.name}</p>
                                    <div className={styles.timer}>
                                        <span>{("00" + Math.floor(playertimer / 60)).slice(-2, -1)}</span>
                                        <span>{("00" + Math.floor(playertimer / 60)).slice(-1)}</span>
                                        <span>:</span>
                                        <span>{("00" + playertimer % 60).slice(-2, -1)}</span>
                                        <span>{("00" + playertimer % 60).slice(-1)}</span>
                                    </div>
                                </div>
                            </>
                        })
                    }
                    <div className={styles.mainTimer}>
                        <div className={styles.timer}>
                            <span>{("00" + Math.floor(timer / 60)).slice(-2, -1)}</span>
                            <span>{("00" + Math.floor(timer / 60)).slice(-1)}</span>
                            <span>:</span>
                            <span>{("00" + timer % 60).slice(-2, -1)}</span>
                            <span>{("00" + timer % 60).slice(-1)}</span>
                        </div>
                    </div>
                </div>
            </>
        )
    }, [gameData, gameTimer, gameTimerCountDown, playerData])

    return (
        <>
            {renderNotification}
            {Timer}
            {renderWaitingScreen}
            {renderLoadingScreen}
            <Head>
                <meta name="description" content="Generated by create next app" />
                <meta name="viewport" content="width=device-width, initial-scale=1" />
                <title>Chess Army</title>
            </Head>
            <main className={styles.main}>
                {renderPlayArea}
            </main>
        </>
    );
}
