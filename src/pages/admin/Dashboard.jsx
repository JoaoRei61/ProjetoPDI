import React, { useEffect, useState } from "react";
import supabase from "../../helper/supabaseconfig";
import { PieChart, Pie, Cell } from "recharts";
import { FaUserGraduate, FaBookOpen, FaChalkboard } from "react-icons/fa";
import "./Dashboard.css"; // Cria este ficheiro CSS

const Dashboard = () => {
    const [stats, setStats] = useState({
        totalUtilizadores: 0,
        totalCursos: 0,
        totalUCs: 0,
        totalAlunos: 0,
        totalDocentes: 0,
        totalAdmins: 0,
    });

    useEffect(() => {
        const fetchStats = async () => {
            const [{ data: utilizadores }, { data: cursos }, { data: ucs }] = await Promise.all([
                supabase.from("utilizadores").select(),
                supabase.from("curso").select(),
                supabase.from("disciplinas").select()
            ]);

            const totalAlunos = utilizadores.filter(u => u.tipo_conta === "aluno").length;
            const totalDocentes = utilizadores.filter(u => u.tipo_conta === "docente").length;
            const totalAdmins = utilizadores.filter(u => u.tipo_conta === "admin").length;

            setStats({
                totalUtilizadores: utilizadores.length,
                totalCursos: cursos.length,
                totalUCs: ucs.length,
                totalAlunos,
                totalDocentes,
                totalAdmins
            });
        };

        fetchStats();
    }, []);

    const pieData = [
        { name: "Alunos", value: stats.totalAlunos, color: "#007bff" },
        { name: "Docentes", value: stats.totalDocentes, color: "#28a745" },
        { name: "Admins", value: stats.totalAdmins, color: "#dc3545" }
    ];

    return (
        <div className="dashboard">
            <h2 className="dashboard-title">Painel de Administração</h2>
            <div className="dashboard-grid">
                {/* Utilizadores */}
                <div className="dashboard-card wide">
                    <div className="card-header">
                        <div className="icon-title">
                            <FaUserGraduate className="card-icon blue" />
                            <div>
                                <p className="card-label">Utilizadores</p>
                                <h3>{stats.totalUtilizadores}</h3>
                            </div>
                        </div>
                        <span className="badge">+12%</span>
                    </div>
                    <div className="card-content">
                        <ul className="user-breakdown">
                            <li>Alunos: {stats.totalAlunos}</li>
                            <li>Docentes: {stats.totalDocentes}</li>
                            <li>Admins: {stats.totalAdmins}</li>
                        </ul>
                        <PieChart width={100} height={100}>
                            <Pie
                                data={pieData}
                                dataKey="value"
                                outerRadius={40}
                                innerRadius={25}
                            >
                                {pieData.map((entry, index) => (
                                    <Cell key={index} fill={entry.color} />
                                ))}
                            </Pie>
                        </PieChart>
                    </div>
                </div>

                {/* Cursos */}
                <div className="dashboard-card">
                    <div className="card-header">
                        <div className="icon-title">
                            <FaBookOpen className="card-icon green" />
                            <div>
                                <p className="card-label">Cursos</p>
                                <h3>{stats.totalCursos}</h3>
                            </div>
                        </div>
                    </div>
                </div>

                {/* UCs */}
                <div className="dashboard-card">
                    <div className="card-header">
                        <div className="icon-title">
                            <FaChalkboard className="card-icon yellow" />
                            <div>
                                <p className="card-label">Unidades Curriculares</p>
                                <h3>{stats.totalUCs}</h3>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
