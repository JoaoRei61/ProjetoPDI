import React, { useEffect, useState } from "react";
import { Container, Card, Badge, Button } from "react-bootstrap";
import { useLocation, useNavigate } from "react-router-dom";
import supabase from "../../helper/supabaseconfig";

const ResolverQuestoes = () => {
  const { state } = useLocation();
  const navigate = useNavigate();
  const { idmateria, nomeMateria } = state;

  const [perguntas, setPerguntas] = useState([]);
  const [indexAtual, setIndexAtual] = useState(0);
  const [mostrarResolucao, setMostrarResolucao] = useState(false);
  const [respostaAluno, setRespostaAluno] = useState(null);

  useEffect(() => {
    const fetchPerguntas = async () => {
      const { data, error } = await supabase
        .from("perguntas")
        .select("*, alternativas(idalternativa, texto, correta)")
        .eq("idmateria", idmateria);

      if (error) console.error("Erro ao buscar perguntas:", error);
      setPerguntas(data || []);
    };

    fetchPerguntas();
  }, [idmateria]);

  const gravarResolucao = async (correta) => {
    const { data: user, error: userError } = await supabase.auth.getUser();
    if (!user?.user) {
      console.error("Utilizador não autenticado — não pode gravar resolução");
      return;
    }

    const idutilizador = user.user.id;
    const idpergunta = perguntaAtual.idpergunta;

    try {
      const { data: resolucaoExistente, error: fetchError } = await supabase
      .from("resolucao")
      .select("*")
      .eq("idutilizador", idutilizador)
      .eq("idpergunta", idpergunta)
      .limit(1)
      .maybeSingle();
    
    if (fetchError) {
      console.error("Erro ao verificar resolução existente:", fetchError);
      return;
    }
    
      if (!resolucaoExistente) {
        const { error: insertError } = await supabase.from("resolucao").insert([
          {
            idutilizador,
            idpergunta,
            idmateria: perguntaAtual.idmateria,
            correta: correta,
          },
        ]);
        if (insertError) {
          console.error("Erro ao inserir nova resolução:", insertError);
        } else {
          console.log("Resolução inserida com sucesso");
        }
      } else if (!resolucaoExistente.correta && correta) {
        const { error: updateError } = await supabase
          .from("resolucao")
          .update({ correta: true })
          .eq("idutilizador", idutilizador)
          .eq("idpergunta", idpergunta);
        if (updateError) {
          console.error("Erro ao atualizar resolução:", updateError);
        } else {
          console.log("Resolução atualizada para correta com sucesso");
        }
      } else {
        console.log("Resolução já está correta — não foi necessário atualizar");
      }
    } catch (err) {
      console.error("Erro geral ao gravar resolução:", err);
    }
  };

  const perguntaAtual = perguntas[indexAtual];

  const handleResposta = async (resposta) => {
    setRespostaAluno(resposta);

    let correta = false;

    if (perguntaAtual.tipo_pergunta === "EM") {
      const alternativaSelecionada = perguntaAtual.alternativas.find(
        (alt) => alt.texto === resposta
      );
      correta = alternativaSelecionada?.correta || false;
      await gravarResolucao(correta);
      setMostrarResolucao(true);
    }

    if (perguntaAtual.tipo_pergunta === "Desenvolvimento") {
      correta = resposta === "Acertei";
      await gravarResolucao(correta);
    }
  };

  const proximaPergunta = () => {
    setIndexAtual((prev) => prev + 1);
    setMostrarResolucao(false);
    setRespostaAluno(null);
  };

  return (
    <Container className="py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h3 className="text-primary fw-bold mb-0">Matéria: {nomeMateria}</h3>
        <Button variant="outline-primary" onClick={() => navigate(-1)}>
          Sair
        </Button>
      </div>

      {perguntaAtual && (
        <Card className="shadow-sm p-3 mb-4 border-0">
          <Card.Body>
            <h5>
              Pergunta {indexAtual + 1}{" "}
              <Badge bg="secondary">{perguntaAtual.tipo_pergunta}</Badge>
            </h5>

            {perguntaAtual.texto && <p>{perguntaAtual.texto}</p>}
            {perguntaAtual.enunciado && (
              <img
                src={perguntaAtual.enunciado}
                alt="enunciado"
                className="img-fluid rounded"
              />
            )}

            {perguntaAtual.tipo_pergunta === "Desenvolvimento" && (
              <>
                <div className="mt-3">
                  <Button variant="info" onClick={() => setMostrarResolucao(true)}>
                    Mostrar Resolução
                  </Button>
                </div>
                <div className="mt-3 d-flex flex-wrap gap-2">
                  <Button
                    variant={respostaAluno === "Errei" ? "danger" : "outline-danger"}
                    onClick={() => handleResposta("Errei")}
                  >
                    Errei
                  </Button>
                  <Button
                    variant={respostaAluno === "Suficiente" ? "warning" : "outline-warning"}
                    onClick={() => handleResposta("Suficiente")}
                  >
                    Suficiente
                  </Button>
                  <Button
                    variant={respostaAluno === "Acertei" ? "success" : "outline-success"}
                    onClick={() => handleResposta("Acertei")}
                  >
                    Acertei
                  </Button>
                </div>
              </>
            )}

            {perguntaAtual.tipo_pergunta === "EM" && (
              <div className="mt-3">
                {perguntaAtual.alternativas?.map((alt, idx) => {
                  const selecionada = respostaAluno === alt.texto;
                  const correta = alt.correta;

                  return (
                    <div
                      key={idx}
                      className={`border p-2 mb-2 rounded w-100 ${
                        mostrarResolucao && selecionada
                          ? correta
                            ? "bg-success text-white"
                            : "bg-danger text-white"
                          : ""
                      }`}
                      style={{ cursor: "pointer" }}
                      onClick={() => handleResposta(alt.texto)}
                    >
                      {alt.texto}
                    </div>
                  );
                })}
              </div>
            )}

            {mostrarResolucao && (
              <div className="mt-4">
                <h6>Resolução:</h6>
                {perguntaAtual.explicacao && <p>{perguntaAtual.explicacao}</p>}
                {perguntaAtual.resolucao && (
                  <img
                    src={perguntaAtual.resolucao}
                    alt="resolução"
                    className="img-fluid rounded"
                  />
                )}
                {perguntaAtual.comentario && (
                  <div className="mt-3">
                    <strong>Comentário:</strong>
                    <p>{perguntaAtual.comentario}</p>
                  </div>
                )}
              </div>
            )}

            <div className="mt-4 text-end">
              {indexAtual < perguntas.length - 1 ? (
                <Button variant="outline-secondary" onClick={proximaPergunta}>
                  Próxima Pergunta
                </Button>
              ) : (
                <p className="text-success fw-bold">
                  Chegaste ao fim das perguntas desta matéria 🎉
                </p>
              )}
            </div>
          </Card.Body>
        </Card>
      )}
    </Container>
  );
};

export default ResolverQuestoes;
