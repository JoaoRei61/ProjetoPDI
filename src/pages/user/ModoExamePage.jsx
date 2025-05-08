import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import supabase from "../../helper/supabaseconfig";
import 'bootstrap/dist/css/bootstrap.css';

function ModoExamePage() {
  const [ano, setAno] = useState("1º ano");
  const [semestre, setSemestre] = useState("1º semestre");
  const [disciplinas, setDisciplinas] = useState([]);
  const [disciplina, setDisciplina] = useState("");
  const [materias, setMaterias] = useState([]);
  const [materiasSelecionadas, setMateriasSelecionadas] = useState([]);
  const [quantidadeExercicios, setQuantidadeExercicios] = useState(5);
  const navigate = useNavigate();

  const anoNum = parseInt(ano.replace("º ano", ""));
  const semestreNum = semestre === "1º semestre" ? 1 : 2;

  useEffect(() => {
    const fetchDisciplinas = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: aluno, error } = await supabase
        .from("utilizadores")
        .select("idcurso")
        .eq("id", user.id)
        .single();

      if (error || !aluno) return;

      const { data: resultados } = await supabase
        .from("curso_disciplina")
        .select("disciplinas ( nome, iddisciplina )")
        .eq("idcurso", aluno.idcurso)
        .eq("ano", anoNum)
        .eq("semestre", semestreNum);

      const lista = resultados?.map(r => r.disciplinas).filter(Boolean) || [];
      setDisciplinas(lista);
      setDisciplina(lista[0]?.iddisciplina || "");
    };

    fetchDisciplinas();
    setMateriasSelecionadas([]);
  }, [ano, semestre]);

  useEffect(() => {
    const fetchMaterias = async () => {
      if (!disciplina) return;

      const { data: materiasData } = await supabase
        .from("materia")
        .select("nome")
        .eq("iddisciplina", disciplina);

      setMaterias(materiasData?.map(m => m.nome) || []);
      setMateriasSelecionadas([]);
    };

    fetchMaterias();
  }, [disciplina]);

  const toggleMateria = (materia) => {
    setMateriasSelecionadas(prev =>
      prev.includes(materia) ? prev.filter(m => m !== materia) : [...prev, materia]
    );
  };

  const iniciarTeste = () => {
    navigate("/user/teste", {
      state: { ano, semestre, disciplina, materiasSelecionadas, quantidadeExercicios }
    });
  };

  return (
    <div className="container">
      <h1 className="text-center mt-4 display-5 fw-bold" style={{ color: '#0056b3' }}>
        <span className="text-danger">Modo Exame</span>
      </h1>
      <p className="text-center lead text-dark">Prepara-te para o exame final! Define os detalhes e começa a praticar.</p>

      <div className="mb-3">
        <label className="lead form-label">Ano</label>
        <select className="form-select" value={ano} onChange={(e) => setAno(e.target.value)}>
          <option value="1º ano">1º ano</option>
          <option value="2º ano">2º ano</option>
          <option value="3º ano">3º ano</option>
        </select>
      </div>

      <div className="mb-3">
        <label className="lead form-label">Semestre</label>
        <select className="form-select" value={semestre} onChange={(e) => setSemestre(e.target.value)}>
          <option value="1º semestre">1º semestre</option>
          <option value="2º semestre">2º semestre</option>
        </select>
      </div>

      <div className="mb-3">
        <label className="lead form-label">Disciplina</label>
        <select className="form-select" value={disciplina} onChange={(e) => setDisciplina(e.target.value)}>
          {disciplinas.map((disc, idx) => (
            <option key={idx} value={disc.iddisciplina}>{disc.nome}</option>
          ))}
        </select>
      </div>

      <h3 className="mt-3 text-start" style={{ color: '#0056b3' }}>Matérias</h3>
      <div className="mt-2 text-start">
        {materias.map((materia, idx) => (
          <div key={idx} className="form-check">
            <input
              type="checkbox"
              className="form-check-input"
              id={`${materia}-${idx}`}
              checked={materiasSelecionadas.includes(materia)}
              onChange={() => toggleMateria(materia)}
            />
            <label className="form-check-label lead" htmlFor={`${materia}-${idx}`}>
              {materia}
            </label>
          </div>
        ))}
      </div>

      <div className="mt-4">
        <label className="lead form-label">Quantidade de Exercícios</label>
        <input
          type="range"
          className="form-range"
          min="5" max="20" step="1"
          value={quantidadeExercicios}
          onChange={(e) => setQuantidadeExercicios(e.target.value)}
        />
        <p className="lead text-center">{quantidadeExercicios} exercícios</p>
      </div>

      <div className="text-center mt-3">
        <button
          className="btn btn-sm"
          style={{ backgroundColor: '#dc3545', color: '#fff', padding: '8px 20px' }}
          disabled={materiasSelecionadas.length === 0}
          onClick={iniciarTeste}
        >
          Iniciar Teste
        </button>
      </div>
    </div>
  );
}

export default ModoExamePage;
