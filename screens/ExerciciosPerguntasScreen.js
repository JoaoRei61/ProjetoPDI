import React, { useEffect, useState } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Text,
  Alert,
  Image,
} from "react-native";
import { useAuth } from "../context/AuthProvider";
import supabase from "../supabaseconfig";
import Header from "../componentes/header";
import LoadingScreen from "../screens/LoadingScreen";


const shuffleArray = (array) => array.sort(() => Math.random() - 0.5);

const registarResolucao = async ({ userId, perguntaId, idmateria, correta }) => {
  try {
    const { data: existente, error: erroExistente } = await supabase
      .from("resolucao")
      .select("correta")
      .eq("idutilizador", userId)
      .eq("idpergunta", perguntaId)
      .single();

    if (erroExistente && erroExistente.code !== "PGRST116") {
      console.error("Erro ao verificar resolução:", erroExistente);
      return;
    }

    if (existente) {
      if (existente.correta) return;
      if (correta) {
        await supabase
          .from("resolucao")
          .update({ correta: true })
          .eq("idutilizador", userId)
          .eq("idpergunta", perguntaId);
      }
    } else {
      await supabase.from("resolucao").insert([
        { idutilizador: userId, idpergunta: perguntaId, idmateria, correta }
      ]);
    }
  } catch (err) {
    console.error("Erro ao registar resolução:", err);
  }
};

