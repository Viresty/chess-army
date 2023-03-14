import Head from 'next/head'
import { useState, useEffect, useMemo } from 'react';
import styles from "../../styles/Play.module.scss";
import Router, { useRouter } from 'next/router';
import Header from '../../components/Header';

import { ref, child, get, update, orderByChild, query, equalTo } from "firebase/database";
import { database } from "../api/firebase";
const dbRef = ref(database);

export default function Play() {
    const [accountInfo, setAccountInfo] = useState({});
    const [loadedData, setLoadedData] = useState(0);
    const [logedIn, setLogedin] = useState(false);

    const [searchRoomMode, setSearchRoomMode] = useState(false);
    const [searchRoomId, setSearchRoomId] = useState("");

    const router = useRouter();

    // Function
    async function getData() {
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
    }

    const createRoom = () => {
        const roomId = (Date.now() + "").slice(5);
        console.log(accountInfo);
        update(ref(database, "room/" + roomId), {
            delFlag: false,
            gameId: "",
            id: roomId,
            name: "",
            password: "",
            players: [
                {
                    color: "w",
                    format: 0,
                    id: accountInfo.id,
                    ready: false,
                    timer: 900,
                    timerBonus: 0,
                }, {
                    color: "b",
                    format: 0,
                    id: "",
                    ready: false,
                    timer: 900,
                    timerBonus: 0,
                }
            ]
        }).then(() => {
            router.push("/" + roomId);
        })
    }

    const setBackground = (url) => {
        document.getElementById("modeBackgound").setAttribute("src", url);
        document.getElementById("gameModeBackgound").classList.add(styles.backgroundBehind);
    }

    const handleSubmit = (e) => {
        e.preventDefault();

        get(child(dbRef, "room/" + searchRoomId))
            .then((snapshot) => {
                if (snapshot.exists()) {
                    router.push("/" + searchRoomId);
                } else {
                    console.log("Can't found user data");
                    document.getElementById("searchError").innerHTML = "PHÒNG KHÔNG TỒN TẠI"
                };
            })
            .catch((error) => {
                console.error(error);
            });
    }

    // UseEffect
    useEffect(() => {
        getData();
    }, []);

    // Render
    const header = useMemo(() => {
        return <Header logedIn={logedIn} status="gamemode" />
    }, [logedIn]);

    const searchRoom = useMemo(() => {
        return (
            <>
                {
                    searchRoomMode &&
                    <div className={styles.searchRoom}>
                        <div className={styles.blurBackground} onClick={() => setSearchRoomMode(false)}></div>
                        <form onSubmit={handleSubmit}>
                            <label htmlFor="roomId">NHẬP MÃ PHÒNG</label>
                            <input type="text" id="roomId" value={searchRoomId} onChange={(e) => { setSearchRoomId(e.target.value) }}></input>
                            <p id="searchError"></p>
                        </form>
                    </div>
                }
            </>
        )
    }, [searchRoomMode, searchRoomId]);

    const renderGameMode = useMemo(() => {
        return (
            <div className={styles.gameModeList}>

                <div className={styles.tiltBoxWrap}
                    onMouseEnter={() => setBackground("https://i.pinimg.com/564x/46/46/a9/4646a999d269efc758441802af49fd92.jpg")}
                    onMouseLeave={() => document.getElementById("gameModeBackgound").classList.remove(styles.backgroundBehind)}
                >
                    <span className={styles.tOver}></span>
                    <span className={styles.tOver}></span>
                    <span className={styles.tOver}></span>
                    <span className={styles.tOver}></span>
                    <span className={styles.tOver}></span>
                    <span className={styles.tOver}></span>
                    <span className={styles.tOver}></span>
                    <span className={styles.tOver}></span>
                    <span className={styles.tOver}></span>
                    <div className={styles.gameMode}
                        style={{ backgroundImage: "url(https://i.pinimg.com/564x/46/46/a9/4646a999d269efc758441802af49fd92.jpg)" }}
                    >
                        {/* <img src="https://i.pinimg.com/564x/46/46/a9/4646a999d269efc758441802af49fd92.jpg"></img> */}
                        <p>TÌM TRẬN</p>
                    </div>
                </div>

                <div className={styles.tiltBoxWrap}
                    onMouseEnter={() => setBackground("https://i.pinimg.com/564x/c1/d7/dc/c1d7dc57bd474758938501aa1565ca4b.jpg")}
                    onMouseLeave={() => document.getElementById("gameModeBackgound").classList.remove(styles.backgroundBehind)}
                >
                    <span className={styles.tOver}></span>
                    <span className={styles.tOver}></span>
                    <span className={styles.tOver}></span>
                    <span className={styles.tOver}></span>
                    <span className={styles.tOver}></span>
                    <span className={styles.tOver}></span>
                    <span className={styles.tOver}></span>
                    <span className={styles.tOver}></span>
                    <span className={styles.tOver}></span>
                    <div className={styles.gameMode}
                        style={{ backgroundImage: "url(https://i.pinimg.com/564x/c1/d7/dc/c1d7dc57bd474758938501aa1565ca4b.jpg)" }}
                    >
                        {/* <img src="https://i.ibb.co/6stTB7s/c1d7dc57bd474758938501aa1565ca4b-removebg-preview.png"></img> */}
                        <p>ĐẤU VỚI MÁY</p>
                    </div>
                </div>

                <div className={styles.tiltBoxWrap}
                    onMouseEnter={() => setBackground("https://i.pinimg.com/564x/1e/09/65/1e0965ca34923ad10b948ee811a81138.jpg")}
                    onMouseLeave={() => document.getElementById("gameModeBackgound").classList.remove(styles.backgroundBehind)}
                    onClick={() => { createRoom() }}
                >
                    <span className={styles.tOver}></span>
                    <span className={styles.tOver}></span>
                    <span className={styles.tOver}></span>
                    <span className={styles.tOver}></span>
                    <span className={styles.tOver}></span>
                    <span className={styles.tOver}></span>
                    <span className={styles.tOver}></span>
                    <span className={styles.tOver}></span>
                    <span className={styles.tOver}></span>
                    <div className={styles.gameMode}
                        style={{ backgroundImage: "url(https://i.pinimg.com/564x/1e/09/65/1e0965ca34923ad10b948ee811a81138.jpg)" }}
                    >
                        {/* <img src="https://i.pinimg.com/564x/1e/09/65/1e0965ca34923ad10b948ee811a81138.jpg"></img> */}
                        <p>TẠO PHÒNG</p>
                    </div>
                </div>

                <div className={styles.tiltBoxWrap}
                    onMouseEnter={() => setBackground("https://i.pinimg.com/564x/c0/0e/e6/c00ee646b5c0af86ada7f0d45084490e.jpg")}
                    onMouseLeave={() => document.getElementById("gameModeBackgound").classList.remove(styles.backgroundBehind)}
                    onClick={() => { setSearchRoomMode(true) }}
                >
                    <span className={styles.tOver}></span>
                    <span className={styles.tOver}></span>
                    <span className={styles.tOver}></span>
                    <span className={styles.tOver}></span>
                    <span className={styles.tOver}></span>
                    <span className={styles.tOver}></span>
                    <span className={styles.tOver}></span>
                    <span className={styles.tOver}></span>
                    <span className={styles.tOver}></span>
                    <div className={styles.gameMode}
                        style={{ backgroundImage: "url(https://i.pinimg.com/564x/c0/0e/e6/c00ee646b5c0af86ada7f0d45084490e.jpg)" }}
                    >
                        {/* <img src="https://i.pinimg.com/564x/c0/0e/e6/c00ee646b5c0af86ada7f0d45084490e.jpg"></img> */}
                        <p>THAM GIA PHÒNG</p>
                    </div>
                </div>
            </div>
        )
    }, [accountInfo]);

    return (
        <>
            <Head>
                <title>Chess Army</title>
                <meta name="description" content="Generated by create next app" />
                <meta name="viewport" content="width=device-width, initial-scale=1" />
            </Head>
            <main className={styles.main}>
                {header}
                {searchRoom}
                <img id="modeBackgound" className={styles.gameBackground}></img>
                <img id="gameModeBackgound" className={styles.gameBackground} src="https://cdnb.artstation.com/p/assets/images/images/005/896/831/large/zy-hwang-1-79.jpg?1494522225"></img>
                {renderGameMode}
            </main>
        </>
    )
}
