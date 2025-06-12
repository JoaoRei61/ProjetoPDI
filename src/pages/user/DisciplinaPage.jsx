import React, { useEffect, useState } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { Container, Card, Row, Col, Spinner, Badge, Modal, Button } from "react-bootstrap";
import supabase from "../../helper/supabaseconfig";

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
        .select("*")
        .eq("iddisciplina", iddisciplina);

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

  return (
    <Container className="py-4">
      <h2 className="text-primary fw-bold mb-3">{decodeURIComponent(nome)}</h2>

      {docentes.length > 0 && (
        <p className="text-muted mb-4">
          Docente{docentes.length > 1 ? "s" : ""}: <strong>{docentes.join(", ")}</strong>
        </p>
      )}

      {carregando ? (
        <div className="text-center"><Spinner animation="border" variant="primary" /></div>
      ) : (
        <>
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
                <Col key={idx} md={6} className="mb-3">
                  <Card className="shadow-sm">
                    <Card.Body>
                      <Card.Title>{resumo.titulo || "Resumo"}</Card.Title>
                      <a href={resumo.url} target="_blank" rel="noopener noreferrer" className="btn btn-outline-primary btn-sm mt-2">
                        Ver PDF
                      </a>
                    </Card.Body>
                  </Card>
                </Col>
              ))}
            </Row>
          )}
        </>
      )}

      <Modal show={mostrarModal} onHide={() => setMostrarModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Escolher tipo de questões</Modal.Title>
        </Modal.Header>
        <Modal.Body className="text-center">
          <p className="lead mb-4">
            Que tipo de perguntas queres resolver em <strong>{materiaSelecionada?.nome}</strong>?
          </p>
          <div className="d-grid gap-2">
            <Button variant="primary" size="lg" onClick={() => iniciarResolucao("todas")}>
              ✅ Todas
            </Button>
            <Button variant="warning" size="lg" onClick={() => iniciarResolucao("nao_resolvidas")}>
              🔄 Não Resolvidas
            </Button>
            <Button variant="danger" size="lg" onClick={() => iniciarResolucao("erradas")}>
              ❌ Erradas
            </Button>
          </div>
        </Modal.Body>
      </Modal>
    </Container>
  );
};

export default DisciplinaPage;