export default function ExerciciosPerguntasScreen({ route, navigation }) {
  const { user } = useAuth();
  const { selectedMaterias, iddisciplina } = route.params || {};
  const [perguntas, setPerguntas] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [alternativaSelecionada, setAlternativaSelecionada] = useState(null);
  const [respostas, setRespostas] = useState({});
  const [mode, setMode] = useState("resolvendo");
  const [perguntaHistorico, setPerguntaHistorico] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [showResolucao, setShowResolucao] = useState(false);
  


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
      setLoading(true); // ativa o loading
      setErrorMessage("");
      const { data, error } = await supabase
        .from("perguntas")
        .select("idpergunta, enunciado, tipo_pergunta, idmateria, texto, explicacao,resolucao, alternativas(*)")
        .in("idmateria", selectedMaterias || []);
  
      if (error) {
        setErrorMessage("Erro ao carregar perguntas.");
        return;
      }
      if (!data.length) {
        setErrorMessage("Não há perguntas para as matérias selecionadas.");
        return;
      }
  
      setPerguntas(shuffleArray(data).map(p => ({
        ...p,
        alternativas: shuffleArray(p.alternativas)
      })));
      setCurrentIndex(0);
      setAlternativaSelecionada(null);
      setRespostas({});
      setMode("resolvendo");
    } catch {
      setErrorMessage("Erro ao carregar perguntas.");
    } finally {
      setLoading(false); // desativa o loading
    }
  };
  
  const perguntaAtual = perguntas[currentIndex] || null;
  const feedAtual = perguntaAtual && respostas[perguntaAtual.idpergunta];
  const jaRespondeu = !!feedAtual;

  const handleSelecionarAlternativa = (idalt) => {
    if (!perguntaAtual || jaRespondeu) return;
    setAlternativaSelecionada(idalt);
  };

  const handleSubmeter = async () => {
    if (!perguntaAtual || alternativaSelecionada === null) {
      Alert.alert("Ops", "Selecione alguma alternativa antes de submeter.");
      return;
    }
    const altCorreta = perguntaAtual.alternativas.find(a => a.correta);
    const acertou = altCorreta.idalternativa === alternativaSelecionada;

    setRespostas(prev => ({
      ...prev,
      [perguntaAtual.idpergunta]: { acertou, resposta: alternativaSelecionada }
    }));

    await registarResolucao({
      userId: user.id,
      perguntaId: perguntaAtual.idpergunta,
      idmateria: perguntaAtual.idmateria,
      correta: acertou,
    });
  };

  const handleProximo = () => {
    if (currentIndex >= perguntas.length - 1) setMode("final");
    else {
      setCurrentIndex(i => i + 1);
      setAlternativaSelecionada(null);
    }
  };

  const verHistorico = () => setMode("historico");
  const voltarResolvendo = () => setMode("resolvendo");
  const sairResolucao = () => navigation.navigate("ExerciciosScreen", { iddisciplina });

  const renderHistorico = () => {
    const resolvidas = perguntas.filter(p => respostas[p.idpergunta]);
    return (
      <View style={styles.container}>
        <Header />
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <Text style={styles.title}>Exercícios Resolvidos</Text>
  
          {resolvidas.length === 0
            ? (
              <Text style={styles.infoText}>
                Ainda não há nenhum exercício respondido.
              </Text>
            )
            : (
              resolvidas.map(p => {
                const feed = respostas[p.idpergunta];
                return (
                  <TouchableOpacity
                    key={p.idpergunta}
                    style={styles.cardHistorico}
                    onPress={() => {
                      setPerguntaHistorico(p);
                      setMode("historicoDetalhe");
                    }}
                  >
                    {/* –– Aqui mostramos a pergunta em si –– */}
                    {p.enunciado
                      ? (
                        <Image
                          source={{ uri: p.enunciado }}
                          style={styles.cardHistoricoImage}
                          resizeMode="contain"
                        />
                      )
                      : (
                        <Text style={styles.cardHistoricoText}>
                          {p.texto}
                        </Text>
                      )
                    }
  
                    {/* –– Aqui mostramos o status Acertou/Errou –– */}
                    <Text
                      style={[
                        styles.cardHistoricoInfo,
                        { color: feed.acertou ? "green" : "red" }
                      ]}
                    >
                      {feed.acertou ? "✔ Acertou" : "✘ Errou"}
                    </Text>
                  </TouchableOpacity>
                );
              })
            )
          }
  
          <TouchableOpacity
            style={styles.botaoVoltar}
            onPress={voltarResolvendo}
          >
            <Text style={styles.botaoVoltarText}>
              Voltar à Resolução
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    );
  };
  

  const renderHistoricoDetalhe = () => {
    if (!perguntaHistorico) return renderHistorico();
    const feed = respostas[perguntaHistorico.idpergunta];
    const acertou = feed.acertou;
    const marcada = feed.resposta;
    const textoMarcada = perguntaHistorico.alternativas.find(a => a.idalternativa === marcada)?.texto || "N/A";

    return (
      <View style={styles.container}>
        <Header />
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <Text style={styles.title}>Exercício Resolvido</Text>
          <View style={styles.perguntaContainer}>
            {perguntaHistorico.enunciado ? (
              <Image source={{ uri: perguntaHistorico.enunciado }} style={styles.imagemEnunciado} resizeMode="contain" />
            ) : (
              <Text style={styles.perguntaText}>{perguntaHistorico.texto}</Text>
            )}
          </View>
          <Text style={styles.historicoDetalheInfo}>Sua Resposta: {textoMarcada}</Text>
          <Text style={[styles.historicoDetalheInfo, { color: acertou ? "green" : "red" }]}>
            {acertou ? "✔ Você Acertou!" : "✘ Você Errou"}
          </Text>
          {perguntaHistorico.explicacao && (
            <View style={styles.explicacaoContainer}>
              <Text style={styles.explicacaoTitle}>Explicação:</Text>
              <Text style={styles.explicacaoText}>{perguntaHistorico.explicacao}</Text>
            </View>
          )}
          <TouchableOpacity style={styles.botaoVoltar} onPress={verHistorico}>
            <Text style={styles.botaoVoltarText}>Voltar ao Histórico</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    );
  };

  const renderFinal = () => (
    <View style={styles.container}>
      <Header />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>Fim dos Exercícios</Text>
        <Text style={styles.infoText}>Você chegou ao fim da lista de exercícios.</Text>
        <TouchableOpacity style={styles.botaoGrande} onPress={sairResolucao}>
          <Text style={styles.botaoGrandeText}>Voltar à Página de Exercícios</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.botaoGrande} onPress={verHistorico}>
          <Text style={styles.botaoGrandeText}>Ver Exercícios Resolvidos</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );

  if (loading) {
    return <LoadingScreen onFinish={null} />;
  }
  if (errorMessage) {
    return <LoadingScreen onFinish={null} />;
  }
  if (mode === "historico") return renderHistorico();
  if (mode === "historicoDetalhe") return renderHistoricoDetalhe();
  if (mode === "final") return renderFinal();

  if (!perguntaAtual) return renderFinal();
  const jaResp = jaRespondeu;

  return (
    <View style={styles.container}>
      <Header />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>Exercício</Text>
        {/*
  Se for pergunta de desenvolvimento (tipo ≠ "EM"), sempre mostramos o botão.
  Se for tipo "EM", só após o utilizador ter submetido (jaResp === true).
*/}



        <View style={styles.perguntaContainer}>
          {perguntaAtual.enunciado ? (
            <ScrollView
              maximumZoomScale={3}
              minimumZoomScale={1}
              showsHorizontalScrollIndicator={false}
              showsVerticalScrollIndicator={false}
              style={{ maxHeight: 300 }}
              contentContainerStyle={{ alignItems: "center", justifyContent: "center" }}
            >
              <Image
                source={{ uri: perguntaAtual.enunciado }}
                style={{ width: 300, height: 300 }}
                resizeMode="contain"
              />
            </ScrollView>
          ) : (
            <Text style={styles.perguntaText}>{perguntaAtual.texto}</Text>
          )}
        </View>
        {(perguntaAtual.tipo_pergunta !== "EM" || jaResp) && (
  <>
    <TouchableOpacity
      style={styles.botaoResolucao}
      onPress={() => setShowResolucao(s => !s)}
    >
      <Text style={styles.botaoResolucaoText}>
        {showResolucao ? "Ocultar Resolução" : "Mostrar Resolução"}
      </Text>
    </TouchableOpacity>

    {showResolucao && perguntaAtual && (
      <View style={styles.resolucaoContainer}>
        {perguntaAtual.resolucao
          ? (
            <Image
              source={{ uri: perguntaAtual.resolucao }}
              style={styles.resolucaoImage}
              resizeMode="contain"
            />
          )
          : (
            <Text style={styles.resolucaoText}>
              {perguntaAtual.explicacao}
            </Text>
          )
        }
      </View>
    )}
  </>
)}


        {perguntaAtual.tipo_pergunta === "EM" ? (
          <>
            <View style={styles.alternativasContainer}>
              {perguntaAtual.alternativas.map(alt => {
                const sel = alternativaSelecionada === alt.idalternativa;
                const usado = jaResp && feedAtual.resposta === alt.idalternativa;
                let btn = [styles.altButton];
                if (usado) btn.push(feedAtual.acertou ? styles.altCerta : styles.altErrada);
                else if (sel) btn.push(styles.altSelecionada);
                return (
                  <TouchableOpacity
                    key={alt.idalternativa}
                    style={btn}
                    onPress={() => handleSelecionarAlternativa(alt.idalternativa)}
                    disabled={jaResp}
                  >
                    <Text style={styles.altText}>{alt.texto}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            {!jaResp && (
              <TouchableOpacity style={styles.botaoSubmeter} onPress={handleSubmeter}>
                <Text style={styles.botaoSubmeterText}>Submeter Resposta</Text>
              </TouchableOpacity>
            )}
          </>
        ) : (
          !jaResp && (
            <View style={{ gap: 10, marginBottom: 20 }}>
              <Text style={{ textAlign: "center", marginBottom: 10, fontWeight: "bold" }}>
                Como correu a tua resposta?
              </Text>
              <TouchableOpacity
                style={[styles.altButton, { backgroundColor: "#4CAF50" }]}
                onPress={async () => {
                  setRespostas(p => ({
                    ...p,
                    [perguntaAtual.idpergunta]: { acertou: true, resposta: "acertou" }
                  }));
                  await registarResolucao({
                    userId: user.id,
                    perguntaId: perguntaAtual.idpergunta,
                    idmateria: perguntaAtual.idmateria,
                    correta: true,
                  });
                }}
              >
                <Text style={styles.altText}>Acertei</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.altButton, { backgroundColor: "#f0ad4e" }]}
                onPress={async () => {
                  setRespostas(p => ({
                    ...p,
                    [perguntaAtual.idpergunta]: { acertou: false, resposta: "incompleto" }
                  }));
                  await registarResolucao({
                    userId: user.id,
                    perguntaId: perguntaAtual.idpergunta,
                    idmateria: perguntaAtual.idmateria,
                    correta: false,
                  });
                }}
              >
                <Text style={styles.altText}>Incompleto</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.altButton, { backgroundColor: "#FF6347" }]}
                onPress={async () => {
                  setRespostas(p => ({
                    ...p,
                    [perguntaAtual.idpergunta]: { acertou: false, resposta: "errou" }
                  }));
                  await registarResolucao({
                    userId: user.id,
                    perguntaId: perguntaAtual.idpergunta,
                    idmateria: perguntaAtual.idmateria,
                    correta: false,
                  });
                }}
              >
                <Text style={styles.altText}>Errei</Text>
              </TouchableOpacity>
            </View>
          )
        )}

        {jaResp && perguntaAtual.explicacao && (
          <View style={styles.explicacaoContainer}>
            <Text style={styles.explicacaoTitle}>Explicação:</Text>
            <Text style={styles.explicacaoText}>{perguntaAtual.explicacao}</Text>
          </View>
        )}
        {jaResp && (
          <TouchableOpacity style={styles.botaoProximo} onPress={handleProximo}>
            <Text style={styles.botaoProximoText}>Próximo Exercício</Text>
          </TouchableOpacity>
        )}
        {Object.keys(respostas).length > 0 && (
          <TouchableOpacity style={styles.botaoHistorico} onPress={verHistorico}>
            <Text style={styles.botaoHistoricoText}>Ver Exercícios Resolvidos</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity style={styles.botaoSair} onPress={sairResolucao}>
          <Text style={styles.botaoSairText}>Sair da Resolução</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

// (Aqui removi apenas a definição de `const styles = StyleSheet.create({...})`)


// -------------------------------------------
// ESTILOS
// -------------------------------------------
const styles = StyleSheet.create({
  cardHistoricoImage: {
    width: "100%",
    height: 100,
    marginBottom: 8,
    borderRadius: 8,
  },

  botaoResolucao: {
    backgroundColor: "#A97AD4",    
    paddingVertical: 8,            
    paddingHorizontal: 16,         
    borderRadius: 12,             
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 10,

    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,                  
  },
  botaoResolucaoText: {
    color: "#FFF",                 
    fontSize: 14,                  
    fontWeight: "600",             
  },
  resolucaoContainer: {
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 10,
    marginVertical: 20,
    alignItems: "center",
  },
  resolucaoImage: {
    width: "100%",
    height: 200,
    borderRadius: 8,
    backgroundColor: "#fff",
  },
  resolucaoText: {
    fontSize: 14,
    color: "#444",
    textAlign: "center",
  },
  
  container: {
    flex: 1,
    backgroundColor: "#f7f7f7",
  },
  imagemEnunciado: {
    width: "100%",
    height: 200,
    borderRadius: 8,
    marginBottom: 10,
    backgroundColor: "#fff",
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
})
