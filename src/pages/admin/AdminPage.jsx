import React from "react";
import { Outlet } from "react-router-dom";
import SidebarAdmin from "../../components/SidebarAdmin";
import "../../components/Layout.css";

const AdminPage = () => {
    return (
        <div className="d-flex full-height">
  <SidebarAdmin />
  <div className="flex-grow-1  main-content">
    <Outlet />
  </div>
</div>

    );
};

export default AdminPage;
