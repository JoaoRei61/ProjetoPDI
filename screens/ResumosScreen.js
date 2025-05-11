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


// Exemplo de contexto de Auth e Supabase (ajusta conforme teu projeto)
import { useAuth } from "../context/AuthProvider";
import Header from "../componentes/header";

const TABELA_RESUMOS = "resumos";


export default function ResumosScreen({ route, navigation }) {
  const { supabase, user, loading } = useAuth();

  // Caso venha "iddisciplina" via params
  const { iddisciplina } = route.params || {};

  // Estados para ano/sem e disciplina
  const [anoSelecionado, setAnoSelecionado] = useState(null);
  const [semestreSelecionado, setSemestreSelecionado] = useState(null);
  const [disciplinas, setDisciplinas] = useState([]);
  const [disciplinaSelecionada, setDisciplinaSelecionada] = useState(null);

  // Lista de resumos (apenas estado=true)
  const [resumos, setResumos] = useState([]);

  // Loading geral
  const [loadingData, setLoadingData] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  // userInfo => { idcurso, ... }
  const [userInfo, setUserInfo] = useState(null);


  // ================== 1) Validar user + buscar userInfo ==================
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

  // ================== 2) Se veio iddisciplina, buscar disciplina e resumos ==================
  useEffect(() => {
    if (iddisciplina) {
      buscarDisciplinaESelecionar(iddisciplina);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  // ================== 3) Carregar Disciplinas do Curso (ano/semestre) ==================
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
        .select(
          `
          iddisciplina,
          disciplinas (
            iddisciplina,
            nome
          )
        `
        )
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

  // ================== 4) Carregar Resumos (estado=true) ==================
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

      if (!resumosData || resumosData.length === 0) {
        setErrorMessage("Não há resumos disponíveis para esta disciplina.");
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

  // ================== Selecionar Ano / Semestre / Disciplina ==================
  const selecionarAno = (ano) => {
    setAnoSelecionado(ano);
    setSemestreSelecionado(null);
    setDisciplinas([]);
    setDisciplinaSelecionada(null);
    setResumos([]);
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

  
  // ================== Render ==================
  if (loadingData) {
    return (
      <View style={styles.containerLoading}>
        <Header />
        <ActivityIndicator size="large" color="#0056b3" style={{ marginTop: 20 }} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header />

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>
          Selecione o ano, semestre e disciplina para ver os Resumos
        </Text>

        {errorMessage ? (
          <Text style={styles.errorMessage}>{errorMessage}</Text>
        ) : null}

        {/* Escolha manual se não veio iddisciplina (ou não selecionou) */}
        {!disciplinaSelecionada && !iddisciplina && (
          <>
            <Text style={styles.subtitle}>1) Escolha o Ano</Text>
            <View style={styles.anoContainer}>
              {[1, 2, 3].map((ano) => (
                <TouchableOpacity
                  key={ano}
                  style={[
                    styles.anoButton,
                    anoSelecionado === ano && styles.anoSelecionado,
                  ]}
                  onPress={() => selecionarAno(ano)}
                >
                  <Text style={styles.anoTexto}>{ano}º</Text>
                </TouchableOpacity>
              ))}
            </View>

            {anoSelecionado && (
              <>
                <Text style={styles.subtitle}>2) Escolha o Semestre</Text>
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
                <Text style={styles.subtitle}>3) Escolha a Disciplina</Text>
                <View style={styles.disciplinasContainer}>
                  {disciplinesList(disciplinas, disciplinaSelecionada, selecionarDisciplina)}
                </View>
              </>
            )}
          </>
        )}

        {/* Mostrar disciplina selecionada */}
        {disciplinaSelecionada && (
          <View style={styles.selectedDiscContainer}>
            <Text style={styles.selectedDiscText}>
              Disciplina Selecionada: {disciplinaSelecionada.nome}
            </Text>
          </View>
        )}


        {/* Lista de Resumos */}
        {disciplinaSelecionada && (
          <>
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
                    onPress={() => {
                      navigation.navigate("PDFViewer", {
                        pdfUrl: res.ficheiro,
                      });
                    }}
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
              <Text style={styles.noResumosText}>
                Nenhum resumo verificado para esta disciplina.
              </Text>
            )}
          </>
        )}
      </ScrollView>
      
    </View>
  );
}

/** Pequeno helper para renderizar as disciplinas */
function disciplinesList(disciplinas, disciplinaSelecionada, callbackSelect) {
  return disciplinas.map((disc) => {
    const sel = disciplinaSelecionada?.iddisciplina === disc.iddisciplina;
    return (
      <TouchableOpacity
        key={disc.iddisciplina}
        style={[
          styles.disciplinaButton,
          sel && styles.disciplinaSelecionada,
        ]}
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
    fontSize: 20,
    fontWeight: "bold",
    color: "#000",
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
    color: "rgb(223, 129, 142)",
    alignSelf: "flex-start",
    marginLeft: 15,
  },

  anoContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 15,
  },
  anoButton: {
    backgroundColor: "#ccc",
    borderRadius: 8,
    padding: 10,
    marginHorizontal: 10,
  },
  anoSelecionado: {
    backgroundColor: primaryColor,
  },
  anoTexto: {
    fontSize: 16,
    color: "#fff",
    fontWeight: "bold",
  },

  semestreContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 15,
  },
  semestreButton: {
    backgroundColor: "#ccc",
    borderRadius: 8,
    padding: 10,
    marginHorizontal: 10,
  },
  semestreSelecionado: {
    backgroundColor: primaryColor,
  },
  semestreTexto: {
    fontSize: 16,
    color: "#fff",
    fontWeight: "bold",
  },

  disciplinaButton: {
    backgroundColor: "#fff",
    borderColor: primaryColor,
    borderWidth: 2,
    borderRadius: 8,
    padding: 10,
    margin: 5,
  },
  disciplinaSelecionada: {
    borderColor: accentColor,
  },
  disciplinaButtonText: {
    color: primaryColor,
    fontWeight: "bold",
    fontSize: 15,
  },

  selectedDiscContainer: {
    backgroundColor: "rgb(157, 243, 243)",
    padding: 10,
    borderRadius: 30,
    marginVertical: 10,
    borderWidth: 1,
    borderColor: "rgb(3, 66, 255)",
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
    backgroundColor: "rgb(134, 245, 184)",
    borderRadius: 40,
    padding: 16,
    marginBottom: 15,
    elevation: 2,
    width: "90%",
  },
  resumoTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "rgb(30, 121, 45)",
    marginBottom: 5,
  },
  resumoInfo: {
    fontSize: 14,
    color: "rgb(59, 165, 103)",
    marginBottom: 8,
  },
  materiaNome: {
    fontSize: 14,
    color: "rgb(59, 165, 103)",
    fontStyle: "italic",
    marginBottom: 6,
  },
  autorNome: {
    fontSize: 15,
    fontWeight: "bold",
    marginBottom: 2,
  },
  dataEnvio: {
    fontSize: 12,
    color: "rgb(59, 165, 103)",
  },
  noResumosText: {
    color: "#000",
    fontSize: 16,
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
