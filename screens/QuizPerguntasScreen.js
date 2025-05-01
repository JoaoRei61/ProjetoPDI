import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  Button,
  ActivityIndicator,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert
} from "react-native";
import { Appbar, Checkbox } from "react-native-paper";
import supabase from "../supabaseconfig";

const shuffleArray = (array) => {
  return array.sort(() => Math.random() - 0.5);
};

const QuizPerguntasScreen = ({ route, navigation }) => {
  const { selectedMaterias, numPerguntas } = route.params;
  const [perguntas, setPerguntas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [respostasSelecionadas, setRespostasSelecionadas] = useState({});
  const [resultado, setResultado] = useState(null);
  const [quizFinalizado, setQuizFinalizado] = useState(false);
  const scrollViewRef = useRef(null);
  const perguntaRefs = useRef({});

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

  const handleRespostaSelecionada = (idpergunta, idalternativa) => {
    if (quizFinalizado) return;
    setRespostasSelecionadas((prev) => ({
      ...prev,
      [idpergunta]: idalternativa,
    }));
  };

  const handleNaoPretendoResponder = (idpergunta) => {
    if (quizFinalizado) return;
    setRespostasSelecionadas((prev) => ({
      ...prev,
      [idpergunta]: "nao_responder",
    }));
  };

  const verificarRespostas = async () => {
    if (quizFinalizado) return;

    const perguntasSemResposta = perguntas.filter(
      (pergunta) => !respostasSelecionadas[pergunta.idpergunta]
    );

    if (perguntasSemResposta.length > 0) {
      const primeiraNaoRespondida = perguntasSemResposta[0].idpergunta;

      Alert.alert(
        "Pergunta não respondida",
        "Por favor, responda todas as perguntas ou marque 'Não pretendo responder'."
      );

      if (perguntaRefs.current[primeiraNaoRespondida]) {
        perguntaRefs.current[primeiraNaoRespondida].measureLayout(
          scrollViewRef.current.getInnerViewNode(),
          (_x, y) => {
            scrollViewRef.current.scrollTo({ y, animated: true });
          }
        );
      }

      return;
    }

    let respostasCorretas = 0;
    const resultadosDetalhados = perguntas.map((pergunta) => {
      const respostaSelecionada = respostasSelecionadas[pergunta.idpergunta];
      const alternativaCorreta = pergunta.alternativas.find(
        (alternativa) => alternativa.correta
      );

      const correta = respostaSelecionada === alternativaCorreta?.idalternativa;
      if (correta) respostasCorretas++;

      return {
        ...pergunta,
        correta,
        respostaSelecionada,
      };
    });

    const porcentagem = ((respostasCorretas / perguntas.length) * 100).toFixed(2);
    setResultado({ porcentagem, detalhes: resultadosDetalhados });
    setQuizFinalizado(true);

    // ⚡ Obter utilizador autenticado
    const user = supabase.auth.user();
    const idutilizador = user?.id;

    if (!idutilizador) {
      Alert.alert("Erro", "Utilizador não autenticado.");
      return;
    }

    // ⚡ Inserir resultado na tabela 'quizzes'
    const { data, error } = await supabase.from("quizzes").insert([
      {
        idutilizador,
        pontuacao: porcentagem,
        data_criacao: new Date().toISOString(),
      },
    ]);

    if (error) {
      console.error("Erro ao guardar resultado do quiz:", error);
      Alert.alert("Erro", "Não foi possível guardar o resultado do quiz.");
    } else {
      console.log("Resultado do quiz guardado com sucesso:", data);
    }
  };

  if (loading) {
    return (
      <ActivityIndicator size="large" color="#6200ea" style={styles.loader} />
    );
  }

  return (
    <View style={styles.container}>
      <Appbar.Header style={styles.appbar}>
        <Appbar.Action icon="arrow-left" onPress={() => navigation.goBack()} />
        <Appbar.Content title="Quiz" />
      </Appbar.Header>

      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        ref={scrollViewRef}
      >
        <Text style={styles.title}>Perguntas do Quiz</Text>

        {perguntas.length > 0 ? (
          perguntas.map((pergunta) => {
            const naoRespondida =
              !respostasSelecionadas[pergunta.idpergunta] && quizFinalizado;

            const respostaSelecionada = respostasSelecionadas[pergunta.idpergunta];
            const alternativaCorreta = pergunta.alternativas.find(
              (alternativa) => alternativa.correta
            );
            const correta =
              respostaSelecionada === alternativaCorreta?.idalternativa;

            return (
              <View
                key={pergunta.idpergunta}
                style={[
                  styles.perguntaContainer,
                  naoRespondida && styles.naoRespondidaContainer,
                  quizFinalizado &&
                    (correta
                      ? styles.perguntaCorreta
                      : styles.perguntaErrada),
                ]}
                ref={(ref) => (perguntaRefs.current[pergunta.idpergunta] = ref)}
              >
                <Text style={styles.perguntaText}>{pergunta.texto}</Text>

                {naoRespondida && (
                  <Text style={styles.alertaNaoRespondida}>
                    Responda à pergunta
                  </Text>
                )}

                {pergunta.alternativas.map((alternativa) => {
                  const correta =
                    respostaSelecionada === alternativa.idalternativa &&
                    alternativa.correta;
                  const errada =
                    respostaSelecionada === alternativa.idalternativa &&
                    !alternativa.correta;

                  return (
                    <TouchableOpacity
                      key={alternativa.idalternativa}
                      style={[
                        styles.alternativaButton,
                        respostasSelecionadas[pergunta.idpergunta] ===
                          alternativa.idalternativa && styles.selectedAnswer,
                        quizFinalizado &&
                          (correta
                            ? styles.alternativaCorreta
                            : errada && styles.alternativaErrada),
                      ]}
                      onPress={() =>
                        handleRespostaSelecionada(
                          pergunta.idpergunta,
                          alternativa.idalternativa
                        )
                      }
                      disabled={quizFinalizado}
                    >
                      <Text style={styles.alternativaText}>
                        {alternativa.texto}
                      </Text>
                    </TouchableOpacity>
                  );
                })}

                {!quizFinalizado && (
                  <View style={styles.checkboxContainer}>
                    <Checkbox
                      status={
                        respostasSelecionadas[pergunta.idpergunta] ===
                        "nao_responder"
                          ? "checked"
                          : "unchecked"
                      }
                      onPress={() =>
                        handleNaoPretendoResponder(pergunta.idpergunta)
                      }
                    />
                    <Text>Não pretendo responder</Text>
                  </View>
                )}

                {quizFinalizado && (
                  <View>
                    <Text style={styles.explicacaoTitle}>Explicação:</Text>
                    <Text style={styles.explicacaoText}>
                      {pergunta.explicacao}
                    </Text>
                  </View>
                )}
              </View>
            );
          })
        ) : (
          <Text style={styles.noPerguntas}>
            Não há perguntas disponíveis para o quiz.
          </Text>
        )}

        {!quizFinalizado && (
          <View style={styles.submitButtonContainer}>
            <Button title="Submeter" onPress={verificarRespostas} />
          </View>
        )}

        {quizFinalizado && resultado && (
          <View style={styles.resultadoContainer}>
            <Text style={styles.resultadoText}>
              Resultado Final: {resultado.porcentagem}% de acertos
            </Text>
            <TouchableOpacity
              style={styles.novoQuizButton}
              onPress={() => navigation.goBack()}
            >
              <Text style={styles.novoQuizButtonText}>Voltar e Criar Novo Quiz</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f7f7f7" },
  appbar: { backgroundColor: "#6200ea", elevation: 4 },
  loader: { marginTop: 20 },
  scrollContainer: { padding: 16, paddingBottom: 100 },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    color: "#6200ea",
  },
  perguntaContainer: {
    backgroundColor: "#ffffff",
    marginBottom: 16,
    borderRadius: 8,
    padding: 16,
    elevation: 2,
  },
  naoRespondidaContainer: {
    borderColor: "#d32f2f",
    borderWidth: 2,
  },
  perguntaText: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
    color: "#333",
  },
  alertaNaoRespondida: {
    color: "#d32f2f",
    fontWeight: "bold",
    marginBottom: 8,
  },
  alternativaButton: {
    backgroundColor: "#6200ea",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 10,
  },
  alternativaText: { color: "#fff", fontSize: 16, textAlign: "center" },
  selectedAnswer: { backgroundColor: "#03a9f4" },
  alternativaCorreta: { backgroundColor: "#4caf50" },
  alternativaErrada: { backgroundColor: "#f44336" },
  perguntaCorreta: { borderColor: "#4caf50", borderWidth: 2 },
  perguntaErrada: { borderColor: "#f44336", borderWidth: 2 },
  noPerguntas: { textAlign: "center", fontSize: 18, color: "#888" },
  submitButtonContainer: {
    marginTop: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  novoQuizButton: {
    backgroundColor: "#6200ea",
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 20,
  },
  novoQuizButtonText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
  resultadoContainer: {
    marginTop: 20,
    padding: 16,
    backgroundColor: "#e0f7fa",
    borderRadius: 8,
    alignItems: "center",
  },
  resultadoText: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#00796b",
  },
  explicacaoTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginTop: 10,
    color: "#d32f2f",
  },
  explicacaoText: { fontSize: 14, color: "#333" },
  checkboxContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
  },
});

export default QuizPerguntasScreen;
