import React, { useEffect, useState } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Text,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useAuth } from "../context/AuthProvider";
import supabase from "../supabaseconfig";
import Header from "../componentes/header";

// Função para embaralhar array
const shuffleArray = (array) => array.sort(() => Math.random() - 0.5);

export default function ExerciciosPerguntasScreen({ route, navigation }) {
  const { user } = useAuth();
  // Recebemos selectedMaterias e iddisciplina
  const { selectedMaterias, iddisciplina } = route.params || {};

  // Lista total de perguntas
  const [perguntas, setPerguntas] = useState([]);
  // Index da pergunta atual
  const [currentIndex, setCurrentIndex] = useState(0);

  // Guardamos a alternativa selecionada (antes de submeter)
  const [alternativaSelecionada, setAlternativaSelecionada] = useState(null);

  // Guardamos as respostas submetidas: { [idpergunta]: { acertou: bool, resposta: idalternativa } }
  const [respostas, setRespostas] = useState({});

  // Modo principal: "resolvendo", "historico", "historicoDetalhe", "final"
  const [mode, setMode] = useState("resolvendo");
  // Em modo "historicoDetalhe", mostra 1 questão resolvida em tela cheia
  const [perguntaHistorico, setPerguntaHistorico] = useState(null);

  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  // -------------------------------------------
  // 1) Ao montar, buscar perguntas
  // -------------------------------------------
  useEffect(() => {
    if (!user) {
      Alert.alert("Sessão Expirada", "Por favor, faça login novamente.", [
        { text: "OK", onPress: () => navigation.replace("Login") },
      ]);
      return;
    }
    carregarPerguntas();
  }, []);

  const carregarPerguntas = async () => {
    try {
      setLoading(true);
      setErrorMessage("");

      const { data, error } = await supabase
        .from("perguntas")
        .select("idpergunta, texto, explicacao, alternativas(*)")
        .in("idmateria", selectedMaterias || []);

      if (error) {
        setErrorMessage("Erro ao carregar perguntas.");
        return;
      }
      if (!data || data.length === 0) {
        setErrorMessage("Não há perguntas para as matérias selecionadas.");
        return;
      }

      // Embaralhar perguntas e alternativas
      const embaralhadas = shuffleArray(data).map((p) => {
        p.alternativas = shuffleArray(p.alternativas);
        return p;
      });

      setPerguntas(embaralhadas);
      setCurrentIndex(0);
      setAlternativaSelecionada(null);
      setRespostas({});
      setMode("resolvendo");
    } catch (err) {
      console.error("Erro inesperado:", err);
      setErrorMessage("Erro ao carregar perguntas.");
    } finally {
      setLoading(false);
    }
  };

  // -------------------------------------------
  // 2) Ao resolver perguntas
  // -------------------------------------------
  const perguntaAtual = perguntas[currentIndex] || null;
  const feedAtual = perguntaAtual && respostas[perguntaAtual.idpergunta];
  const jaRespondeu = !!feedAtual;

  // Escolher uma alternativa (sem submeter)
  const handleSelecionarAlternativa = (idalt) => {
    if (!perguntaAtual || jaRespondeu) return;
    setAlternativaSelecionada(idalt);
  };

  // Submeter a resposta
  const handleSubmeter = () => {
    if (!perguntaAtual || alternativaSelecionada === null) {
      Alert.alert("Ops", "Selecione alguma alternativa antes de submeter.");
      return;
    }
    const altCorreta = perguntaAtual.alternativas.find((a) => a.correta);
    const acertou = altCorreta && altCorreta.idalternativa === alternativaSelecionada;

    setRespostas((prev) => ({
      ...prev,
      [perguntaAtual.idpergunta]: {
        acertou,
        resposta: alternativaSelecionada,
      },
    }));
  };

  // Próximo exercício
  const handleProximo = () => {
    if (currentIndex >= perguntas.length - 1) {
      setMode("final");
    } else {
      setCurrentIndex((prev) => prev + 1);
      setAlternativaSelecionada(null);
    }
  };

  // Ir para histórico
  const verHistorico = () => {
    setMode("historico");
  };

  // Voltar para resolvendo
  const voltarResolvendo = () => {
    setMode("resolvendo");
  };

  // Sair do fluxo (volta para a tela ExerciciosScreen)
  const sairResolucao = () => {
    navigation.navigate("ExerciciosScreen", { iddisciplina });
  };

  // -------------------------------------------
  // 3) Modo “historico” => apenas perguntas respondidas
  // -------------------------------------------
  const renderHistorico = () => {
    // Filtra perguntas respondidas
    const perguntasResolvidas = perguntas.filter((p) => respostas[p.idpergunta]);

    return (
      <View style={styles.container}>
        <Header />
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <Text style={styles.title}>Exercícios Resolvidos</Text>

          {perguntasResolvidas.length === 0 ? (
            <Text style={styles.infoText}>
              Ainda não há nenhum exercício respondido.
            </Text>
          ) : (
            perguntasResolvidas.map((p) => {
              const feed = respostas[p.idpergunta];
              return (
                <TouchableOpacity
                  key={`hist-${p.idpergunta}`}
                  style={styles.cardHistorico}
                  onPress={() => {
                    setPerguntaHistorico(p);
                    setMode("historicoDetalhe");
                  }}
                >
                  <Text style={styles.cardHistoricoText}>{p.texto}</Text>
                  {feed.acertou ? (
                    <Text style={[styles.cardHistoricoInfo, { color: "green" }]}>
                      ✔ Acertou
                    </Text>
                  ) : (
                    <Text style={[styles.cardHistoricoInfo, { color: "red" }]}>
                      ✘ Errou
                    </Text>
                  )}
                </TouchableOpacity>
              );
            })
          )}

          <TouchableOpacity style={styles.botaoVoltar} onPress={voltarResolvendo}>
            <Text style={styles.botaoVoltarText}>Voltar à Resolução</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    );
  };

  // -------------------------------------------
  // 4) Modo "historicoDetalhe" => exibe 1 pergunta respondida
  // -------------------------------------------
  const renderHistoricoDetalhe = () => {
    if (!perguntaHistorico) {
      setMode("historico");
      return null;
    }
    const feed = respostas[perguntaHistorico.idpergunta];
    if (!feed) {
      setMode("historico");
      return null;
    }

    const foiCerta = feed.acertou;
    const altMarcada = feed.resposta;
    const altCorreta = perguntaHistorico.alternativas.find((x) => x.correta);
    const textoMarcada =
      perguntaHistorico.alternativas.find((x) => x.idalternativa === altMarcada)?.texto ||
      "N/A";

    return (
      <View style={styles.container}>
        <Header />
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <Text style={styles.title}>Exercício Resolvido</Text>
          <View style={styles.perguntaContainer}>
            <Text style={styles.perguntaText}>{perguntaHistorico.texto}</Text>
          </View>

          <Text style={styles.historicoDetalheInfo}>
            Sua Resposta: {textoMarcada}
          </Text>
          {foiCerta ? (
            <Text style={[styles.historicoDetalheInfo, { color: "green" }]}>
              ✔ Você Acertou!
            </Text>
          ) : (
            <Text style={[styles.historicoDetalheInfo, { color: "red" }]}>
              ✘ Você Errou
            </Text>
          )}

          {/* Mostrar explicação mesmo se acertou */}
          {perguntaHistorico.explicacao && (
            <View style={styles.explicacaoContainer}>
              <Text style={styles.explicacaoTitle}>Explicação:</Text>
              <Text style={styles.explicacaoText}>{perguntaHistorico.explicacao}</Text>
            </View>
          )}

          <TouchableOpacity
            style={styles.botaoVoltar}
            onPress={() => {
              setPerguntaHistorico(null);
              setMode("historico");
            }}
          >
            <Text style={styles.botaoVoltarText}>Voltar ao Histórico</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    );
  };

  // -------------------------------------------
  // 5) Modo "final"
  // -------------------------------------------
  const renderFinal = () => {
    return (
      <View style={styles.container}>
        <Header />
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <Text style={styles.title}>Fim dos Exercícios</Text>
          <Text style={styles.infoText}>
            Você chegou ao fim da lista de exercícios.
          </Text>

          <TouchableOpacity style={styles.botaoGrande} onPress={sairResolucao}>
            <Text style={styles.botaoGrandeText}>Voltar à Página de Exercícios</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.botaoGrande} onPress={() => setMode("historico")}>
            <Text style={styles.botaoGrandeText}>Ver Exercícios Resolvidos</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    );
  };

  // -------------------------------------------
  // Render principal
  // -------------------------------------------
  if (loading) {
    return (
      <View style={styles.container}>
        <Header />
        <ActivityIndicator size="large" color="#0056b3" style={{ marginTop: 40 }} />
      </View>
    );
  }
  if (errorMessage) {
    return (
      <View style={styles.container}>
        <Header />
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <Text style={styles.errorText}>{errorMessage}</Text>
          <TouchableOpacity style={styles.botaoGrande} onPress={sairResolucao}>
            <Text style={styles.botaoGrandeText}>Sair da Resolução</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    );
  }

  // Alterna modos
  if (mode === "historico") {
    return renderHistorico();
  }
  if (mode === "historicoDetalhe") {
    return renderHistoricoDetalhe();
  }
  if (mode === "final") {
    return renderFinal();
  }

  // Modo "resolvendo"
  const pergunta = perguntas[currentIndex];
  if (!pergunta) {
    // Se chegou aqui sem perguntas, ou terminou
    return renderFinal();
  }

  const feed = respostas[pergunta.idpergunta];
  const jaRespondeu2 = !!feed;

  return (
    <View style={styles.container}>
      <Header />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>Exercício</Text>

        <View style={styles.perguntaContainer}>
          <Text style={styles.perguntaText}>{pergunta.texto}</Text>
        </View>

        <View style={styles.alternativasContainer}>
          {pergunta.alternativas.map((alt) => {
            const foiSelecionada = alternativaSelecionada === alt.idalternativa;
            const foiUsada = feed && feed.resposta === alt.idalternativa;

            let estiloBotao = [styles.altButton];
            if (jaRespondeu2 && foiUsada) {
              if (feed.acertou) estiloBotao.push(styles.altCerta);
              else estiloBotao.push(styles.altErrada);
            } else if (!jaRespondeu2 && foiSelecionada) {
              estiloBotao.push(styles.altSelecionada);
            }

            return (
              <TouchableOpacity
                key={`alt-${alt.idalternativa}`}
                style={estiloBotao}
                onPress={() => {
                  if (!jaRespondeu2) {
                    setAlternativaSelecionada(alt.idalternativa);
                  }
                }}
                disabled={jaRespondeu2}
              >
                <Text style={styles.altText}>{alt.texto}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Botão Submeter */}
        {!jaRespondeu2 && (
          <TouchableOpacity
            style={styles.botaoSubmeter}
            onPress={() => {
              if (!pergunta || alternativaSelecionada === null) {
                Alert.alert("Ops", "Selecione alguma alternativa antes de submeter.");
                return;
              }
              const altCorreta = pergunta.alternativas.find((a) => a.correta);
              const acertou = altCorreta && altCorreta.idalternativa === alternativaSelecionada;

              setRespostas((prev) => ({
                ...prev,
                [pergunta.idpergunta]: {
                  acertou,
                  resposta: alternativaSelecionada,
                },
              }));
            }}
          >
            <Text style={styles.botaoSubmeterText}>Submeter Resposta</Text>
          </TouchableOpacity>
        )}

        {/* Se já respondeu => mostra explicação (agora também se acertou) */}
        {jaRespondeu2 && pergunta.explicacao && (
          <View style={styles.explicacaoContainer}>
            <Text style={styles.explicacaoTitle}>Explicação:</Text>
            <Text style={styles.explicacaoText}>{pergunta.explicacao}</Text>
          </View>
        )}

        {/* Botão Próximo se já respondeu */}
        {jaRespondeu2 && (
          <TouchableOpacity style={styles.botaoProximo} onPress={handleProximo}>
            <Text style={styles.botaoProximoText}>Próximo Exercício</Text>
          </TouchableOpacity>
        )}

        {/* Botão "Ver Exercícios Resolvidos" se já respondeu pelo menos 1 */}
        {Object.keys(respostas).length > 0 && (
          <TouchableOpacity style={styles.botaoHistorico} onPress={() => setMode("historico")}>
            <Text style={styles.botaoHistoricoText}>Ver Exercícios Resolvidos</Text>
          </TouchableOpacity>
        )}

        {/* Botão Sair */}
        <TouchableOpacity style={styles.botaoSair} onPress={sairResolucao}>
          <Text style={styles.botaoSairText}>Sair da Resolução</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

// -------------------------------------------
// ESTILOS
// -------------------------------------------
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f7f7f7",
  },
  scrollContent: {
    padding: 16,
  },
  errorText: {
    fontSize: 16,
    color: "red",
    textAlign: "center",
    marginVertical: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#d32f2f",
    marginBottom: 20,
    textAlign: "center",
  },
  infoText: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
  },

  perguntaContainer: {
    backgroundColor: "#ddd",
    borderRadius: 10,
    padding: 20,
    marginBottom: 20,
  },
  perguntaText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    textAlign: "center",
  },

  alternativasContainer: {
    marginBottom: 20,
  },
  altButton: {
    backgroundColor: "#007AFF",
    borderRadius: 8,
    padding: 15,
    marginVertical: 5,
    alignItems: "center",
  },
  altText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#fff",
  },
  altSelecionada: {
    backgroundColor: "#00FFFF",
  },
  altCerta: {
    backgroundColor: "#4CAF50",
  },
  altErrada: {
    backgroundColor: "#FF6347",
  },

  botaoSubmeter: {
    backgroundColor: "#28A745",
    borderRadius: 8,
    padding: 15,
    alignItems: "center",
    marginBottom: 15,
  },
  botaoSubmeterText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },

  explicacaoContainer: {
    backgroundColor: "#f0f4ff",
    borderRadius: 8,
    padding: 10,
    marginBottom: 20,
  },
  explicacaoTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#d32f2f",
    marginBottom: 5,
  },
  explicacaoText: {
    fontSize: 14,
    color: "#444",
  },

  botaoProximo: {
    backgroundColor: "#007AFF",
    borderRadius: 8,
    padding: 15,
    alignItems: "center",
    marginBottom: 15,
  },
  botaoProximoText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },

  botaoHistorico: {
    backgroundColor: "#888",
    borderRadius: 8,
    padding: 15,
    alignItems: "center",
    marginBottom: 15,
  },
  botaoHistoricoText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },

  botaoSair: {
    backgroundColor: "#aaa",
    borderRadius: 8,
    padding: 15,
    alignItems: "center",
  },
  botaoSairText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },

  cardHistorico: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    elevation: 2,
  },
  cardHistoricoText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 5,
  },
  cardHistoricoInfo: {
    fontSize: 14,
    color: "#555",
  },
  botaoVoltar: {
    backgroundColor: "#007AFF",
    borderRadius: 8,
    padding: 15,
    alignItems: "center",
    marginTop: 15,
  },
  botaoVoltarText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },

  botaoGrande: {
    backgroundColor: "#0056b3",
    borderRadius: 8,
    padding: 15,
    alignItems: "center",
    marginBottom: 15,
    width: "100%",
  },
  botaoGrandeText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },

  historicoDetalheInfo: {
    fontSize: 15,
    color: "#666",
    marginBottom: 10,
  },
});
