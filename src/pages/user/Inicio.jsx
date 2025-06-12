// Inicio.jsx
import React, { useState, useEffect } from "react";
import { Container, Row, Col, Card } from "react-bootstrap";
import { AiOutlineLeft, AiOutlineRight, AiFillFileText } from "react-icons/ai";
import { BsQuestionCircle } from "react-icons/bs";
import { MdEdit } from "react-icons/md";
import { useNavigate } from "react-router-dom";
import supabase from "../../helper/supabaseconfig";
import "./Inicio.css";

const frasesMotivadoras = [
  "Cada exercício resolvido é um passo rumo ao teu sucesso!",
  "Estudar hoje é investir no teu futuro!",
  "Tu és capaz de conquistar qualquer desafio!",
  "Pequenos progressos todos os dias geram grandes resultados!",
  "O conhecimento é a chave da liberdade. Continua a aprender!",
];

const Inicio = () => {
  const navigate = useNavigate();
  const [anoSelecionado, setAnoSelecionado] = useState("1º ano");
  const [currentIndex1, setCurrentIndex1] = useState(0);
  const [currentIndex2, setCurrentIndex2] = useState(0);
  const [nomeCompleto, setNomeCompleto] = useState("Utilizador");
  const [disciplinasPorAno, setDisciplinasPorAno] = useState({});
  const [frase, setFrase] = useState("");

  useEffect(() => {
    const fetchDados = async () => {
      const { data: user, error: userError } = await supabase.auth.getUser();
      if (userError || !user?.user) return;

      const { data: userInfo, error: dbError } = await supabase
        .from("utilizadores")
        .select("nome, apelido, idcurso, tipo_conta")
        .eq("id", user.user.id)
        .single();

      if (dbError || !userInfo) return;

      setNomeCompleto(`${userInfo.nome} ${userInfo.apelido || ""}`);

      const agrupado = {};

      if (userInfo.tipo_conta === "aluno") {
        const { data: resultados } = await supabase
          .from("curso_disciplina")
          .select(`ano, semestre, disciplinas ( iddisciplina, nome, docente_disciplina ( utilizadores ( username ) ) )`)
          .eq("idcurso", userInfo.idcurso);

        resultados.forEach(({ ano, semestre, disciplinas }) => {
          const anoTexto = `${ano}º ano`;
          const semestreTexto = `semestre${semestre}`;
          if (!agrupado[anoTexto]) agrupado[anoTexto] = { semestre1: [], semestre2: [] };

          const docentes = disciplinas?.docente_disciplina?.map(d => d.utilizadores?.username).filter(Boolean);
          const docente = docentes?.length ? docentes.join(", ") : "A designar";

          agrupado[anoTexto][semestreTexto].push({
            titulo: disciplinas.nome,
            id: disciplinas.iddisciplina,
            docente,
          });
        });
      }

      setDisciplinasPorAno(agrupado);
      setAnoSelecionado(Object.keys(agrupado)[0] || "1º ano");
    };

    fetchDados();
  }, []);

  useEffect(() => {
    setCurrentIndex1(0);
    setCurrentIndex2(0);
    const randomIndex = Math.floor(Math.random() * frasesMotivadoras.length);
    setFrase(frasesMotivadoras[randomIndex]);
  }, []);

  const disciplinasSemestre1 = disciplinasPorAno[anoSelecionado]?.semestre1 || [];
  const disciplinasSemestre2 = disciplinasPorAno[anoSelecionado]?.semestre2 || [];

  const handlePrev = (setIndex, currentIndex, disciplinas) => {
    setIndex(currentIndex > 0 ? currentIndex - 1 : disciplinas.length - 3);
  };

  const handleNext = (setIndex, currentIndex, disciplinas) => {
    setIndex(currentIndex < disciplinas.length - 3 ? currentIndex + 1 : 0);
  };

  const renderDisciplinas = (disciplinas, currentIndex, setIndex) => (
    <Row className="align-items-center">
      <Col xs="auto" className="text-center">
        <AiOutlineLeft size={32} className="text-danger cursor-pointer" onClick={() => handlePrev(setIndex, currentIndex, disciplinas)} />
      </Col>
      <Col>
        <Row className="justify-content-center">
          {disciplinas.slice(currentIndex, currentIndex + 3).map((disciplina, index) => (
            <Col key={index} md={4} className="mb-3 fade-in">
              <Card className="shadow-sm border border-dark rounded-3 cursor-pointer" onClick={() => navigate(`/user/disciplina/${encodeURIComponent(disciplina.titulo)}`, { state: { iddisciplina: disciplina.id } })}>
                <Card.Body>
                  <Card.Title className="text-center fw-bold text-primary">{disciplina.titulo}</Card.Title>
                  <Card.Text className="text-center text-muted">Docente: {disciplina.docente}</Card.Text>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>
      </Col>
      <Col xs="auto" className="text-center">
        <AiOutlineRight size={32} className="text-danger cursor-pointer" onClick={() => handleNext(setIndex, currentIndex, disciplinas)} />
      </Col>
    </Row>
  );

  return (
    <div className="pagina-inicio">
      <Container fluid className="p-5">
        <h1 className="text-danger text-left mb-2 fw-bold">Olá, {nomeCompleto}! 👋</h1>
        <p className="lead text-muted mb-4">{frase}</p>

        <div className="text-center mb-4">
          {Object.keys(disciplinasPorAno).map((ano) => (
            <button
              key={ano}
              className={`btn btn-outline-primary mx-2 ${anoSelecionado === ano ? "active-btn" : ""}`}
              onClick={() => setAnoSelecionado(ano)}
              style={{
                backgroundColor: anoSelecionado === ano ? "#0056b3" : "white",
                color: anoSelecionado === ano ? "white" : "#0056b3",
                borderColor: "#0056b3",
                transition: "all 0.3s ease"
              }}
            >
              {ano}
            </button>
          ))}
        </div>

        <h2 className="text-left mb-4 text-primary">1º Semestre</h2>
        {renderDisciplinas(disciplinasSemestre1, currentIndex1, setCurrentIndex1)}

        <h2 className="text-left mt-5 mb-4 text-primary">2º Semestre</h2>
        {renderDisciplinas(disciplinasSemestre2, currentIndex2, setCurrentIndex2)}

        <h2 className="text-left mt-5 mb-4 fw-bold" style={{ color: "#0056b3" }}>Ações Rápidas</h2>
        <Row className="text-center">
          <Col md={4} className="mb-3">
            <Card className="card-acao cursor-pointer" style={{ background: "linear-gradient(135deg,#f0e2a5,#f0e2a5)" }} onClick={() => navigate("/user/questoes")}>  
              <Card.Body className="d-flex flex-column align-items-center justify-content-center">
                <BsQuestionCircle className="icone" />
                <span>Questões</span>
              </Card.Body>
            </Card>
          </Col>
          <Col md={4} className="mb-3">
            <Card className="card-acao cursor-pointer" style={{ background: "linear-gradient(135deg,#b6f3ee, #b6f3ee)" }} onClick={() => navigate("/user/modo-exame")}>  
              <Card.Body className="d-flex flex-column align-items-center justify-content-center">
                <MdEdit className="icone" />
                <span>Modo Exame</span>
              </Card.Body>
            </Card>
          </Col>
          <Col md={4} className="mb-3">
            <Card className="card-acao cursor-pointer" style={{ background: "linear-gradient(135deg,#95cab1, #95cab1)" }} onClick={() => navigate("/user/resumos")}>  
              <Card.Body className="d-flex flex-column align-items-center justify-content-center">
                <AiFillFileText className="icone" />
                <span>Resumos</span>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default Inicio;