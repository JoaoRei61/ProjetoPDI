import React from "react";
import { Outlet } from "react-router-dom";
import SidebarAdmin from "../../components/SidebarAdmin";

const AdminPage = () => {
    return (
        <div className="d-flex">
            <SidebarAdmin />
            <div className="flex-grow-1 p-3">
                <Outlet /> 
            </div>
        </div>
    );
};

export default AdminPage;
