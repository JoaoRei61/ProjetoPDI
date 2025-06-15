import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
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

  const [idUtilizador, setIdUtilizador] = useState(null);
  const [perguntas, setPerguntas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [respostasSelecionadas, setRespostasSelecionadas] = useState({});
  const [quizFinalizado, setQuizFinalizado] = useState(false);
  const [resultado, setResultado] = useState(null);
  const [mensagemResultado, setMensagemResultado] = useState("");
  const [pontos, setPontos] = useState(null);
  const [perguntaAtual, setPerguntaAtual] = useState(0);
  const [mostrarVisualizacao, setMostrarVisualizacao] = useState(false);
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

  // 2) Buscar perguntas filtradas por tipo_pergunta = "EM"
  useEffect(() => {
    const fetchPerguntas = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("perguntas")
        .select("*, alternativas(*)")
        .in("idmateria", selectedMaterias)
        .eq("tipo_pergunta", "EM")  // Filtrando apenas as perguntas do tipo "EM"
        .eq("visivel", true) 
        .limit(numPerguntas);

      if (error) {
        console.error("Erro ao buscar perguntas:", error);
      } else if (data?.length) {
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

    const porcentagem = ((respostasCorretas / perguntas.length) * 100).toFixed(2);
    setQuizFinalizado(true);
    setResultado(porcentagem);

    const acertos = respostasCorretas;
    const resolvidos = perguntas.length;
    const pontuacaoFormula = (acertos / resolvidos) * (acertos + resolvidos);
    setPontos(pontuacaoFormula.toFixed(2));

    definirMensagemResultado(porcentagem);

    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start();

    // 3.1) Inserir resultado do teste na tabela "testes"
    try {
      const numericIdDisc = iddisciplina ? parseInt(iddisciplina, 10) : null;

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

      const idteste = testeInserido.idteste;

      // 3.2) Inserir perguntas usadas no teste em "perguntas_teste"
      const listaPerguntasTeste = perguntas.map((pergunta) => {
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
  };

  const definirMensagemResultado = (nota) => {
    const notaNum = parseFloat(nota);
    if (notaNum >= 90) {
      setMensagemResultado("🎉 Parabéns! És um mestre!");
    } else if (notaNum >= 70) {
      setMensagemResultado("👏 Bom trabalho! Mas não está perfeito!");
    } else if (notaNum >= 50) {
      setMensagemResultado("🤔 Podes melhorar! Faz mais exames!");
    } else {
      setMensagemResultado("📚 Foi fraquinho... Estuda mais e faz mais exames!");
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

              {/* Exibindo a imagem dentro da div correta */}
              {pergunta.enunciado ? (
                <ScrollView
                maximumZoomScale={3}
                minimumZoomScale={1}
                showsHorizontalScrollIndicator={false}
                showsVerticalScrollIndicator={false}
                style={styles.imagemWrapper}
                contentContainerStyle={styles.imagemWrapperContent}
              >
                <Image
                  source={{ uri: pergunta.enunciado }}
                  style={styles.imagem}
                  resizeMode="contain"
                />
              </ScrollView>
              ) : (
                <Text style={styles.finalPerguntaTexto}>{pergunta.texto}</Text>
              )}

              {pergunta.alternativas.map((alternativa) => {
                const selecionada = respostaSelecionada === alternativa.idalternativa;
                const correta = alternativa.correta; // Supondo que tens este campo booleano
                let estilo = [styles.alternativaButtonFinal];

                if (selecionada && correta) {
                  estilo.push(styles.certaButton); // Caso especial onde o aluno acertou
                } else if (selecionada && !correta) {
                  estilo.push(styles.erradaButton); // A resposta errada escolhida
                } else if (!selecionada && correta && !acertou) {
                  estilo.push(styles.certaButton); // Mostrar a certa se o aluno errou
                }

                return (
                  <View key={`alt-${alternativa.idalternativa}`} style={estilo}>
                    <Text style={styles.alternativaTextFinal}>{alternativa.texto}</Text>
                  </View>
                );
              })}

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
          <Text style={styles.backButtonText}>Voltar</Text>
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
                      {/* Exibindo a imagem dentro da pergunta */}
                      {perguntas[perguntaAtual]?.enunciado ? (
                          <ScrollView
                            maximumZoomScale={3}
                            minimumZoomScale={1}
                            showsHorizontalScrollIndicator={false}
                            showsVerticalScrollIndicator={false}
                            style={styles.imagemWrapper}
                            contentContainerStyle={styles.imagemWrapperContent}
                          >
                            <Image
                              source={{ uri: perguntas[perguntaAtual]?.enunciado }}
                              style={styles.imagem}
                              resizeMode="contain"
                            />
                          </ScrollView>
                        ) : (
                          <Text style={styles.perguntaText}>
                            {perguntas[perguntaAtual]?.texto}
                          </Text>
                        )}


                    </Text>
                  </View>

                  
                  <View style={styles.respostasContainer}>
                    {perguntas[perguntaAtual]?.alternativas.map((alternativa) => (
                      <TouchableOpacity
                        key={`alt-${alternativa.idalternativa}`}
                        style={[styles.alternativaButton, respostasSelecionadas[perguntas[perguntaAtual]?.idpergunta] === alternativa.idalternativa && styles.selectedAnswer]}
                        onPress={() =>
                          handleRespostaSelecionada(perguntas[perguntaAtual]?.idpergunta, alternativa.idalternativa)
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
                  <View style={styles.resultadoCard}>
                    <Text style={styles.title}>🎓 Exame Finalizado</Text>
                    <Text style={styles.resultadoTexto}>{mensagemResultado}</Text>
                    <Text style={styles.resultadoPontuacao}>Resultado: {resultado}%</Text>
                    {pontos !== null && (
                      <Text style={styles.pontosText}>
                        ⭐ Ganhaste {pontos} pontos no ranking global!
                      </Text>
                    )}
                  </View>


                  <TouchableOpacity style={styles.closeButton} onPress={() => navigation.goBack()}>
                    <Text style={styles.closeButtonText}>Voltar</Text>
                  </TouchableOpacity>

                  <TouchableOpacity style={styles.closeButton} onPress={VisualizarTesteFinal}>
                    <Text style={styles.closeButtonText}>Visualizar Teste</Text>
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
  resultadoCard: {
    backgroundColor: "#ffffff",
    padding: 20,
    borderRadius: 16,
    marginBottom: 24,
    marginTop: 20,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },
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
  imagemWrapper: {
  width: '100%',
  maxHeight: 300,
  marginBottom: 15,
  borderRadius: 10,
  backgroundColor: "#f2f2f2",
  alignSelf: "center",
},
  imagemWrapperContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  perguntaContainer: {
    height: 200,
    width: "100%",
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
    marginTop: 16,
    marginBottom: 16,
    gap: 10,
  },
  alternativaButton: {
    width: "90%",
    paddingVertical: 18,
    backgroundColor:  "#e3f2fd",
    marginVertical: 10,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },

  alternativaText: {
    fontSize: 17,
    fontWeight: "bold",
    color: "#0d47a1",
    textAlign: "center",
  },
  selectedAnswer: {
    backgroundColor: "#00FFFF",
    borderColor: "#00FFFF",
    borderWidth: 2,
  },
  nextButton: {
   backgroundColor: "#0056b3",
    borderRadius: 8,
    padding: 15,
    alignItems: "center",
    marginBottom: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  nextButtonText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "rgb(253, 253, 255)",
  },
  resultadoTexto: {
    fontSize: 20,
    fontWeight: "600",
    textAlign: "center",
    marginBottom: 12,
    color: "#1a237e",
  },
  resultadoPontuacao: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#4CAF50",
    textAlign: "center",
    marginBottom: 10,
  },
  pontosText: {
    fontSize: 18,
    fontWeight: "600",
    textAlign: "center",
    color: "#37474f",
  },
  closeButton: {
    backgroundColor: "#0056b3",
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 14,
    marginVertical: 10,
    width: "90%",
    alignSelf: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  closeButtonText: {
  color: "#ffffff",
  fontSize: 16,
  fontWeight: "600",
  textTransform: "bold",
},

 imagem: {
  width: "100%",
  height: 300,
  resizeMode: "contain",
  borderRadius: 10,
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
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 16,
    marginVertical: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 4,
  },
  finalPerguntaTitulo: {
    ontSize: 17,
    fontWeight: "700",
    color: "#1a237e",
    marginBottom: 10,
  },
  alternativaButtonFinal: {
    padding: 12,
    borderRadius: 12,
    backgroundColor: "#e3f2fd",
    marginVertical: 6,
  },
  alternativaTextFinal: {
    fontSize: 15,
    color: "#0d47a1",
  },
  certaButton: {
    backgroundColor: "#c8e6c9", // verde claro
    borderWidth: 1,
    borderColor: "#388e3c",
  },
  erradaButton: {
    backgroundColor: "#ffcdd2", // vermelho claro
    borderWidth: 1,
    borderColor: "#d32f2f",
  },
  finalExplicacaoContainer: {
    marginTop: 14,
    padding: 12,
    backgroundColor: "#e8f5e9",
    borderRadius: 10,
    borderLeftWidth: 5,
    borderLeftColor: "#4caf50",
  },
  explicacaoTextoFinal: {
    fontSize: 14,
    color: "#2e7d32",
    fontStyle: "italic",
  },
  backButton: {
    backgroundColor: "#0056b3",
    paddingVertical: 14,
    borderRadius: 14,
    marginVertical: 20,
    marginHorizontal: 50,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  backButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
});

export default ExamesPerguntasScreen;
