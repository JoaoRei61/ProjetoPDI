import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ActivityIndicator,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Animated,
} from "react-native";
import supabase from "../supabaseconfig";
import Header from "../componentes/header";
import { useAuth } from "../context/AuthProvider";

// Função para embaralhar array
const shuffleArray = (array) => array.sort(() => Math.random() - 0.5);

const QuizPerguntasScreen = ({ route, navigation }) => {
  // Recebemos "selectedMaterias", "numPerguntas" e opcionalmente "iddisciplina"
  const { selectedMaterias, numPerguntas, iddisciplina } = route.params || {};

  const { user } = useAuth();

  // 🔸 ESTADO para dados do utilizador a partir da tabela "utilizadores"
  const [utilizador, setUtilizador] = useState({ nome: "", telefone: "", tipo_conta: "" });

  // Estados
  const [perguntas, setPerguntas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [respostasSelecionadas, setRespostasSelecionadas] = useState({});
  const [quizFinalizado, setQuizFinalizado] = useState(false);
  const [resultado, setResultado] = useState(null);
  const [mensagemResultado, setMensagemResultado] = useState("");
  const [perguntaAtual, setPerguntaAtual] = useState(0);

  // Animação de fade
  const fadeAnim = useState(new Animated.Value(0))[0];

  // Para "visualizar teste" ao final
  const [mostrarVisualizacao, setMostrarVisualizacao] = useState(false);

  // Armazena caso o user tenha escolhido "nao_responder" em alguma pergunta
  const [naoResponderSelecionado, setNaoResponderSelecionado] = useState({});

  // 1) Carregar dados do utilizador da Tabela "utilizadores"
  useEffect(() => {
    const fetchUtilizador = async () => {
      if (user?.id) {
        const { data: info, error } = await supabase
          .from("utilizadores")
          .select("nome, telefone, tipo_conta")
          .eq("id", user.id)
          .single();
        if (!error && info) {
          setUtilizador(info);
        }
      }
    };
    fetchUtilizador();
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
      } else {
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

  // Manipular seleção de resposta
  const handleRespostaSelecionada = (idpergunta, idalternativa) => {
    if (quizFinalizado) return;
    setRespostasSelecionadas((prev) => ({
      ...prev,
      [idpergunta]: idalternativa,
    }));
  };

  const handleNaoPretendoResponder = (idpergunta) => {
    if (quizFinalizado) return;
    setNaoResponderSelecionado((prev) => ({
      ...prev,
      [idpergunta]: true,
    }));
    setRespostasSelecionadas((prev) => ({
      ...prev,
      [idpergunta]: "nao_responder",
    }));
  };

  const avancarPergunta = () => {
    if (perguntaAtual < perguntas.length - 1) {
      setPerguntaAtual(perguntaAtual + 1);
    } else {
      verificarRespostas();
    }
  };

  // 3) Verificar as respostas e inserir no banco "quizzes"
  const verificarRespostas = async () => {
    if (quizFinalizado) return;

    let respostasCorretas = 0;
    perguntas.forEach((pergunta) => {
      const respostaSelecionada = respostasSelecionadas[pergunta.idpergunta];
      const alternativaCorreta = pergunta.alternativas.find((alt) => alt.correta);
      if (respostaSelecionada === alternativaCorreta?.idalternativa) {
        respostasCorretas++;
      }
    });

    const porcentagem = ((respostasCorretas / perguntas.length) * 100).toFixed(2);
    setQuizFinalizado(true);
    setResultado(porcentagem);
    definirMensagemResultado(porcentagem);

    // Animação de fade
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start();

    try {
      // Tenta converter iddisciplina caso seja smallint
      const numericIdDisc = iddisciplina ? parseInt(iddisciplina, 10) : null;

      // 🔸 INSERIR QUIZ USANDO DADOS DE "utilizador" e "user.email"
      const { data: quizInserido, error: quizErro } = await supabase
        .from("quizzes")
        .insert([
          {
            pontuacao: parseInt(porcentagem, 10), // se col. for smallint/integer
            data_criacao: new Date().toISOString(),

            // Se existir a col. "iddisciplina" no DB, passamos numericIdDisc
            iddisciplina: numericIdDisc,

            // O ID do user é a FK para "idutilizador"
            idutilizador: user?.id || null,

            // Em vez de user_metadata, usamos "utilizador" + "user.email"
            nome: utilizador?.nome || "Sem nome",
            telefone: utilizador?.telefone || "sem_telefone",
            tipo_conta: utilizador?.tipo_conta || "desconhecido",
            email: user?.email || "sem_email",
          },
        ])
        .select()
        .single();

      if (quizErro) {
        console.error("Erro ao inserir quiz:", quizErro);
      } else if (quizInserido) {
        // Se quizInserido foi criado com sucesso, inserir quiz_perguntas
        const idquizzCriado = quizInserido.idquiz;

        // Monta array quiz_perguntas
        const listaQuizPerguntas = perguntas.map((pergunta) => {
          const respSel = respostasSelecionadas[pergunta.idpergunta];
          const altCorreta = pergunta.alternativas.find((alt) => alt.correta);
          const respondida_corretamente = respSel === altCorreta?.idalternativa;
          return {
            idquiz: idquizzCriado,
            idpergunta: pergunta.idpergunta,
            respondida_corretamente,
          };
        });

        const { error: errorQp } = await supabase
          .from("quiz_perguntas")
          .insert(listaQuizPerguntas);

        if (errorQp) {
          console.error("Erro ao inserir em quiz_perguntas:", errorQp);
        }
      }
    } catch (e) {
      console.error("Erro inesperado ao salvar quiz:", e);
    }
  };

  const definirMensagemResultado = (nota) => {
    if (nota >= 90) {
      setMensagemResultado("🎉 Parabéns! Excelente desempenho!");
    } else if (nota >= 70) {
      setMensagemResultado("👏 Bom trabalho! Continue melhorando!");
    } else if (nota >= 50) {
      setMensagemResultado("🤔 Você pode melhorar! Tente novamente!");
    } else {
      setMensagemResultado("📚 Não foi tão bem... Estude mais e tente de novo!");
    }
  };

  const VisualizarTesteFinal = () => {
    setMostrarVisualizacao(true);
  };

  const respondida_corretamentePergunta = (pergunta) => {
    const respostaSelecionada = respostasSelecionadas[pergunta.idpergunta];
    const alternativaCorreta = pergunta.alternativas.find((alt) => alt.correta);
    return respostaSelecionada === alternativaCorreta?.idalternativa;
  };

  // Renders a visualização final
  const renderTesteCompleto = () => {
    return (
      <ScrollView contentContainerStyle={styles.scrollContainerFinal}>
        <Text style={styles.titleFinal}>Visualização do Teste</Text>

        {perguntas.map((pergunta, index) => {
          const respondida_corretamente = respondida_corretamentePergunta(pergunta);
          const respostaSelecionada = respostasSelecionadas[pergunta.idpergunta];
          const naoRespondeu = respostaSelecionada === "nao_responder";

          return (
            <View key={`pergunta-${pergunta.idpergunta}`} style={styles.finalPerguntaContainer}>
              <Text style={styles.finalPerguntaTitulo}>
                {index + 1}. {pergunta.texto}
              </Text>
              <View style={{ marginTop: 10 }} />

              {pergunta.alternativas.map((alternativa) => {
                const selecionada = respostaSelecionada === alternativa.idalternativa;
                let estilo = [styles.alternativaButtonFinal];

                if (selecionada) {
                  if (respondida_corretamente) {
                    estilo.push(styles.certaButton);
                  } else {
                    estilo.push(styles.erradaButton);
                  }
                }

                return (
                  <View key={`alt-${alternativa.idalternativa}`} style={estilo}>
                    <Text style={styles.alternativaTextFinal}>{alternativa.texto}</Text>
                  </View>
                );
              })}

              <View style={styles.finalExplicacaoContainer}>
                {naoRespondeu && (
                  <Text style={styles.explicacaoTextoFinal}>Você não respondeu a questão.</Text>
                )}
                {!respondida_corretamente &&
                  !naoRespondeu &&
                  pergunta.explicacao && (
                    <Text style={styles.explicacaoTextoFinal}>
                      Explicação: {pergunta.explicacao}
                    </Text>
                  )}
              </View>
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
            <ActivityIndicator size="large" color="#6200ea" style={styles.loader} />
          ) : (
            <>
              {!quizFinalizado ? (
                <>
                  <Text style={styles.title}>
                    {`Pergunta ${perguntaAtual + 1} de ${perguntas.length}`}
                  </Text>

                  <View style={styles.perguntaContainer}>
                    <Text style={styles.perguntaText}>{perguntas[perguntaAtual]?.texto}</Text>
                  </View>

                  <View style={styles.respostasContainer}>
                    {perguntas[perguntaAtual]?.alternativas.map((alternativa) => (
                      <TouchableOpacity
                        key={`alt-${alternativa.idalternativa}`}
                        style={[
                          styles.alternativaButton,
                          respostasSelecionadas[perguntas[perguntaAtual]?.idpergunta] ===
                            alternativa.idalternativa && styles.selectedAnswer,
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

                  <TouchableOpacity
                    style={[
                      styles.naoResponderButton,
                      naoResponderSelecionado[perguntas[perguntaAtual]?.idpergunta] &&
                        styles.selectedNaoResponder,
                    ]}
                    onPress={() =>
                      handleNaoPretendoResponder(perguntas[perguntaAtual]?.idpergunta)
                    }
                  >
                    <Text style={styles.naoResponderText}>❌ Não pretendo responder</Text>
                  </TouchableOpacity>

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
                  <Text style={styles.resultadoPontuacao}>🎯 Você fez {resultado}%!</Text>

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

// =============== ESTILOS ===============
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F4F4F9",
  },
  scrollContainer: {
    padding: 16,
    paddingBottom: 100,
  },
  loader: {
    marginTop: 20,
  },
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
  naoResponderButton: {
    width: "90%",
    paddingVertical: 20,
    backgroundColor: "#FF3D00",
    marginVertical: 8,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    elevation: 3,
    alignSelf: "center",
  },
  selectedNaoResponder: {
    backgroundColor: "#FF6347",
  },
  naoResponderText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#FFF",
    textAlign: "center",
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
    fontSize: 26,
    fontWeight: "bold",
    color: "#FF4500",
    textAlign: "center",
    marginBottom: 20,
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
  explicacaoTexto: {
    marginTop: 5,
    fontSize: 14,
    fontWeight: "bold",
    color: "#d32f2f",
    textAlign: "left",
  },
  certaButton: {
    backgroundColor: "#4CAF50",
  },
  erradaButton: {
    backgroundColor: "#FF6347",
  },

  // -------------- ESTILOS PARA VISUALIZAÇÃO DO TESTE COMPLETO --------------
  scrollContainerFinal: {
    padding: 16,
    paddingBottom: 50,
  },
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

export default QuizPerguntasScreen;
