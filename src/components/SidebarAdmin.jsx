import React, { useState, useEffect } from "react";
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
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setCollapsed(window.innerWidth < 768);
    };
    window.addEventListener("resize", handleResize);
    handleResize();
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const adminMenu = [
    {
      label: "Dashboard",
      path: "/admin/dashboard",
      icon: <FaChalkboardTeacher />,
    },
    {
      label: "Adicionar Curso",
      path: "/admin/adicionar-curso",
      icon: <FaBook />,
    },
    {
      label: "Adicionar UC",
      path: "/admin/adicionar-unidade-curricular",
      icon: <FaUniversity />,
    },
    {
      label: "Adicionar Docente",
      path: "/admin/adicionar-docente",
      icon: <FaPlus />,
    },
  ];

  return (
    <div style={{ display: "flex", height: "100vh" }}>
      <Sidebar collapsed={collapsed} backgroundColor="#1e293b">
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
            {adminMenu.map(({ label, path, icon }) => (
              <MenuItem
                key={path}
                icon={icon}
                active={location.pathname === path}
                component={<Link to={path} />}
              >
                {label}
              </MenuItem>
            ))}

            <MenuItem icon={<FaArrowLeft />} onClick={() => navigate("/user")}>
              Ir para Utilizador
            </MenuItem>
          </Menu>
        </div>
      </Sidebar>
    </div>
  );
};

export default SidebarAdmin;
