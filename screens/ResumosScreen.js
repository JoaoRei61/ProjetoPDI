import React, { useEffect, useState } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import LoadingScreen from "../screens/LoadingScreen";
import { useAuth } from "../context/AuthProvider";
import Header from "../componentes/header";
import { Ionicons } from '@expo/vector-icons';

const TABELA_RESUMOS = "resumos";

export default function ResumosScreen({ route, navigation }) {
  const { supabase, user, loading } = useAuth();
  const [mostrarAnos, setMostrarAnos] = useState(false);
  const { iddisciplina } = route.params || {};
  const [anoSelecionado, setAnoSelecionado] = useState(null);
  const [semestreSelecionado, setSemestreSelecionado] = useState(null);
  const [disciplinas, setDisciplinas] = useState([]);
  const [disciplinaSelecionada, setDisciplinaSelecionada] = useState(null);
  const [resumos, setResumos] = useState([]);
  const [loadingData, setLoadingData] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [userInfo, setUserInfo] = useState(null);

  useEffect(() => {
    if (!user && !loading) {
      Alert.alert("Sessão Expirada", "Por favor, faça login novamente.", [
        { text: "OK", onPress: () => navigation.replace("Login") },
      ]);
      return;
    }
    if (user) {
      buscarUserInfo(user.id);
    } else {
      setLoadingData(false);
    }
  }, [user]);

  const buscarUserInfo = async (userId) => {
    try {
      setLoadingData(true);
      const { data, error } = await supabase
        .from("utilizadores")
        .select("idcurso")
        .eq("id", userId)
        .single();

      if (error || !data) {
        console.log("Erro ao buscar userInfo:", error);
        setErrorMessage("Não foi possível carregar o seu curso.");
      } else {
        setUserInfo(data);
      }
    } catch (err) {
      console.log("Exception ao buscar userInfo:", err);
      setErrorMessage("Erro ao buscar dados do utilizador.");
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    if (anoSelecionado && semestreSelecionado) {
      carregarDisciplinas(anoSelecionado, semestreSelecionado);
    }
  }, [anoSelecionado, semestreSelecionado]);

  useEffect(() => {
    const carregarTudo = async () => {
      setLoadingData(true);
      setLoadingData(false);
    };
    carregarTudo();
    if (iddisciplina) {
      buscarDisciplinaESelecionar(iddisciplina);
    }
  }, [iddisciplina]);

  const buscarDisciplinaESelecionar = async (idd) => {
    try {
      setLoadingData(true);
      const { data, error } = await supabase
        .from("disciplinas")
        .select("*")
        .eq("iddisciplina", idd)
        .single();

      if (error) {
        console.error("Erro ao buscar disciplina:", error);
        setErrorMessage("Erro ao carregar disciplina recebida por parâmetro.");
      } else if (data) {
        setDisciplinaSelecionada(data);
        carregarResumos(data.iddisciplina);
      }
    } catch (err) {
      console.error("Erro inesperado ao buscar disciplina:", err);
      setErrorMessage("Erro ao obter disciplina.");
    } finally {
      setLoadingData(false);
    }
  };

  const carregarDisciplinas = async (ano, semestre) => {
    if (!userInfo?.idcurso) {
      setErrorMessage("Não foi possível identificar o curso do utilizador.");
      return;
    }
    try {
      setLoadingData(true);
      setDisciplinaSelecionada(null);
      setResumos([]);
      setErrorMessage("");

      const { data, error } = await supabase
        .from("curso_disciplina")
        .select(`
          iddisciplina,
          disciplinas (
            iddisciplina,
            nome
          )
        `)
        .eq("idcurso", userInfo.idcurso)
        .eq("ano", ano)
        .eq("semestre", semestre);

      if (error) {
        console.error("Erro ao buscar disciplinas:", error);
        setErrorMessage("Erro ao carregar disciplinas.");
      } else if (!data || data.length === 0) {
        setDisciplinas([]);
        setErrorMessage("Sem disciplinas para este ano e semestre.");
      } else {
        const arr = data.map((item) => ({
          iddisciplina: item.disciplinas?.iddisciplina || 0,
          nome: item.disciplinas?.nome || "Sem Nome",
          ano,
          semestre,
        }));
        setDisciplinas(arr);
      }
    } catch (err) {
      console.error("Erro ao carregar disciplinas:", err);
      setErrorMessage("Erro ao carregar disciplinas.");
    } finally {
      setLoadingData(false);
    }
  };

  const carregarResumos = async (idd) => {
    try {
      setLoadingData(true);
      setErrorMessage("");
      setResumos([]);

      const { data: resumosData, error: resumosError } = await supabase
        .from(TABELA_RESUMOS)
        .select(`
          idresumo,
          iddisciplina,
          ficheiro,
          titulo,
          idutilizador,
          idmateria,
          data_envio,
          estado,
          materias: idmateria (nome),
          utilizadores: idutilizador (nome, tipo_conta)
        `)
        .eq("iddisciplina", idd)
        .eq("estado", "aprovado");

      if (resumosError) {
        console.error("Erro ao buscar resumos:", resumosError);
        setErrorMessage("Erro ao carregar resumos.");
        return;
      }

      

      const arrResumos = resumosData.map((res) => {
        let autorTipo = "desconhecido";
        if (
          res.utilizadores?.tipo_conta === "professor" ||
          res.utilizadores?.tipo_conta === "docente"
        ) {
          autorTipo = "professor";
        } else if (res.utilizadores?.tipo_conta === "aluno") {
          autorTipo = "aluno";
        }

        const autorColor = autorTipo === "aluno" ? "blue" : "red";
        return {
          ...res,
          materiaNome: res.materias?.nome || "Sem matéria",
          autorNome: res.utilizadores?.nome || "Desconhecido",
          autorTipo,
          autorColor,
        };
      });

      setResumos(arrResumos);
    } catch (err) {
      console.error("Erro inesperado ao carregar resumos:", err);
      setErrorMessage("Erro ao carregar resumos.");
    } finally {
      setLoadingData(false);
    }
  };

  const selecionarAno = (ano) => {
    setAnoSelecionado(ano);
    setSemestreSelecionado(null);
    setDisciplinaSelecionada(null);
    setResumos([]);
    setDisciplinas([]);
    if (semestreSelecionado) {
      carregarDisciplinas(ano, semestreSelecionado);
    }
  };

  const selecionarSemestre = (sem) => {
    setSemestreSelecionado(sem);
    if (anoSelecionado) {
      carregarDisciplinas(anoSelecionado, sem);
    }
  };

  const selecionarDisciplina = (disc) => {
    setDisciplinaSelecionada(disc);
    carregarResumos(disc.iddisciplina);
  };

  if (loadingData) {
    return <LoadingScreen />;
  }

  return (
    <View style={styles.container}>
      <Header />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.welcome}>Bem vindo à página de resumos!</Text>
        {errorMessage ? (
          <Text style={styles.errorMessage}>{errorMessage}</Text>
        ) : null}

        {/* Seleção de Ano, Semestre e Disciplina - SEMPRE VISÍVEL */}
        <View style={styles.anoContainer}>
          <TouchableOpacity
            style={styles.dropdownBotao}
            onPress={() => setMostrarAnos(!mostrarAnos)}
          >
            <Text style={styles.dropdownTexto}>Escolhe o Ano</Text>
            <Ionicons name="chevron-down" size={20} color="#fff" />
          </TouchableOpacity>
        </View>

        {mostrarAnos && (
          <View style={styles.anosDropdown}>
            {[1, 2, 3].map((ano) => (
              <TouchableOpacity
                key={ano}
                style={anoSelecionado === ano ? styles.anoSelecionado : styles.ano}
                onPress={() => {
                  setAnoSelecionado(ano);
                  setMostrarAnos(false);
                }}
              >
                <Text style={styles.anoTexto}>{ano}º Ano</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {anoSelecionado && (
          <>
            <View style={styles.anoBadge}>
              <Ionicons name="book-outline" size={20} color="#0d47a1" style={{ marginRight: 6 }} />
              <Text style={styles.anoBadgeTexto}>
                Estás a ver o {anoSelecionado}º Ano
              </Text>
            </View>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Escolhe o Semestre</Text>
            </View>
            <View style={styles.semestreContainer}>
              {[1, 2].map((sem) => (
                <TouchableOpacity
                  key={sem}
                  style={[
                    styles.semestreButton,
                    semestreSelecionado === sem && styles.semestreSelecionado,
                  ]}
                  onPress={() => selecionarSemestre(sem)}
                >
                  <Text style={styles.semestreTexto}>{sem}º Semestre</Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}

        {semestreSelecionado && (
          <>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Escolha a disciplina</Text>
            </View>
            <View style={styles.disciplinasContainer}>
              {disciplinesList(disciplinas, disciplinaSelecionada, selecionarDisciplina)}
            </View>
          </>
        )}

        {/* Mostra disciplina e resumos */}
        {disciplinaSelecionada && (
          <>
            <View style={styles.selectedDiscContainer}>
              <Text style={styles.selecionadoTexto}>
                Disciplina atual:{" "}
                <Text style={styles.disciplinaNome}>{disciplinaSelecionada.nome}</Text>
              </Text>
            </View>

            <Text style={styles.subtitle}>Resumos Disponíveis</Text>
            {resumos.length > 0 ? (
              resumos.map((res) => {
                const autorLabel =
                  res.autorTipo === "aluno"
                    ? `Aluno (${res.autorNome})`
                    : `Professor (${res.autorNome})`;
                return (
                  <TouchableOpacity
                    key={res.idresumo}
                    style={styles.resumoCard}
                    onPress={() =>
                      navigation.navigate("PDFViewer", { pdfUrl: res.ficheiro })
                    }
                  >
                    <Text style={styles.resumoTitle}>{res.nome}</Text>
                    <Text style={styles.resumoInfo}>
                      Ficheiro: {res.ficheiro ? "Disponível" : "Não informado"}
                    </Text>
                    <Text style={styles.materiaNome}>
                      Matéria: {res.materiaNome}
                    </Text>
                    <Text style={[styles.autorNome, { color: res.autorColor }]}>
                      Disponibilizado por: {autorLabel}
                    </Text>
                    <Text style={styles.dataEnvio}>
                      {res.data_envio
                        ? `Enviado em: ${new Date(res.data_envio).toLocaleDateString()}`
                        : "Data não informada"}
                    </Text>
                  </TouchableOpacity>
                );
              })
            ) : (
             <View style={styles.selectedDiscContainer}>
                <View style={styles.selecionadoTexto1}>
                  <Text style={styles.sectionTitle1}>
                    Nenhum resumo verificado para esta disciplina.
                  </Text>
                </View>
              </View>




            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}

function disciplinesList(disciplinas, disciplinaSelecionada, callbackSelect) {
  return disciplinas.map((disc) => {
    const sel = disciplinaSelecionada?.iddisciplina === disc.iddisciplina;
    return (
      <TouchableOpacity
        key={disc.iddisciplina}
        style={[styles.disciplinaButton, sel && styles.disciplinaSelecionada]}
        onPress={() => callbackSelect(disc)}
      >
        <Text style={styles.disciplinaButtonText}>{disc.nome}</Text>
      </TouchableOpacity>
    );
  });
}


// ================== STYLES ==================
const primaryColor = "#0056b3";
const accentColor = "#d32f2f";

const styles = StyleSheet.create({
   welcome: {
    fontSize: 30,
    fontWeight: '800',
    color: '#1a237e',
    textAlign: 'center',
    marginVertical: 30,},

  disciplinaNome: {
    color: "#0d47a1",
    fontWeight: "bold",
  },
  selecionadoTexto: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1a237e",
    backgroundColor: "#e8eaf6",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
    marginVertical: 12,
    textAlign: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  selecionadoTexto1: {
    fontSize: 16,
    fontWeight: "600",
    color: "rgb(231, 118, 118)",
    backgroundColor: "rgb(231, 118, 118)",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
    marginVertical: 12,
    textAlign: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1a237e',
  },
   sectionTitle1: {
    fontSize: 15,
    fontWeight: '600',
    color:"rgb(145, 45, 38)",
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 30,
    marginBottom: 12,
    alignSelf: 'flex-start',
  },
  anoBadge: {
    flexDirection: "row",
    alignSelf: "center",
    backgroundColor: "#d1c4e9",
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 25,
    marginBottom: 20,
    alignItems: "center",
    shadowColor: "#aaa",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  anoBadgeTexto: {
    color: "#1a237e",
    fontSize: 16,
    fontWeight: "600",
  },
  ano: {
    padding: 12,
    borderRadius: 12,
    backgroundColor: "#c5cae9",
    marginHorizontal: 10,
    minWidth: 80,
    alignItems: "center",
  },
  anosDropdown: {
    flexDirection: "row",
    justifyContent: "center",
    marginVertical: 12,
  },
  dropdownTexto: {
    fontSize: 17,
    fontWeight: "600",
    color: "#fff",
  },
  dropdownBotao: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#3949ab",
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 16,
    width: "80%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 6,
  },
  containerLoading: {
    flex: 1,
    backgroundColor: "#f7f7f7",
    justifyContent: "center",
    alignItems: "center",
  },
  container: {
    flex: 1,
    backgroundColor: "#f7f7f7",
  },
  content: {
    padding: 16,
    alignItems: "center",
  },
 title: {
    fontSize: 22,
    fontWeight: "bold",
    color: accentColor,
    marginBottom: 20,
    textAlign: "center",
  },
  errorMessage: {
    color: accentColor,
    fontSize: 16,
    textAlign: "center",
    marginVertical: 10,
  },
  subtitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginTop: 25,
    marginBottom: 10,
    color: "rgb(43, 45, 165)",
    alignSelf: "flex-start",
    marginLeft: 15,
  },

  anoContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 10,
  },
  anoButton: {
    backgroundColor: "#ccc",
    borderRadius: 8,
    padding: 10,
    marginHorizontal: 10,
  },
  anoSelecionado: {
    padding: 12,
    borderRadius: 12,
    backgroundColor: "#3f51b5",
    marginHorizontal: 10,
    minWidth: 80,
    alignItems: "center",
  },
  anoTexto: {
    color: "#fff",
    fontWeight: "600",
  },

  semestreContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 15,
  },
  semestreButton: {
    backgroundColor: "rgb(255, 255, 255)",
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 16,
    marginHorizontal: 6,
    minWidth: 100,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  semestreSelecionado: {
    backgroundColor: "rgb(184, 234, 243)",
    borderColor: "rgb(9, 44, 243)",
    borderWidth: 2,
  },
  semestreTexto: {
    color: "#333",
    fontWeight: "600",
  },

  disciplinaButton: {
    backgroundColor: "#fff",
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 18,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  disciplinaSelecionada: {
    backgroundColor: "rgb(184, 234, 243)",
    borderColor: "rgb(9, 44, 243)",
    borderWidth: 2,
  },
  disciplinaButtonText: {
    color: primaryColor,
    fontWeight: "bold",
    fontSize: 15,
  },

  selectedDiscContainer: {
    backgroundColor: "rgb(186, 204, 234)",
    padding: 10,
    borderRadius: 30,
    marginVertical: 10,
    borderWidth: 1,
    borderColor: "rgb(0, 0, 0)",
  },
  selectedDiscText: {
    fontSize: 16,
    color: "rgb(3, 66, 255)",
    fontWeight: "600",
  },

  addButton: {
    backgroundColor: "rgb(14, 163, 173)",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 25,
    marginVertical: 10,
  },
  addButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },

  resumoCard: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 18,
    marginBottom: 18,
    width: "100%",
    borderLeftWidth: 6,
    borderLeftColor: "#0056b3",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },


  resumoTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1a237e",
    marginBottom: 8,
  },

  resumoInfo: {
    fontSize: 14,
    color: "#37474f",
    marginBottom: 6,
  },

  materiaNome: {
    fontSize: 13,
    fontWeight: "600",
    color: "#00695c",
    marginBottom: 4,
  },


  autorNome: {
    fontSize: 13,
    color: "#5d4037",
    marginBottom: 4,
    fontStyle: "italic",
  },

  dataEnvio: {
    fontSize: 12,
    color: "#757575",
    marginTop: 4,
  },


  noResumosText: {
    color: "#000",
    fontSize: 20,
    textAlign: "center",
    marginTop: 20,
  },
  btnSalvar: {
    backgroundColor: "#4caf50",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  btnSalvarText: {
    color: "#fff",
    fontWeight: "bold",
  },
  btnCancelar: {
    backgroundColor: accentColor,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  btnCancelarText: {
    color: "#fff",
    fontWeight: "bold",
  },

  // Botão de escolher ficheiro
  btnEscolherFicheiro: {
    backgroundColor: primaryColor,
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 6,
    alignItems: "center",
    marginBottom: 5,
  },
  btnEscolherFicheiroText: {
    color: "#fff",
    fontWeight: "bold",
  },

  // Barra de progresso (fake)
  progressBarContainer: {
    width: "100%",
    height: 20,
    backgroundColor: "#ddd",
    borderRadius: 10,
    marginTop: 10,
    position: "relative",
    overflow: "hidden",
    justifyContent: "center",
  },
  progressBarFill: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    backgroundColor: "#4caf50",
  },
  progressBarText: {
    alignSelf: "center",
    fontWeight: "bold",
    color: "#fff",
    zIndex: 1,
  },
});
