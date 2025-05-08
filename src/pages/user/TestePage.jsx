import React, { useEffect, useState } from "react";
import { Container, Card, Badge, Button, Alert } from "react-bootstrap";
import { useLocation } from "react-router-dom";
import supabase from "../../helper/supabaseconfig";

const TestePage = () => {
  const location = useLocation();
  const {
    materiasSelecionadas,
    quantidadeExercicios,
    disciplina // este é o iddisciplina
  } = location.state;

  const [perguntas, setPerguntas] = useState([]);
  const [respostas, setRespostas] = useState({});
  const [tempoRestante, setTempoRestante] = useState(0);
  const [submetido, setSubmetido] = useState(false);
  const [acertos, setAcertos] = useState(0);
  const [indexAtual, setIndexAtual] = useState(0);

  useEffect(() => {
    const carregarPerguntas = async () => {
      const { data: materiasData } = await supabase
        .from("materia")
        .select("idmateria, nome")
        .in("nome", materiasSelecionadas);

      if (!materiasData || materiasData.length === 0) return;

      const totalMaterias = materiasData.length;
      const porMateria = Math.floor(quantidadeExercicios / totalMaterias);
      const resto = quantidadeExercicios % totalMaterias;

      let todasPerguntas = [];

      for (let i = 0; i < materiasData.length; i++) {
        const materia = materiasData[i];
        const limite = porMateria + (i < resto ? 1 : 0);

        const { data: perguntasMateria } = await supabase
          .from("perguntas")
          .select("*, alternativas(idalternativa, texto, correta)")
          .eq("idmateria", materia.idmateria)
          .eq("tipo_pergunta", "EM");

        if (!perguntasMateria) continue;

        const getRandom = (arr, n) =>
          arr.sort(() => 0.5 - Math.random()).slice(0, n);
        todasPerguntas.push(...getRandom(perguntasMateria, limite));
      }

      todasPerguntas = todasPerguntas.sort(() => 0.5 - Math.random());
      setPerguntas(todasPerguntas);
      setTempoRestante(todasPerguntas.length * 6 * 60);
    };

    carregarPerguntas();
  }, [materiasSelecionadas, quantidadeExercicios]);

  useEffect(() => {
    if (tempoRestante <= 0 || submetido) return;

    const intervalo = setInterval(() => {
      setTempoRestante((prev) => {
        if (prev <= 1) {
          clearInterval(intervalo);
          submeterExame();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(intervalo);
  }, [tempoRestante, submetido]);

  const formatarTempo = (segundos) => {
    const m = Math.floor(segundos / 60);
    const s = segundos % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const registarResposta = (id, resposta) => {
    setRespostas((prev) => ({ ...prev, [id]: resposta }));
  };

  const submeterExame = async () => {
    if (submetido) return;

    let corretas = 0;
    perguntas.forEach((p) => {
      const selecionada = respostas[p.idpergunta];
      const correta = p.alternativas?.find((alt) => alt.correta)?.texto;
      if (selecionada === correta) corretas++;
    });

    setAcertos(corretas);
    setSubmetido(true);

    const resolvidas = perguntas.length;
    const pontuacao =
      resolvidas > 0 ? (corretas / resolvidas) * (corretas + resolvidas) : 0;

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    // Inserir o teste na tabela "testes"
    await supabase.from("testes").insert([
      {
        idutilizador: user.id,
        iddisciplina: disciplina,
        pontuacao: pontuacao,
        data_criacao: new Date().toISOString(),
      },
    ]);

    // Atualizar ou inserir na tabela "rank"
    const { data: existente } = await supabase
      .from("rank")
      .select("pontos")
      .eq("idutilizador", user.id)
      .single();

    if (existente) {
      const novaPontuacao = existente.pontos + pontuacao;
      await supabase
        .from("rank")
        .update({ pontos: novaPontuacao })
        .eq("idutilizador", user.id);
    } else {
      await supabase
        .from("rank")
        .insert([{ idutilizador: user.id, pontos: pontuacao }]);
    }
  };

  const perguntaAtual = perguntas[indexAtual];

  return (
    <Container className="py-4">
      <h3 className="text-primary fw-bold mb-3">Modo Exame</h3>

      {!submetido && (
        <Alert variant="info" className="text-center fs-5">
          Tempo restante: <strong>{formatarTempo(tempoRestante)}</strong>
        </Alert>
      )}

      {!submetido ? (
        perguntas.length > 0 && (
          <>
            <Card className="p-3 mb-4 border-0" style={{ boxShadow: "none" }}>
              <Card.Body>
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <h5>
                    Pergunta {indexAtual + 1} <Badge bg="secondary">EM</Badge>
                  </h5>
                </div>

                {perguntaAtual.texto && <p>{perguntaAtual.texto}</p>}
                {perguntaAtual.enunciado && (
                  <img
                    src={perguntaAtual.enunciado}
                    alt="enunciado"
                    style={{ maxWidth: "100%", borderRadius: "8px" }}
                  />
                )}

                {perguntaAtual.alternativas?.map((alt, idx) => {
                  const selecionada =
                    respostas[perguntaAtual.idpergunta] === alt.texto;
                  let classe = "border p-2 mb-2 rounded w-100 ";
                  if (selecionada) classe += "bg-primary text-white";

                  return (
                    <div
                      key={idx}
                      className={classe}
                      style={{ cursor: "pointer" }}
                      onClick={() =>
                        registarResposta(perguntaAtual.idpergunta, alt.texto)
                      }
                    >
                      {alt.texto}
                    </div>
                  );
                })}
              </Card.Body>
            </Card>

            <div className="d-flex justify-content-between mb-3">
              <Button
                variant="outline-primary"
                disabled={indexAtual === 0}
                onClick={() => setIndexAtual((prev) => prev - 1)}
              >
                Anterior
              </Button>
              {indexAtual < perguntas.length - 1 ? (
                <Button
                  variant="outline-primary"
                  onClick={() => setIndexAtual((prev) => prev + 1)}
                >
                  Próxima
                </Button>
              ) : (
                <Button variant="danger" onClick={submeterExame}>
                  Submeter Exame
                </Button>
              )}
            </div>
          </>
        )
      ) : (
        <>
          <Alert variant="success" className="text-center fs-5 mt-3">
            Acertaste <strong>{acertos}</strong> pergunta(s) de escolha múltipla!
          </Alert>

          {perguntas.map((p, i) => {
            const correta = p.alternativas?.find((alt) => alt.correta)?.texto;
            const selecionada = respostas[p.idpergunta];

            return (
              <Card
                key={p.idpergunta}
                className="p-3 mb-4 border-0"
                style={{ boxShadow: "none" }}
              >
                <Card.Body>
                  <h5>
                    Pergunta {i + 1} <Badge bg="secondary">EM</Badge>
                  </h5>
                  <p className="mt-2">{p.texto}</p>
                  {p.enunciado && (
                    <img
                      src={p.enunciado}
                      alt="enunciado"
                      style={{ maxWidth: "100%", borderRadius: "8px" }}
                    />
                  )}

                  {p.alternativas?.map((alt, idx) => {
                    let classe = "border p-2 mb-2 rounded w-100 ";
                    if (alt.texto === correta) {
                      classe += "bg-success text-white";
                    } else if (alt.texto === selecionada) {
                      classe += "bg-danger text-white";
                    }

                    return <div key={idx} className={classe}>{alt.texto}</div>;
                  })}
                </Card.Body>
              </Card>
            );
          })}
        </>
      )}
    </Container>
  );
};

export default TestePage;