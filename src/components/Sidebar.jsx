import React, { useEffect, useState } from "react";
import { Sidebar, Menu, MenuItem } from "react-pro-sidebar";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  FaHome,
  FaQuestionCircle,
  FaPenFancy,
  FaFileAlt,
  FaSignOutAlt,
  FaPlusCircle,
  FaTrophy,
  FaUserCircle,
  FaHistory,
  FaTools
} from "react-icons/fa";
import supabase from "../helper/supabaseconfig";

const SidebarUser = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [resumosPendentes, setResumosPendentes] = useState(0);
  const [tipoConta, setTipoConta] = useState("");

  const logout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    navigate("/login");
  };

  useEffect(() => {
    const handleResize = () => {
      setCollapsed(window.innerWidth < 768);
    };
    window.addEventListener("resize", handleResize);
    handleResize();
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const fetchUserInfo = async () => {
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData?.user?.id;

      const { data: tipoData } = await supabase
        .from("utilizadores")
        .select("tipo_conta")
        .eq("id", userId)
        .single();

      const tipo = tipoData?.tipo_conta;
      setTipoConta(tipo);

      if (tipo === "admin" || tipo === "docente") {
        let idsDisciplinas = [];

        if (tipo === "docente") {
          const { data: disciplinasDoDocente } = await supabase
            .from("docente_disciplina")
            .select("iddisciplina")
            .eq("iddocente", userId);

          idsDisciplinas = disciplinasDoDocente?.map((d) => d.iddisciplina) || [];
        }

        const { data: resumos } = await supabase
          .from("resumos")
          .select("idresumo, iddisciplina, estado")
          .eq("estado", "pendente");

        const pendentesVisiveis =
          tipo === "admin"
            ? resumos
            : resumos.filter((r) => idsDisciplinas.includes(r.iddisciplina));

        setResumosPendentes(pendentesVisiveis.length);
      }
    };

    fetchUserInfo();
  }, []);

  const commonDocenteAdminMenu = [
    {
      label: "Adicionar Exercícios",
      icon: <FaPlusCircle />,
      path: "/user/adicionar-exercicios",
    },
    {
      label: "Histórico de Exercícios",
      icon: <FaHistory />,
      path: "/user/historico-exercicios",
    },
    {
      label: "Validar Resumos",
      icon: <FaFileAlt />,
      path: "/user/validar-resumos",
      badge: resumosPendentes,
    },
    {
      label: "Resumos",
      icon: <FaFileAlt />,
      path: "/user/resumos",
    },
    {
      label: "Leaderboard",
      icon: <FaTrophy />,
      path: "/user/leaderboard",
    },
  ];

  const alunoMenu = [
    {
      label: "Início",
      icon: <FaHome />,
      path: "/user/",
    },
    {
      label: "Questões",
      icon: <FaQuestionCircle />,
      path: "/user/questoes",
    },
    {
      label: "Modo Exame",
      icon: <FaPenFancy />,
      path: "/user/modo-exame",
    },
    {
      label: "Resumos",
      icon: <FaFileAlt />,
      path: "/user/resumos",
    },
    {
      label: "Leaderboard",
      icon: <FaTrophy />,
      path: "/user/leaderboard",
    },
  ];

  const renderMenuItems = (items) =>
    items.map(({ label, icon, path, badge }) => (
      <MenuItem
        key={path}
        icon={icon}
        active={location.pathname === path}
        component={<Link to={path} />}
      >
        {!collapsed ? (
          <div className="d-flex justify-content-between align-items-center">
            <span>{label}</span>
            {badge > 0 && (
              <span className="badge bg-danger ms-2">{badge}</span>
            )}
          </div>
        ) : (
          badge > 0 && <span className="badge bg-danger">{badge}</span>
        )}
      </MenuItem>
    ));

  return (
    <div style={{ display: "flex", height: "100vh" }}>
      <Sidebar collapsed={collapsed} backgroundColor="#2d6baa">
        <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
          {!collapsed && (
            <div className="d-flex justify-content-center p-3">
              <img
                src="/imagens/logobranco.png"
                alt="Logo"
                style={{
                  width: "80px",
                  height: "80px",
                  borderRadius: "50%",
                  border: "2px solid white",
                  objectFit: "cover",
                }}
              />
            </div>
          )}

          <Menu
            iconShape="circle"
            menuItemStyles={{
              button: ({ active }) => ({
                backgroundColor: active ? "#1f4d7a" : "transparent",
                fontWeight: active ? "bold" : "normal",
                color: "white",
                "&:hover": {
                  backgroundColor: "#1f4d7a",
                },
              }),
            }}
          >
            {(tipoConta === "docente" || tipoConta === "admin") &&
              renderMenuItems(commonDocenteAdminMenu)}

            {tipoConta === "aluno" && renderMenuItems(alunoMenu)}
          </Menu>

          <div style={{ marginTop: "auto" }}>
            <Menu
              iconShape="circle"
              menuItemStyles={{
                button: {
                  color: "white",
                  "&:hover": {
                    backgroundColor: "#1f4d7a",
                  },
                },
              }}
            >
              <MenuItem
                icon={<FaUserCircle />}
                active={location.pathname === "/user/perfil"}
                component={<Link to="/user/perfil" />}
              >
                Perfil
              </MenuItem>

              {tipoConta === "admin" && (
                <MenuItem icon={<FaTools />} onClick={() => navigate("/admin/dashboard")}>
                  Administração
                </MenuItem>
              )}

              <MenuItem icon={<FaSignOutAlt />} onClick={logout}>
                Sair
              </MenuItem>
            </Menu>
          </div>
        </div>
      </Sidebar>
    </div>
  );
};

export default SidebarUser;
