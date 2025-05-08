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
  FaUserCircle
} from "react-icons/fa";
import supabase from '../helper/supabaseconfig';

const SidebarUser = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [resumosPendentes, setResumosPendentes] = useState(0);
  const [tipoConta, setTipoConta] = useState("");

  const logout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    navigate("/login");
  };

  useEffect(() => {
    const fetchUserInfo = async () => {
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData?.user?.id;

      // Buscar tipo de conta
      const { data: tipoData } = await supabase
        .from("utilizadores")
        .select("tipo_conta")
        .eq("id", userId)
        .single();

      const tipo = tipoData?.tipo_conta;
      setTipoConta(tipo);

      // Se for admin ou docente, buscar resumos pendentes
      if (tipo === "admin" || tipo === "docente") {
        let idsDisciplinas = [];

        if (tipo === "docente") {
          const { data: disciplinasDoDocente } = await supabase
            .from("docente_disciplina")
            .select("iddisciplina")
            .eq("iddocente", userId);

          idsDisciplinas = disciplinasDoDocente?.map(d => d.iddisciplina) || [];
        }

        const { data: resumos } = await supabase
          .from("resumos")
          .select("idresumo, iddisciplina, estado")
          .eq("estado", "pendente");

        const pendentesVisiveis = tipo === "admin"
          ? resumos
          : resumos.filter(r => idsDisciplinas.includes(r.iddisciplina));

        setResumosPendentes(pendentesVisiveis.length);
      }
    };

    fetchUserInfo();
  }, []);

  return (
    <div style={{ display: "flex", height: "100vh" }}>
      <Sidebar backgroundColor="#2d6baa">
        <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
          <div>
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
              

              {/* Mostrar apenas para docentes/admins */}
              {(tipoConta === "admin" || tipoConta === "docente") && (
                <>
                  
                  <MenuItem
                    icon={<FaPlusCircle />}
                    active={location.pathname === "/user/adicionar-exercicios"}
                    component={<Link to="/user/adicionar-exercicios" />}
                  >
                    Adicionar Exercícios
                  </MenuItem>
                  <MenuItem
                    icon={<FaPlusCircle />}
                    active={location.pathname === "/user/historico-exercicios"}
                    component={<Link to="/user/historico-exercicios" />}
                  >
                    Histórico de Exercícios
                  </MenuItem>
                  <MenuItem
                    icon={<FaFileAlt />}
                    active={location.pathname === "/user/validar-resumos"}
                    component={<Link to="/user/validar-resumos" />}
                  >
                    <div className="d-flex align-items-center justify-content-between w-100">
                      <span>Validar Resumos</span>
                      {resumosPendentes > 0 && (
                        <span className="badge bg-danger ms-2">{resumosPendentes}</span>
                      )}
                    </div>
                  </MenuItem>
                  <hr className="bg-light mx-3" />
                </>
              )}
              <MenuItem
                icon={<FaHome />}
                active={location.pathname === "/user/"}
                component={<Link to="/user" />}
              >
                Início
              </MenuItem>

              <MenuItem
                icon={<FaQuestionCircle />}
                active={location.pathname === "/user/questoes"}
                component={<Link to="/user/questoes" />}
              >
                Questões
              </MenuItem>
              <MenuItem
                icon={<FaPenFancy />}
                active={location.pathname === "/user/modo-exame"}
                component={<Link to="/user/modo-exame" />}
              >
                Modo Exame
              </MenuItem>
              <MenuItem
                icon={<FaFileAlt />}
                active={location.pathname === "/user/resumos"}
                component={<Link to="/user/resumos" />}
              >
                Resumos
              </MenuItem>
              <MenuItem
                icon={<FaTrophy />}
                active={location.pathname === "/user/leaderboard"}
                component={<Link to="/user/leaderboard" />}
              >
                Leaderboard
              </MenuItem>
            </Menu>
          </div>

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
                <MenuItem onClick={() => navigate("/admin/dashboard")}>
                  Ir para Administração
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