import React from "react";
import { Sidebar, Menu, MenuItem } from "react-pro-sidebar";
import { useLocation, useNavigate, Link } from "react-router-dom";
import {
  FaChalkboardTeacher,
  FaBook,
  FaUniversity,
  FaPlus,
  FaArrowLeft
} from "react-icons/fa";

const SidebarAdmin = () => {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <div style={{ display: "flex", height: "100vh" }}>
      <Sidebar backgroundColor="#1e293b">
        <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
          <Menu
            iconShape="circle"
            menuItemStyles={{
              button: ({ active }) => ({
                backgroundColor: active ? "#334155" : "transparent",
                fontWeight: active ? "bold" : "normal",
                color: "white",
                "&:hover": {
                  backgroundColor: "#334155",
                },
              }),
            }}
          >
            <MenuItem
              icon={<FaChalkboardTeacher />}
              active={location.pathname === "/admin/dashboard"}
              component={<Link to="/admin/dashboard" />}
            >
              Dashboard
            </MenuItem>
            <MenuItem
              icon={<FaBook />}
              active={location.pathname === "/admin/adicionar-curso"}
              component={<Link to="/admin/adicionar-curso" />}
            >
              Adicionar Curso
            </MenuItem>
            <MenuItem
              icon={<FaUniversity />}
              active={location.pathname === "/admin/adicionar-unidade-curricular"}
              component={<Link to="/admin/adicionar-unidade-curricular" />}
            >
              Adicionar UC
            </MenuItem>
            <MenuItem
              icon={<FaPlus />}
              active={location.pathname === "/admin/adicionar-docente"}
              component={<Link to="/admin/adicionar-docente" />}
            >
              Adicionar Docente
            </MenuItem>
            <MenuItem
              icon={<FaArrowLeft />}
              onClick={() => navigate("/user")}
            >
              Ir para Utilizador
            </MenuItem>
          </Menu>
        </div>
      </Sidebar>
    </div>
  );
};

export default SidebarAdmin;
