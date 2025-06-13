import React, { useEffect, useState } from "react";
import supabase from "../../helper/supabaseconfig";
import { PieChart, Pie, Cell } from "recharts";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend,
} from "chart.js";
import { FaUserGraduate, FaBookOpen, FaChalkboard } from "react-icons/fa";

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalUtilizadores: 0,
    totalCursos: 0,
    totalUCs: 0,
    totalAlunos: 0,
    totalDocentes: 0,
    totalAdmins: 0,
  });

  const [resPorCurso, setResPorCurso] = useState([]);
  const [resPorDisciplina, setResPorDisciplina] = useState([]);
  const [cursos, setCursos] = useState([]);
  const [cursoSelecionado, setCursoSelecionado] = useState("");

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

      setCursos(cursos);
    };

    fetchStats();
  }, []);

  useEffect(() => {
    const fetchResolucoesCurso = async () => {
      const { data } = await supabase
        .from("resolucao")
        .select(`
          idmateria,
          materia (
            iddisciplina,
            disciplinas (
              curso_disciplina (
                idcurso,
                curso (
                  nome
                )
              )
            )
          )
        `);

      const contagem = {};

      data?.forEach((r) => {
        const cursoDisc = r?.materia?.disciplinas?.curso_disciplina;

        if (Array.isArray(cursoDisc)) {
          cursoDisc.forEach(({ curso }) => {
            if (curso?.nome) {
              contagem[curso.nome] = (contagem[curso.nome] || 0) + 1;
            }
          });
        } else if (cursoDisc?.curso?.nome) {
          const nomeCurso = cursoDisc.curso.nome;
          contagem[nomeCurso] = (contagem[nomeCurso] || 0) + 1;
        }
      });

      const resultado = Object.entries(contagem).map(([nome, total]) => ({ nome, total }));
      setResPorCurso(resultado);
    };

    fetchResolucoesCurso();
  }, []);

  useEffect(() => {
    if (!cursoSelecionado) return;

    const fetchDisciplinasDoCurso = async () => {
      const { data } = await supabase
        .from("resolucao")
        .select(`
          idmateria,
          materia (
            iddisciplina,
            disciplinas (
              nome,
              curso_disciplina (
                idcurso
              )
            )
          )
        `);

      const contagem = {};

      data?.forEach((r) => {
        const disciplina = r?.materia?.disciplinas;
        const cds = disciplina?.curso_disciplina;

        if (Array.isArray(cds)) {
          cds.forEach((cd) => {
            if (cd.idcurso === parseInt(cursoSelecionado)) {
              const nome = disciplina.nome;
              contagem[nome] = (contagem[nome] || 0) + 1;
            }
          });
        } else if (cds?.idcurso === parseInt(cursoSelecionado)) {
          const nome = disciplina.nome;
          contagem[nome] = (contagem[nome] || 0) + 1;
        }
      });

      const resultado = Object.entries(contagem).map(([nome, total]) => ({ nome, total }));
      setResPorDisciplina(resultado);
    };

    fetchDisciplinasDoCurso();
  }, [cursoSelecionado]);

  const pieData = [
    { name: "Alunos", value: stats.totalAlunos, color: "#007bff" },
    { name: "Docentes", value: stats.totalDocentes, color: "#28a745" },
    { name: "Admins", value: stats.totalAdmins, color: "#dc3545" }
  ];

  return (
    <div style={{ backgroundColor: "#0f172a", minHeight: "100vh", padding: "2rem", color: "white" }}>
      <h2 style={{ textAlign: "center", marginBottom: "2rem", fontSize: "2rem" }}>Painel de Administração</h2>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1.5rem", maxWidth: "1200px", margin: "0 auto" }}>
        {/* Cartão Utilizadores */}
        <div style={{ backgroundColor: "#1e293b", borderRadius: "12px", padding: "1.5rem", gridColumn: "span 2" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
              <FaUserGraduate style={{ fontSize: "2rem", color: "#007bff" }} />
              <div>
                <p style={{ fontSize: "0.9rem", color: "#ccc" }}>Utilizadores</p>
                <h3>{stats.totalUtilizadores}</h3>
              </div>
            </div>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "1rem" }}>
            <ul style={{ listStyle: "none", paddingLeft: 0, fontSize: "0.9rem" }}>
              <li>Alunos: {stats.totalAlunos}</li>
              <li>Docentes: {stats.totalDocentes}</li>
              <li>Admins: {stats.totalAdmins}</li>
            </ul>
            <PieChart width={100} height={100}>
              <Pie data={pieData} dataKey="value" outerRadius={40} innerRadius={25}>
                {pieData.map((entry, index) => (
                  <Cell key={index} fill={entry.color} />
                ))}
              </Pie>
            </PieChart>
          </div>
        </div>

        {/* Cartão Cursos */}
        <div style={{ backgroundColor: "#1e293b", borderRadius: "12px", padding: "1.5rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            <FaBookOpen style={{ fontSize: "2rem", color: "#28a745" }} />
            <div>
              <p style={{ fontSize: "0.9rem", color: "#ccc" }}>Cursos</p>
              <h3>{stats.totalCursos}</h3>
            </div>
          </div>
        </div>

        {/* Cartão UCs */}
        <div style={{ backgroundColor: "#1e293b", borderRadius: "12px", padding: "1.5rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            <FaChalkboard style={{ fontSize: "2rem", color: "#ffc107" }} />
            <div>
              <p style={{ fontSize: "0.9rem", color: "#ccc" }}>Unidades Curriculares</p>
              <h3>{stats.totalUCs}</h3>
            </div>
          </div>
        </div>
      </div>

      {/* Gráficos lado a lado */}
      <div className="mt-5">
        <h4 className="text-white mb-4">📊 Estatísticas de Resoluções</h4>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2rem" }}>
          {/* Gráfico de Cursos */}
          <div style={{ backgroundColor: "#1e293b", padding: "1.5rem", borderRadius: "12px" }}>
            <h5 className="text-white mb-3">Resoluções por Curso</h5>
            <Bar
              data={{
                labels: resPorCurso.map((c) => c.nome),
                datasets: [{
                  label: "Exercícios Resolvidos",
                  data: resPorCurso.map((c) => c.total),
                  backgroundColor: "#007bff"
                }]
              }}
              options={{
                responsive: true,
                plugins: { legend: { display: false } },
                scales: { y: { beginAtZero: true, ticks: { precision: 0 } } }
              }}
            />
          </div>

          {/* Gráfico de Disciplinas */}
          <div style={{ backgroundColor: "#1e293b", padding: "1.5rem", borderRadius: "12px" }}>
            <h5 className="text-white mb-3">Disciplinas por Curso</h5>
            <select
              className="form-select mb-3"
              value={cursoSelecionado}
              onChange={(e) => setCursoSelecionado(e.target.value)}
            >
              <option value="" disabled>Seleciona um curso</option>
              {cursos.map((c) => (
                <option key={c.idcurso} value={c.idcurso}>{c.nome}</option>
              ))}
            </select>

            {resPorDisciplina.length > 0 ? (
              <Bar
                data={{
                  labels: resPorDisciplina.map((d) => d.nome),
                  datasets: [{
                    label: "Resoluções",
                    data: resPorDisciplina.map((d) => d.total),
                    backgroundColor: "#ffc107"
                  }]
                }}
                options={{
                  responsive: true,
                  plugins: { legend: { display: false } },
                  scales: { y: { beginAtZero: true, ticks: { precision: 0 } } }
                }}
              />
            ) : (
              <p className="text-muted">Seleciona um curso com dados.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
