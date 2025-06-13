import React, { useEffect, useState } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { Container, Card, Row, Col, Badge, Modal, Button } from "react-bootstrap";
import supabase from "../../helper/supabaseconfig";
import LoadingScreen from "../../components/LoadingScreen";

const DisciplinaPage = () => {
  const { nome } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const iddisciplina = location.state?.iddisciplina;

  const [materias, setMaterias] = useState([]);
  const [resumos, setResumos] = useState([]);
  const [docentes, setDocentes] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [mostrarModal, setMostrarModal] = useState(false);
  const [materiaSelecionada, setMateriaSelecionada] = useState(null);
  const [showPdfModal, setShowPdfModal] = useState(false);
  const [pdfResumoSelecionado, setPdfResumoSelecionado] = useState(null);

  useEffect(() => {
    const fetchDados = async () => {
      if (!iddisciplina) return;

      const { data: listaMaterias } = await supabase
        .from("materia")
        .select("idmateria, nome")
        .eq("iddisciplina", iddisciplina);

      const perguntasPorMateria = {};
      for (let mat of listaMaterias) {
        const { count } = await supabase
          .from("perguntas")
          .select("*", { count: "exact", head: true })
          .eq("idmateria", mat.idmateria);
        perguntasPorMateria[mat.idmateria] = count || 0;
      }

      const materiasComContagem = listaMaterias.map(mat => ({
        ...mat,
        totalPerguntas: perguntasPorMateria[mat.idmateria] || 0
      }));

      const { data: listaResumos } = await supabase
        .from("resumos")
        .select("*, utilizadores(username, tipo_conta)")
        .eq("iddisciplina", iddisciplina)
        .eq("estado", "aprovado");

      const { data: listaDocentes } = await supabase
        .from("docente_disciplina")
        .select("utilizadores(username)")
        .eq("iddisciplina", iddisciplina);

      const nomesDocentes = listaDocentes?.map(d => {
        const nomeCompleto = d.utilizadores?.username || "";
        const partes = nomeCompleto.trim().split(" ");
        if (partes.length === 1) return partes[0];
        return `${partes[0]} ${partes[partes.length - 1]}`;
      }).filter(Boolean);

      setMaterias(materiasComContagem);
      setResumos(listaResumos || []);
      setDocentes(nomesDocentes || []);
      setCarregando(false);
    };

    fetchDados();
  }, [iddisciplina]);

  const abrirModal = (materia) => {
    setMateriaSelecionada(materia);
    setMostrarModal(true);
  };

  const iniciarResolucao = (tipo) => {
    setMostrarModal(false);
    if (!materiaSelecionada) return;

    navigate("/user/questoes-resolver", {
      state: {
        iddisciplina,
        idmateria: materiaSelecionada.idmateria,
        nomeMateria: materiaSelecionada.nome,
        tipo,
      },
    });
  };

  const abrirResumoPdf = (resumo) => {
    setPdfResumoSelecionado(resumo);
    setShowPdfModal(true);
  };

  const renderBadge = (tipo) => (
    <span className={`badge ${tipo === "aluno" ? "bg-primary" : "bg-danger"}`}>
      {tipo.charAt(0).toUpperCase() + tipo.slice(1)}
    </span>
  );

  if (carregando) return <LoadingScreen />;

  return (
    <Container className="py-4">
      <h2 className="text-primary fw-bold mb-3">{decodeURIComponent(nome)}</h2>

      {docentes.length > 0 && (
        <p className="text-muted mb-4">
          Docente{docentes.length > 1 ? "s" : ""}: <strong>{docentes.join(", ")}</strong>
        </p>
      )}

      <h4 className="text-secondary mt-4 mb-3">Matérias e Exercícios</h4>
      <Row>
        {materias.map((mat, idx) => (
          <Col key={idx} md={4} className="mb-3">
            <Card
              className="shadow-sm"
              style={{ cursor: "pointer" }}
              onClick={() => abrirModal(mat)}
            >
              <Card.Body>
                <Card.Title className="text-primary">{mat.nome}</Card.Title>
                <p className="mb-1">Perguntas disponíveis: <Badge bg="info">{mat.totalPerguntas}</Badge></p>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>

      <h4 className="text-secondary mt-5 mb-3">Resumos Disponíveis</h4>
      {resumos.length === 0 ? (
        <p className="text-muted">Nenhum resumo disponível.</p>
      ) : (
        <Row>
          {resumos.map((resumo, idx) => (
            <Col key={idx} md={4} className="mb-4">
              <Card className="h-100 shadow-sm" onClick={() => abrirResumoPdf(resumo)} style={{ cursor: "pointer" }}>
                <Card.Body>
                  <h6 className="card-title fw-bold">{resumo.titulo}</h6>
                  <p className="mb-1">
                    <i className="bi bi-journal-text me-1"></i>
                    Resumo PDF
                  </p>
                  <p className="mb-0 d-flex align-items-center">
                    <i className="bi bi-person-circle me-1"></i>
                    <span className="me-2">{resumo.utilizadores?.username || "Anónimo"}</span>
                    {resumo.utilizadores?.tipo_conta && renderBadge(resumo.utilizadores.tipo_conta)}
                  </p>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>
      )}

      <Modal show={mostrarModal} onHide={() => setMostrarModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title className="fw-bold text-primary">Escolher tipo de questões</Modal.Title>
        </Modal.Header>
        <Modal.Body className="text-center">
          <p className="lead mb-4">
            Que tipo de perguntas queres resolver em <strong>{materiaSelecionada?.nome}</strong>?
          </p>

          <Card className="shadow-sm border-0">
            <Card.Body className="d-flex flex-column gap-2">
              <Button
                variant="outline-primary"
                className="w-100 text-start px-3 py-2 fw-semibold d-flex align-items-center gap-2"
                onClick={() => iniciarResolucao("todas")}
              >
                📘 Todas
              </Button>
              <Button
                variant="outline-danger"
                className="w-100 text-start px-3 py-2 fw-semibold d-flex align-items-center gap-2"
                onClick={() => iniciarResolucao("erradas")}
              >
                ❌ Erradas
              </Button>
              <Button
                variant="outline-warning"
                className="w-100 text-start px-3 py-2 fw-semibold d-flex align-items-center gap-2"
                onClick={() => iniciarResolucao("nao_resolvidas")}
              >
                ❓ Não Resolvidas
              </Button>
            </Card.Body>
          </Card>
        </Modal.Body>
      </Modal>

      {showPdfModal && pdfResumoSelecionado && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="modal-dialog modal-xl">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">{pdfResumoSelecionado.titulo}</h5>
                <button type="button" className="btn-close" onClick={() => setShowPdfModal(false)}></button>
              </div>
              <div className="modal-body" style={{ height: "80vh" }}>
                <iframe src={pdfResumoSelecionado.ficheiro} title="Visualizador PDF" width="100%" height="100%" style={{ border: "none" }} />
              </div>
            </div>
          </div>
        </div>
      )}
    </Container>
  );
};

export default DisciplinaPage;
