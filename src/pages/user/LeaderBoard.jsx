import React, { useEffect, useState } from "react";
import { Table, Spinner } from "react-bootstrap";
import supabase from "../../helper/supabaseconfig";
import "./LeaderBoard.css";

const medalColors = ["#FFD700", "#C0C0C0", "#CD7F32"];
const medalLabels = ["🥇", "🥈", "🥉"];

const Leaderboard = () => {
  const [ranking, setRanking] = useState([]);
  const [userId, setUserId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");

  useEffect(() => {
    fetchRanking();
  }, []);

  const fetchRanking = async () => {
    setErro("");
    setLoading(true);

    const { data: session } = await supabase.auth.getUser();
    const currentUserId = session?.user?.id;
    setUserId(currentUserId);

    const { data, error } = await supabase
      .from("rank")
      .select("idutilizador, pontos, utilizadores!inner(nome, apelido, foto)")
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
      <h3 className="mb-4 fw-bold text-center">🏆 Leaderboard Global</h3>

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
          <h5 className="text-center mb-4">🎖️ Top 3</h5>
          <div className="leaderboard-podium d-flex justify-content-center align-items-end gap-3">
            {top3.map((aluno, idx) => (
              <div key={aluno.idutilizador} className={`podium-slot slot-${idx + 1} text-center`}>
                <div className="medal" style={{ backgroundColor: medalColors[idx] }}>
                  {medalLabels[idx]}
                </div>
                <div className="profile-img my-2">
                  <img
                    src={aluno.utilizadores?.foto || "/imagens/logobranco.png"}
                    alt="foto perfil"
                    className="rounded-circle"
                    width={80}
                    height={80}
                    style={{ objectFit: "cover" }}
                  />
                </div>
                <strong>{aluno.utilizadores?.nome} {aluno.utilizadores?.apelido}</strong>
                <p className="text-muted mb-0">{Math.round(aluno.pontos)} pts</p>
              </div>
            ))}
          </div>

          <h5 className="mt-5 mb-3">📋 Classificação Geral</h5>
          <Table hover responsive className="text-center align-middle">
            <thead className="table-light">
              <tr>
                <th>Rank</th>
                <th>Nome</th>
                <th>Pontos</th>
              </tr>
            </thead>
            <tbody>
              {ranking.map((aluno, i) => (
                <tr key={i} className={aluno.idutilizador === userId ? "table-primary fw-bold" : ""}>
                  <td>
                    <span
                      style={{
                        backgroundColor: i < 3 ? medalColors[i] : "#0d6efd",
                        color: "#fff",
                        padding: "0.35em 0.75em",
                        borderRadius: "12px",
                        fontWeight: "bold",
                        display: "inline-block",
                        minWidth: "28px"
                      }}
                    >
                      {i + 1}
                    </span>
                  </td>
                  <td>{aluno.utilizadores?.nome} {aluno.utilizadores?.apelido}</td>
                  <td>{Math.round(aluno.pontos)} pts</td>
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
