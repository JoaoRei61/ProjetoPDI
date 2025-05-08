import React, { useEffect, useState } from "react";
import { Container, Row, Col, Card, ProgressBar, Button, Dropdown } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import supabase from "../../helper/supabaseconfig";

const QuestoesPage = () => {
  const [anoSelecionado, setAnoSelecionado] = useState(null);
  const [semestreSelecionado, setSemestreSelecionado] = useState(null);
  const [dados, setDados] = useState({});
  const [ucExpandida, setUcExpandida] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchDados = async () => {
      const { data: user } = await supabase.auth.getUser();
      if (!user?.user) return;

      const { data: userInfo } = await supabase
        .from("utilizadores")
        .select("idcurso")
        .eq("id", user.user.id)
        .single();
      if (!userInfo) return;

      const { data: disciplinasRaw } = await supabase
        .from("curso_disciplina")
        .select("ano, semestre, disciplinas(iddisciplina, nome, materia(idmateria, nome))")
        .eq("idcurso", userInfo.idcurso);

      const todasMaterias = disciplinasRaw
        .map(({ disciplinas }) => disciplinas?.materia || [])
        .flat()
        .map((m) => m.idmateria);

      const { data: perguntasData } = await supabase
        .from("perguntas")
        .select("idmateria");

      const { data: resolucoesData } = await supabase
        .from("resolucao")
        .select("idmateria")
        .eq("idutilizador", user.user.id);

      const totalPorMateria = {};
      perguntasData.forEach((p) => {
        totalPorMateria[p.idmateria] = (totalPorMateria[p.idmateria] || 0) + 1;
      });

      const feitosPorMateria = {};
      resolucoesData.forEach((r) => {
        feitosPorMateria[r.idmateria] = (feitosPorMateria[r.idmateria] || 0) + 1;
      });

      const estrutura = {};

      for (const { ano, semestre, disciplinas } of disciplinasRaw) {
        if (!disciplinas || !disciplinas.materia) continue;

        const anoTexto = `${ano}º ano`;
        if (!estrutura[anoTexto]) estrutura[anoTexto] = { semestre1: {}, semestre2: {} };

        const { iddisciplina, nome, materia } = disciplinas;
        const semKey = `semestre${semestre}`;

        const materiasComDados = materia.map((m) => {
          const total = totalPorMateria[m.idmateria] || 0;
          const feitos = feitosPorMateria[m.idmateria] || 0;
          return {
            id: m.idmateria,
            nome: m.nome,
            total,
            feitos,
          };
        });

        const totalDisciplina = materiasComDados.reduce((acc, m) => acc + m.total, 0);
        const feitosDisciplina = materiasComDados.reduce((acc, m) => acc + m.feitos, 0);
        const progresso = totalDisciplina > 0 ? Math.round((feitosDisciplina / totalDisciplina) * 100) : 0;

        estrutura[anoTexto][semKey][nome] = {
          iddisciplina,
          materias: materiasComDados,
          progresso,
          totalDisciplina,
        };
      }

      setDados(estrutura);
      const primeiroAno = Object.keys(estrutura)[0];
      setAnoSelecionado(primeiroAno);
      setSemestreSelecionado("semestre1");
    };

    fetchDados();
  }, []);

  const handleMateriaClick = (disciplina, materia) => {
    navigate("/user/questoes-resolver", {
      state: {
        iddisciplina: disciplina.iddisciplina,
        idmateria: materia.id,
        nomeMateria: materia.nome,
      },
    });
  };

  const getProgressVariant = (percent) => {
    if (percent <= 25) return "danger"; 
    if (percent <= 75) return "warning"; 
    return "info"; 
  };

  const anos = Object.keys(dados);
  const ucs =
    dados[anoSelecionado] && dados[anoSelecionado][semestreSelecionado]
      ? Object.entries(dados[anoSelecionado][semestreSelecionado])
      : [];

  return (
    <Container className="py-5">
      <div className="d-flex justify-content-center gap-3 mb-4 flex-wrap">
        {anos.map((ano) => (
          <Button
            key={ano}
            variant={ano === anoSelecionado ? "primary" : "outline-secondary"}
            className="rounded-pill px-4 fw-bold"
            onClick={() => {
              setAnoSelecionado(ano);
              setUcExpandida(null);
            }}
          >
            {ano}
          </Button>
        ))}
        <Dropdown onSelect={(key) => setSemestreSelecionado(key)}>
          <Dropdown.Toggle variant="outline-primary" id="dropdown-semestre">
            {semestreSelecionado === "semestre1" ? "1º Semestre" : "2º Semestre"}
          </Dropdown.Toggle>
          <Dropdown.Menu>
            <Dropdown.Item eventKey="semestre1">1º Semestre</Dropdown.Item>
            <Dropdown.Item eventKey="semestre2">2º Semestre</Dropdown.Item>
          </Dropdown.Menu>
        </Dropdown>
      </div>

      {ucs.map(([ucNome, ucDados], index) => (
        <Card key={index} className="mb-3 shadow-sm border-0">
          <Card.Body
            style={{ cursor: "pointer" }}
            onClick={() => setUcExpandida(ucExpandida === ucNome ? null : ucNome)}
          >
            <h5 className="fw-bold mb-2">{ucNome}</h5>
            <span className="small text-muted">
              Exercícios:{" "}
              {ucDados.totalDisciplina > 0
                ? `${ucDados.totalDisciplina} no total`
                : "ainda sem exercícios"}
            </span>
            <ProgressBar
              now={ucDados.progresso}
              label={`${ucDados.progresso}%`}
              variant={getProgressVariant(ucDados.progresso)}
              className="mt-1"
            />
          </Card.Body>

          {ucExpandida === ucNome && (
            <Card.Body className="bg-light pt-3">
              <Row>
                {ucDados.materias.map((materia, idx) => {
                  const percent = materia.total > 0 ? (materia.feitos / materia.total) * 100 : 0;
                  return (
                    <Col md={6} key={idx} className="mb-3">
                      <Card
                        className="border border-1 border-light shadow-sm"
                        style={{ cursor: "pointer" }}
                        onClick={() => handleMateriaClick(ucDados, materia)}
                      >
                        <Card.Body>
                          <h6 className="fw-bold mb-1">{materia.nome}</h6>
                          <span className="small text-muted">
                            Exercícios: {materia.feitos}/{materia.total}
                          </span>
                          <ProgressBar
                            now={percent}
                            label={`${materia.feitos}/${materia.total}`}
                            variant={getProgressVariant(percent)}
                            className="mt-1"
                          />
                        </Card.Body>
                      </Card>
                    </Col>
                  );
                })}
              </Row>
            </Card.Body>
          )}
        </Card>
      ))}
    </Container>
  );
};

export default QuestoesPage;
