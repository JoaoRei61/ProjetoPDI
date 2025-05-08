import React, { useEffect, useState } from "react";
import { Table, Badge, Spinner } from "react-bootstrap";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Cell,
  LabelList
} from "recharts";
import supabase from "../../helper/supabaseconfig"; // ajusta o path se necessário

const medalColors = ["#FFD700", "#C0C0C0", "#CD7F32"];

const Leaderboard = () => {
  const [ranking, setRanking] = useState([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");

  useEffect(() => {
    fetchRanking();
  }, []);

  const fetchRanking = async () => {
    setErro("");
    setLoading(true);

    const { data, error } = await supabase
      .from("rank")
      .select("idutilizador, pontos, utilizadores!inner(nome, apelido)")
      .order("pontos", { ascending: false });

    if (error) {
      console.error("Erro ao buscar ranking:", error);
      setErro("Erro ao carregar ranking.");
    } else {
      setRanking(data);
    }

    setLoading(false);
  };

  const top3 = ranking.slice(0, 3);

  return (
    <div className="container my-4">
      <h3 className="mb-4 fw-bold">🏆 Leaderboard Global</h3>

      {loading ? (
        <div className="text-center mt-5">
          <Spinner animation="border" variant="primary" />
        </div>
      ) : erro ? (
        <div className="alert alert-danger">{erro}</div>
      ) : ranking.length === 0 ? (
        <div className="alert alert-info">Ainda não há dados no ranking.</div>
      ) : (
        <>
          {/* Pódio */}
          <h5 className="text-center mb-4">🥇🥈🥉 Top 3</h5>
          <div style={{ width: '100%', height: 300 }}>
            <ResponsiveContainer>
              <BarChart
                data={top3}
                margin={{ top: 40, right: 30, left: 30, bottom: 10 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey={(d) =>
                    `${d.utilizadores?.nome ?? ""} ${d.utilizadores?.apelido ?? ""}`
                  }
                />
                <YAxis hide />
                <Tooltip />
                <Bar dataKey="pontos" radius={[10, 10, 0, 0]}>
                  {top3.map((_, index) => (
                    <Cell key={index} fill={medalColors[index] || "#2d6baa"} />
                  ))}
                  <LabelList
                    dataKey="pontos"
                    position="top"
                    formatter={(value) => `${value} pts`}
                  />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Tabela */}
          <h5 className="mt-5 mb-3">📋 Classificação Geral</h5>
          <Table hover responsive>
            <thead className="table-light">
              <tr>
                <th>#</th>
                <th>Nome</th>
                <th>Pontuação</th>
              </tr>
            </thead>
            <tbody>
              {ranking.map((aluno, i) => (
                <tr key={i}>
                  <td>
                    <Badge bg={i < 3 ? "warning" : "secondary"}>{i + 1}</Badge>
                  </td>
                  <td>
                    {aluno.utilizadores?.nome} {aluno.utilizadores?.apelido}
                  </td>
                  <td>{aluno.pontos} pts</td>
                </tr>
              ))}
            </tbody>
          </Table>
        </>
      )}
    </div>
  );
};

export default Leaderboard;
