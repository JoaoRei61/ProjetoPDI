import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
} from "react-native";
import supabase from "../supabaseconfig";
import Header from "../componentes/header";
import { useAuth } from "../context/AuthProvider";
import LoadingScreen from "../screens/LoadingScreen";


// Função para embaralhar array
const shuffleArray = (array) => array.sort(() => Math.random() - 0.5);

const ExamesPerguntasScreen = ({ route, navigation }) => {
  const { selectedMaterias, numPerguntas, iddisciplina } = route.params || {};
  const { user } = useAuth();

  // Guarda o ID do registro em "utilizadores" (coluna "id")
  const [idUtilizador, setIdUtilizador] = useState(null);

  // Estados do quiz
  const [perguntas, setPerguntas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [respostasSelecionadas, setRespostasSelecionadas] = useState({});
  const [quizFinalizado, setQuizFinalizado] = useState(false);

  // Exibição de resultado
  const [resultado, setResultado] = useState(null);
  const [mensagemResultado, setMensagemResultado] = useState("");
  const [pontos, setPontos] = useState(null);

  // Controle da pergunta atual
  const [perguntaAtual, setPerguntaAtual] = useState(0);
  const [mostrarVisualizacao, setMostrarVisualizacao] = useState(false);

  // Animação de fade
  const fadeAnim = useState(new Animated.Value(0))[0];

  // 1) Buscar na tabela "utilizadores" o registro cujo "id" corresponde a user.id
  useEffect(() => {
    const fetchIdUtilizador = async () => {
      if (user?.id) {
        const { data, error } = await supabase
          .from("utilizadores")
          .select("id")
          .eq("id", user.id)
          .maybeSingle();

        if (error) {
          console.error("Erro ao buscar utilizador:", error);
          return;
        }
        if (!data) {
          console.log("Nenhum utilizador encontrado para esse ID:", user.id);
        } else {
          setIdUtilizador(data.id);
        }
      }
    };
    fetchIdUtilizador();
  }, [user]);

  // 2) Buscar perguntas
  useEffect(() => {
    const fetchPerguntas = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("perguntas")
        .select("*, alternativas(*)")
        .in("idmateria", selectedMaterias)
        .limit(100);

      if (error) {
        console.error("Erro ao buscar perguntas:", error);
      } else if (data?.length) {
        // Seleciona perguntas aleatórias
        const perguntasAleatorias = shuffleArray(data).slice(0, numPerguntas);
        perguntasAleatorias.forEach((pergunta) => {
          pergunta.alternativas = shuffleArray(pergunta.alternativas);
        });
        setPerguntas(perguntasAleatorias);
      }
      setLoading(false);
    };
    fetchPerguntas();
  }, [selectedMaterias, numPerguntas]);

  // Selecionar resposta
  const handleRespostaSelecionada = (idpergunta, idalternativa) => {
    if (quizFinalizado) return;
    setRespostasSelecionadas((prev) => ({
      ...prev,
      [idpergunta]: idalternativa,
    }));
  };

  // Passar para a próxima pergunta
  const avancarPergunta = () => {
    if (perguntaAtual < perguntas.length - 1) {
      setPerguntaAtual(perguntaAtual + 1);
    } else {
      verificarRespostas();
    }
  };

  // Verifica se a pergunta foi respondida corretamente
  const respondida_corretamentePergunta = (pergunta) => {
    const respostaSelecionada = respostasSelecionadas[pergunta.idpergunta];
    const alternativaCorreta = pergunta.alternativas.find((alt) => alt.correta);
    return respostaSelecionada === alternativaCorreta?.idalternativa;
  };

  // 3) Verificar as respostas e inserir no banco "testes" e depois "perguntas_teste"
  const verificarRespostas = async () => {
    if (quizFinalizado) return;

    // Contagem de acertos
    let respostasCorretas = 0;
    perguntas.forEach((pergunta) => {
      if (respondida_corretamentePergunta(pergunta)) {
        respostasCorretas++;
      }
    });

    // Porcentagem de acerto
    const porcentagem = ((respostasCorretas / perguntas.length) * 100).toFixed(2);
    setQuizFinalizado(true);
    setResultado(porcentagem);

    // Cálculo da pontuação pela fórmula:
    //     pontuacao = (acertos / resolvidos) * (acertos + resolvidos)
    const acertos = respostasCorretas;
    const resolvidos = perguntas.length;
    const pontuacaoFormula = (acertos / resolvidos) * (acertos + resolvidos);
    setPontos(pontuacaoFormula.toFixed(2));

    definirMensagemResultado(porcentagem);

    // Animação de fade
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start();

    // 3.1) Inserir resultado do teste na tabela "testes"
    try {
      const numericIdDisc = iddisciplina ? parseInt(iddisciplina, 10) : null;

      // Cria um novo registro em "testes"
      const { data: testeInserido, error: testeErro } = await supabase
        .from("testes")
        .insert([
          {
            data_criacao: new Date().toISOString(),
            pontuacao: parseFloat(pontuacaoFormula),
            iddisciplina: numericIdDisc,
            idutilizador: idUtilizador || null,
           
          },
        ])
        .select()
        .single();

      if (testeErro) {
        console.error("Erro ao inserir teste:", testeErro);
        return;
      }

      if (!testeInserido) {
        console.log("Não foi possível criar o teste, dado nulo.");
        return;
      }

      // Resgatamos o idteste que acabou de ser criado
      const idteste = testeInserido.idteste;

      // 3.2) Inserir perguntas usadas no teste em "perguntas_teste"
      const listaPerguntasTeste = perguntas.map((pergunta) => {
        // Verifica se acertou ou não a pergunta
        const correta = respondida_corretamentePergunta(pergunta);

        return {
          idteste,
          idpergunta: pergunta.idpergunta,
          correta,
          idmateria: pergunta.idmateria,
        };
      });

      const { error: errorPerguntasTeste } = await supabase
        .from("perguntas_teste")
        .insert(listaPerguntasTeste);

      if (errorPerguntasTeste) {
        console.error("Erro ao inserir em perguntas_teste:", errorPerguntasTeste);
      }
    } catch (e) {
      console.error("Erro inesperado ao salvar teste:", e);
    }

    // 3.3) Atualizar ou inserir pontuação total do usuário na tabela "rank"
    try {
      // Verifica se o usuário já existe na tabela "rank"
      const { data: rankRow, error: rankFetchError } = await supabase
        .from("rank")
        .select("idutilizador, pontos")
        .eq("idutilizador", idUtilizador)
        .maybeSingle();

      if (rankFetchError) {
        console.error("Erro ao buscar rank:", rankFetchError);
      } else if (rankRow) {
        // Se já existir, soma a nova pontuação (decimais permitidos)
        const novaPontuacao =
          parseFloat(rankRow.pontos) + parseFloat(pontuacaoFormula);

        const { error: rankUpdateError } = await supabase
          .from("rank")
          .update({ pontos: novaPontuacao })
          .eq("idutilizador", idUtilizador);

        if (rankUpdateError) {
          console.error("Erro ao atualizar rank:", rankUpdateError);
        }
      } else {
        // Se não existir, cria um novo registro
        const { error: rankInsertError } = await supabase
          .from("rank")
          .insert({
            idutilizador: idUtilizador,
            pontos: parseFloat(pontuacaoFormula),
          });

        if (rankInsertError) {
          console.error("Erro ao inserir no rank:", rankInsertError);
        }
      }
    } catch (err) {
      console.error("Erro inesperado ao gerenciar rank:", err);
    }

    // 3.4) Adicionar/atualizar cada pergunta respondida na tabela "resolucao"
    try {
      for (const pergunta of perguntas) {
        const acertou = respondida_corretamentePergunta(pergunta);
        const idPergunta = pergunta.idpergunta;
        const idMateria = pergunta.idmateria;

        // Verifica se já existe um registro do user + pergunta
        const { data: rankPessoalRow, error: fetchRankPessoalError } = await supabase
          .from("resolucao")
          .select("idutilizador, idpergunta, correta")
          .eq("idutilizador", idUtilizador)
          .eq("idpergunta", idPergunta)
          .maybeSingle();

        if (fetchRankPessoalError) {
          console.error("Erro ao buscar resolucao:", fetchRankPessoalError);
          continue; // pula para a próxima pergunta
        }

        // Se não existe, insere
        if (!rankPessoalRow) {
          // Insere o registro com "correta" = true/false de acordo com a resposta
          const { error: insertRankPessoalError } = await supabase
            .from("resolucao")
            .insert({
              idutilizador: idUtilizador,
              idpergunta: idPergunta,
              idmateria: idMateria,
              correta: acertou,
            });

          if (insertRankPessoalError) {
            console.error("Erro ao inserir em resolucao:", insertRankPessoalError);
          }
        } else {
          // Se já existe e o user acertou agora -> atualiza para correta = true
          if (acertou && !rankPessoalRow.correta) {
            // Só atualiza se estava false e agora é true
            const { error: updateRankPessoalError } = await supabase
              .from("resolucao")
              .update({ correta: true })
              .eq("idutilizador", idUtilizador)
              .eq("idpergunta", idPergunta);

            if (updateRankPessoalError) {
              console.error("Erro ao atualizar resolucao:", updateRankPessoalError);
            }
          }
          // Se já existe e o user errou novamente, não altera nada:
          // (fica correto se já estava true, ou fica false se já estava false)
        }
      }
    } catch (err) {
      console.error("Erro inesperado ao gerenciar resolucao:", err);
    }
  };

  // Define mensagem com base na % de acerto
  const definirMensagemResultado = (nota) => {
    const notaNum = parseFloat(nota);
    if (notaNum >= 90) {
      setMensagemResultado("🎉 Parabéns! Excelente desempenho!");
    } else if (notaNum >= 70) {
      setMensagemResultado("👏 Bom trabalho! Continue melhorando!");
    } else if (notaNum >= 50) {
      setMensagemResultado("🤔 Você pode melhorar! Tente novamente!");
    } else {
      setMensagemResultado("📚 Não foi tão bem... Estude mais e tente de novo!");
    }
  };

  const VisualizarTesteFinal = () => {
    setMostrarVisualizacao(true);
  };

  // Renderização do teste completo (tela final)
  const renderTesteCompleto = () => {
    return (
      <ScrollView contentContainerStyle={styles.scrollContainerFinal}>
        <Text style={styles.titleFinal}>Visualização do Teste</Text>

        {perguntas.map((pergunta, index) => {
          const acertou = respondida_corretamentePergunta(pergunta);
          const respostaSelecionada = respostasSelecionadas[pergunta.idpergunta];

          return (
            <View
              key={`pergunta-${pergunta.idpergunta}`}
              style={styles.finalPerguntaContainer}
            >
              <Text style={styles.finalPerguntaTitulo}>
                {index + 1}. {pergunta.texto}
              </Text>
              <View style={{ marginTop: 10 }} />

              {pergunta.alternativas.map((alternativa) => {
                const selecionada =
                  respostaSelecionada === alternativa.idalternativa;
                let estilo = [styles.alternativaButtonFinal];

                if (selecionada) {
                  estilo.push(acertou ? styles.certaButton : styles.erradaButton);
                }

                return (
                  <View key={`alt-${alternativa.idalternativa}`} style={estilo}>
                    <Text style={styles.alternativaTextFinal}>{alternativa.texto}</Text>
                  </View>
                );
              })}

              {/* Se errou e há explicação, exibe abaixo */}
              {!acertou && pergunta.explicacao && respostaSelecionada && (
                <View style={styles.finalExplicacaoContainer}>
                  <Text style={styles.explicacaoTextoFinal}>
                    Explicação: {pergunta.explicacao}
                  </Text>
                </View>
              )}
            </View>
          );
        })}

        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonText}>🔙 Voltar</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  };

  return (
    <View style={styles.container}>
      <Header />

      {mostrarVisualizacao ? (
        renderTesteCompleto()
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          {loading ? (
            <LoadingScreen onFinish={null} />
          ) : (
            <>
              {!quizFinalizado ? (
                <>
                  <Text style={styles.title}>
                    {`Pergunta ${perguntaAtual + 1} de ${perguntas.length}`}
                  </Text>

                  <View style={styles.perguntaContainer}>
                    <Text style={styles.perguntaText}>
                      {perguntas[perguntaAtual]?.texto}
                    </Text>
                  </View>

                  <View style={styles.respostasContainer}>
                    {perguntas[perguntaAtual]?.alternativas.map((alternativa) => (
                      <TouchableOpacity
                        key={`alt-${alternativa.idalternativa}`}
                        style={[
                          styles.alternativaButton,
                          respostasSelecionadas[
                            perguntas[perguntaAtual]?.idpergunta
                          ] === alternativa.idalternativa && styles.selectedAnswer,
                        ]}
                        onPress={() =>
                          handleRespostaSelecionada(
                            perguntas[perguntaAtual]?.idpergunta,
                            alternativa.idalternativa
                          )
                        }
                        disabled={quizFinalizado}
                      >
                        <Text style={styles.alternativaText}>{alternativa.texto}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  <TouchableOpacity style={styles.nextButton} onPress={avancarPergunta}>
                    <Text style={styles.nextButtonText}>
                      {perguntaAtual === perguntas.length - 1
                        ? "Terminar Teste"
                        : "Próxima Pergunta"}
                    </Text>
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  <Text style={styles.title}>Quiz Finalizado</Text>
                  <Text style={styles.resultadoTexto}>{mensagemResultado}</Text>
                  <Text style={styles.resultadoPontuacao}>Resultado: {resultado}%</Text>
                  {pontos !== null && (
                    <Text style={styles.pontosText}>
                      Você ganhou {pontos} pontos!
                    </Text>
                  )}

                  <TouchableOpacity style={styles.closeButton} onPress={() => navigation.goBack()}>
                    <Text style={styles.closeButtonText}>🔙 Voltar</Text>
                  </TouchableOpacity>

                  <TouchableOpacity style={styles.closeButton} onPress={VisualizarTesteFinal}>
                    <Text style={styles.closeButtonText}>👀 Visualizar Teste</Text>
                  </TouchableOpacity>
                </>
              )}
            </>
          )}
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F4F4F9" },
  scrollContainer: { padding: 16, paddingBottom: 100 },
  loader: { marginTop: 20 },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#d32f2f",
    marginBottom: 20,
    textAlign: "center",
  },
  perguntaContainer: {
    height: 200,
    width: "90%",
    backgroundColor: "#ddd",
    padding: 30,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
    elevation: 3,
    alignSelf: "center",
  },
  perguntaText: {
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
    color: "#333",
  },
  respostasContainer: {
    width: "100%",
    alignItems: "center",
    marginTop: "10%",
    marginBottom: "10%",
    height: "30%",
  },
  alternativaButton: {
    width: "90%",
    paddingVertical: 20,
    backgroundColor: "#007AFF",
    marginVertical: 8,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    elevation: 3,
  },
  alternativaText: {
    fontSize: 17,
    fontWeight: "bold",
    color: "#FFF",
    textAlign: "center",
  },
  selectedAnswer: {
    backgroundColor: "#00FFFF",
    borderColor: "#0000FF",
    borderWidth: 2,
  },
  nextButton: {
    width: "90%",
    paddingVertical: 20,
    backgroundColor: "#28A745",
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
    marginBottom: 20,
    elevation: 3,
  },
  nextButtonText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#FFF",
  },
  resultadoTexto: {
    fontSize: 22,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 15,
    color: "#333",
  },
  resultadoPontuacao: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#FF4500",
    textAlign: "center",
    marginBottom: 10,
  },
  pontosText: {
    fontSize: 20,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 20,
    color: "#333",
  },
  closeButton: {
    backgroundColor: "#007AFF",
    padding: 12,
    borderRadius: 8,
    width: "90%",
    alignItems: "center",
    marginTop: 15,
    alignSelf: "center",
  },
  closeButtonText: {
    color: "#FFF",
    fontSize: 18,
    fontWeight: "bold",
  },
  // Tela Final
  scrollContainerFinal: { padding: 16, paddingBottom: 50 },
  titleFinal: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#d32f2f",
    textAlign: "center",
    marginBottom: 20,
  },
  finalPerguntaContainer: {
    backgroundColor: "#fff",
    marginBottom: 20,
    padding: 15,
    borderRadius: 10,
    elevation: 3,
  },
  finalPerguntaTitulo: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  alternativaButtonFinal: {
    backgroundColor: "#007AFF",
    marginVertical: 5,
    borderRadius: 8,
    padding: 12,
  },
  alternativaTextFinal: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#fff",
  },
  certaButton: {
    backgroundColor: "#4CAF50",
  },
  erradaButton: {
    backgroundColor: "#FF6347",
  },
  finalExplicacaoContainer: {
    marginTop: 10,
    padding: 10,
    backgroundColor: "#f0f4ff",
    borderRadius: 8,
  },
  explicacaoTextoFinal: {
    fontSize: 14,
    color: "#d32f2f",
  },
  backButton: {
    backgroundColor: "#007AFF",
    padding: 12,
    borderRadius: 8,
    width: "90%",
    alignItems: "center",
    marginTop: 15,
    alignSelf: "center",
  },
  backButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
});

export default ExamesPerguntasScreen;
