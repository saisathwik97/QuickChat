import React from "react";
import Login from "../component/Authentication/Login";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
const Home = () => {
    const Navigate=useNavigate();
    useEffect(()=>{
        const user=JSON.parse(localStorage.getItem("userInfo"));
        if(user){
            Navigate("/chat", { replace: true });
        }
    },[Navigate]);
    return (
        <>
            <Login />,

        </>
    );
}

export default Home;
