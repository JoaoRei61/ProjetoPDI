import React, { useEffect, useState } from "react";
import supabase from "../../helper/supabaseconfig";

const HistoricoExercicios = () => {
  const [exercicios, setExercicios] = useState([]);
  const [disciplinas, setDisciplinas] = useState([]);
  const [materias, setMaterias] = useState([]);

  const [disciplinaSelecionada, setDisciplinaSelecionada] = useState("");
  const [materiaSelecionada, setMateriaSelecionada] = useState("");
  const [tipoSelecionado, setTipoSelecionado] = useState("todos");

  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState(null);
  const [imagensVisiveis, setImagensVisiveis] = useState({});

  useEffect(() => {
    obterUserEFiltrar();
  }, []);

  useEffect(() => {
    if (disciplinaSelecionada) fetchMaterias(disciplinaSelecionada);
  }, [disciplinaSelecionada]);

  useEffect(() => {
    if (userId) fetchExercicios();
  }, [disciplinaSelecionada, materiaSelecionada, tipoSelecionado, userId]);

  const obterUserEFiltrar = async () => {
    const { data: userData } = await supabase.auth.getUser();
    const id = userData?.user?.id;
    setUserId(id);

    const { data: disciplinasDoDocente } = await supabase
      .from("docente_disciplina")
      .select("iddisciplina");

    const ids = disciplinasDoDocente.map(d => d.iddisciplina);

    const { data: disciplinasValidas } = await supabase
      .from("disciplinas")
      .select("iddisciplina, nome")
      .in("iddisciplina", ids);

    setDisciplinas(disciplinasValidas);
  };

  const fetchMaterias = async (iddisciplina) => {
    const { data } = await supabase
      .from("materia")
      .select("idmateria, nome")
      .eq("iddisciplina", iddisciplina);
    setMaterias(data || []);
  };

  const fetchExercicios = async () => {
    setLoading(true);

    let query = supabase
      .from("perguntas")
      .select(`
        *,
        materia (
          idmateria,
          nome,
          disciplinas (
            iddisciplina,
            nome
          )
        )
      `)
      .eq("idutilizador", userId)
      .order("data_criacao", { ascending: false });

    if (disciplinaSelecionada) {
      query = query.eq("materia.disciplinas.iddisciplina", disciplinaSelecionada);
    }

    if (materiaSelecionada) {
      query = query.eq("idmateria", materiaSelecionada);
    }

    if (tipoSelecionado !== "todos") {
      query = query.eq("tipo_pergunta", tipoSelecionado === "multipla" ? "EM" : "Desenvolvimento");
    }

    const { data, error } = await query;

    if (!error && data) {
      setExercicios(data);
    }

    setLoading(false);
  };

  const toggleImagens = (id) => {
    setImagensVisiveis((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const eliminarExercicio = async (id) => {
    const confirmacao = window.confirm("Tens a certeza que queres eliminar este exercício?");
    if (!confirmacao) return;

    const { error } = await supabase
      .from("perguntas")
      .delete()
      .eq("idpergunta", id);

    if (!error) {
      setExercicios((prev) => prev.filter((ex) => ex.idpergunta !== id));
    } else {
      alert("Erro ao eliminar exercício.");
    }
  };

  const renderCard = (ex) => (
    <div key={ex.idpergunta} className="card mb-3 shadow-sm">
      <div className="card-body">
        <div className="d-flex justify-content-between align-items-start">
          <div>
            <h5 className="card-title">{ex.materia?.disciplinas?.nome} - {ex.materia?.nome}</h5>
            <p><strong>Tipo:</strong> {ex.tipo_pergunta}</p>
            <p><strong>Data:</strong> {new Date(ex.data_criacao).toLocaleDateString()}</p>
          </div>
          <div>
            <button className="btn btn-outline-primary btn-sm me-2" onClick={() => toggleImagens(ex.idpergunta)}>
              {imagensVisiveis[ex.idpergunta] ? "Esconder Imagens" : "Ver Imagens"}
            </button>
            <button className="btn btn-outline-danger btn-sm" onClick={() => eliminarExercicio(ex.idpergunta)}>
              Eliminar
            </button>
          </div>
        </div>

        {ex.texto && <p><strong>Enunciado:</strong> {ex.texto}</p>}
        {imagensVisiveis[ex.idpergunta] && (
          <>
            {ex.enunciado && (
              <div className="mb-2">
                <strong>Imagem Enunciado:</strong><br />
                <img src={ex.enunciado} alt="Enunciado" className="img-fluid" />
              </div>
            )}
            {ex.resolucao && (
              <div className="mb-2">
                <strong>Imagem Resolução:</strong><br />
                <img src={ex.resolucao} alt="Resolução" className="img-fluid" />
              </div>
            )}
          </>
        )}
        {ex.explicacao && <p><strong>Explicação:</strong> {ex.explicacao}</p>}
        {ex.comentario && <p><strong>Comentário:</strong> {ex.comentario}</p>}
      </div>
    </div>
  );

  return (
    <div className="container my-4">
      <h3>Histórico de Exercícios</h3>

      <div className="row mb-4">
        <div className="col-md-4">
          <label>Disciplina</label>
          <select
            className="form-select"
            value={disciplinaSelecionada}
            onChange={(e) => {
              setDisciplinaSelecionada(e.target.value);
              setMateriaSelecionada("");
            }}
          >
            <option value="">Todas</option>
            {disciplinas.map((d) => (
              <option key={d.iddisciplina} value={d.iddisciplina}>
                {d.nome}
              </option>
            ))}
          </select>
        </div>

        <div className="col-md-4">
          <label>Matéria</label>
          <select
            className="form-select"
            value={materiaSelecionada}
            onChange={(e) => setMateriaSelecionada(e.target.value)}
            disabled={!disciplinaSelecionada}
          >
            <option value="">Todas</option>
            {materias.map((m) => (
              <option key={m.idmateria} value={m.idmateria}>
                {m.nome}
              </option>
            ))}
          </select>
        </div>

        <div className="col-md-4">
          <label>Tipo</label>
          <select
            className="form-select"
            value={tipoSelecionado}
            onChange={(e) => setTipoSelecionado(e.target.value)}
          >
            <option value="todos">Todos</option>
            <option value="multipla">Escolha Múltipla</option>
            <option value="desenvolvimento">Desenvolvimento</option>
          </select>
        </div>
      </div>

      {loading ? (
        <p>A carregar exercícios...</p>
      ) : exercicios.length === 0 ? (
        <p className="text-muted">Nenhum exercício encontrado com os filtros atuais.</p>
      ) : (
        exercicios.map(renderCard)
      )}
    </div>
  );
};

export default HistoricoExercicios;