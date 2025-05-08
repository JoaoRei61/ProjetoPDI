import React from "react";
import { Outlet } from "react-router-dom";
import SidebarUser from "../../components/Sidebar";
import './UserPage.css';


const UserPage = () => {
    return (
        <div className="d-flex">
            <SidebarUser />
            <div className="flex-grow-1 p-3 main-content">
                <Outlet /> {/* Aqui serão carregadas as subpáginas automaticamente */}
            </div>
        </div>
    );
};

export default UserPage;
