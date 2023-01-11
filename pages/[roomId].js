import { Inter } from "@next/font/google";
// import styles from "../styles/Home.module.css";
import styles from "../styles/Home.module.css";

import { ref, child, get } from "firebase/database";
import { database } from "./api/firebase";
import { React, ReactDOM } from "react";
import Router from "next/router"

const inter = Inter({ subsets: ["latin"] });

export default function Play() {
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
                <div></div>
            </main>
        </>
    );
}
