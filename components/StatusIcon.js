import { React, ReactDOM, useEffect, useState, useMemo } from "react";
const StatusIcon = ({ type = "HP" }) => {
    switch (type) {
        case "ATK":
            return (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M 2 2 L 5 2 L 17 14 L 18 14 L 21 13 L 13 21 L 14 18 L 14 17 L 2 5 L 2 2 M 17 18 L 18 17 L 22 21 L 21 22 L 17 18 M 22 2 L 22 5 L 16 11 L 13 8 L 19 2 L 22 2 M 11 16 L 10 17 L 10 18 L 11 21 L 3 13 L 6 14 L 7 14 L 8 13 L 11 16 M 7 18 L 6 17 L 2 21 L 3 22 L 7 18z" />
                </svg>
            );

        case "DEF":
            return (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M 12 2 C 14 4 19 4 22 4 C 21 15 21 15 12 22 C 3 15 3 15 2 4 C 5 4 10 4 12 2 Z" />
                </svg>
            )

        default:
            return (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z" />
                </svg>
            )
    }
}

export default StatusIcon;