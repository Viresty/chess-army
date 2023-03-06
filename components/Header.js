import { React, ReactDOM, useEffect, useState, useMemo } from "react";
import styles from "../styles/Home.module.scss"
import Link from 'next/link'

const Header = ({ data = {}, logedIn = false }) => {
    return (
        <>
            <div className={styles.header}>
                <div className={styles.headerLeft}>
                    <img className={styles.headerLogo}></img>
                </div>
                <div className={styles.playButton}>
                    <Link href="/play">
                        <p>CHƠI</p>
                    </Link>
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