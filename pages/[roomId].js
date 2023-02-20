import { Inter } from "@next/font/google";
// import styles from "../styles/Home.module.scss";
import styles from "../styles/Play.module.scss";

import { ref, child, get } from "firebase/database";
import { database } from "./api/firebase";
import { React, ReactDOM, useEffect, useState, useMemo } from "react";
import Router from "next/router";
// Component
import Card from "../components/Card";

// Data
import datajson from "../public/test.json"

const inter = Inter({ subsets: ["latin"] });

export default function Play() {
    const [count, setCount] = useState(0);

    const dbRef = ref(database);
    get(child(dbRef, `user`))
        .then((snapshot) => {
            if (snapshot.exists()) {
                console.log(snapshot.val());
                console.log(Router.query);
            } else {
                console.log("No data available");
            }
        })
        .catch((error) => {
            console.error(error);
        });

    return (
        <>
            <main className={styles.main}>
                <Card />
                <img className={styles.gameBackground} src="https://i.ibb.co/n30yjHG/grassland-bg.jpg" alt="grassland-bg" border="0"></img>
                    <div className={styles.playArea}>
                        {
                            [...Array(100).keys()].map((i) => {
                                return (
                                    <div key={i} className={(i % 2 + Math.floor(i / 10) % 2) === 1 ? styles.blackBG : styles.whiteBG}>
                                        <img src="https://i.ibb.co/VwKTjfW/grassland.png" alt="grassland" border="0"></img>
                                        <img className={styles.selectingCell} src="https://i.ibb.co/F5Sn7pG/choice.png" alt="choice" border="0"></img>
                                    </div>
                                )
                            })
                        }
                    </div>
            </main>
        </>
    );
}
