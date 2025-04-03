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
import { useAuth } from "../context/AuthProvider";
import Header from "../componentes/header";

const TABELA_RESUMOS = "Resumos";

export default function ResumosScreen({ route, navigation }) {
  const { supabase, user, loading } = useAuth();

  // Caso venha "iddisciplina" via params
  const { iddisciplina } = route.params || {};

  // Estados para ano/sem e disciplina
  const [anoSelecionado, setAnoSelecionado] = useState(null);
  const [semestreSelecionado, setSemestreSelecionado] = useState(null);
  const [disciplinas, setDisciplinas] = useState([]);
  const [disciplinaSelecionada, setDisciplinaSelecionada] = useState(null);

  // Lista de resumos
  const [resumos, setResumos] = useState([]);

  // Loading/erro
  const [loadingData, setLoadingData] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  // userInfo => { idcurso, ... }
  const [userInfo, setUserInfo] = useState(null);

  // ================== A) Validar user + buscar userInfo ==================
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
        setUserInfo(data); // { idcurso: 11, ... }
      }
    } catch (err) {
      console.log("Exception ao buscar userInfo:", err);
      setErrorMessage("Erro ao buscar dados do utilizador.");
    } finally {
      setLoadingData(false);
    }
  };

  // ================== B) Se veio iddisciplina, buscar disciplina e resumos ==================
  useEffect(() => {
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

  // ================== C) Carregar Disciplinas via curso_disciplina (join c/ disciplinas) ==================
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

      // Buscamos colunas:
      // - iddisciplina
      // - disciplinas(*)
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
        // data => [{ iddisciplina: 123, disciplinas: { iddisciplina, nome }}...]
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

  // ================== D) Carregar Resumos ==================
  const carregarResumos = async (idd) => {
    try {
      setLoadingData(true);
      setErrorMessage("");
      setResumos([]);

      // Buscar resumos
      const { data: resumosData, error: resumosError } = await supabase
        .from(TABELA_RESUMOS)
        .select("*")
        .eq("iddisciplina", idd);

      if (resumosError) {
        console.error("Erro ao buscar resumos:", resumosError);
        setErrorMessage("Erro ao carregar resumos.");
        return;
      }

      if (!resumosData || resumosData.length === 0) {
        setErrorMessage("Não há resumos disponíveis para esta disciplina.");
        return;
      }

      // Carregar autor de cada resumo (se user_id for preciso)
      const resumosComAutor = [];
      for (const resumo of resumosData) {
        let autorNome = "Desconhecido";
        let autorTipo = "desconhecido";

        if (resumo.user_id) {
          const { data: userData, error: userError } = await supabase
            .from("utilizadores")
            .select("nome, tipo_conta")
            .eq("id", resumo.user_id)
            .single();

          if (!userError && userData) {
            autorNome = userData.nome || "Sem nome";
            const t = userData.tipo_conta;
            if (t === "professor") autorTipo = "docente";
            else if (t === "aluno") autorTipo = "aluno";
            else autorTipo = t || "desconhecido";
          }
        }

        resumosComAutor.push({
          ...resumo,
          autorNome,
          autorTipo,
        });
      }

      setResumos(resumosComAutor);
    } catch (err) {
      console.error("Erro inesperado ao carregar resumos:", err);
      setErrorMessage("Erro ao carregar resumos.");
    } finally {
      setLoadingData(false);
    }
  };

  // ================== E) Selecionar Ano / Semestre / Disciplina ==================
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

        {errorMessage ? <Text style={styles.errorMessage}>{errorMessage}</Text> : null}

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
                  {disciplinas.map((disc) => {
                    const sel =
                      disciplinaSelecionada?.iddisciplina === disc.iddisciplina;
                    return (
                      <TouchableOpacity
                        key={disc.iddisciplina}
                        style={[
                          styles.disciplinaButton,
                          sel && styles.disciplinaSelecionada,
                        ]}
                        onPress={() => selecionarDisciplina(disc)}
                      >
                        <Text style={styles.disciplinaButtonText}>{disc.nome}</Text>
                      </TouchableOpacity>
                    );
                  })}
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
            {resumos.map((res) => (
              <TouchableOpacity
                key={res.idresumo}
                style={styles.resumoCard}
                onPress={() => {
                  navigation.navigate("PDFViewerScreen", {
                    pdfUrl: res.materia, // link do PDF
                  });
                }}
              >
                <Text style={styles.resumoTitle}>{res.nome}</Text>
                <Text style={styles.resumoInfo}>
                  PDF: {res.materia ? "Disponível" : "Não informado"}
                </Text>
                <Text style={styles.autorNome}>{res.autorNome}</Text>
                <Text style={styles.autorTipo}>{res.autorTipo}</Text>
              </TouchableOpacity>
            ))}

            {resumos.length === 0 && (
              <Text style={styles.noResumosText}>
                Nenhum resumo encontrado para esta disciplina.
              </Text>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
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
    color: "#d32f2f",
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

  disciplinasContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    marginBottom: 15,
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
  autorNome: {
    fontSize: 15,
    color: "rgb(49, 122, 77)",
    fontWeight: "bold",
  },
  autorTipo: {
    fontSize: 13,
    color: "rgb(59, 165, 103)",
    fontStyle: "italic",
  },
  noResumosText: {
    color: "#000",
    fontSize: 16,
    textAlign: "center",
    marginTop: 20,
  },
});
