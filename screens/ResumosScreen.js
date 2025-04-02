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

// Ajuste se for "resumos" em minúsculo
const TABELA_RESUMOS = "Resumos";

export default function ResumosScreen({ route, navigation }) {
  const { supabase, user, loading } = useAuth();

  // Caso venha "iddisciplina" via params
  const { iddisciplina } = route.params || {};

  // States para ano/semestre e disciplina
  const [anoSelecionado, setAnoSelecionado] = useState(null);
  const [semestreSelecionado, setSemestreSelecionado] = useState(null);
  const [disciplinas, setDisciplinas] = useState([]);
  const [disciplinaSelecionada, setDisciplinaSelecionada] = useState(null);

  const [resumos, setResumos] = useState([]);

  const [loadingData, setLoadingData] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  // ================== Efeito inicial: validação do user ==================
  useEffect(() => {
    if (!user && !loading) {
      Alert.alert("Sessão Expirada", "Por favor, faça login novamente.", [
        { text: "OK", onPress: () => navigation.replace("Login") },
      ]);
      return;
    }
    setLoadingData(false);
  }, [user]);

  // ================== Se veio iddisciplina, buscamos direto ==================
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
        console.error("Erro ao buscar disciplina por id:", error);
        setErrorMessage("Erro ao carregar disciplina recebida por parâmetro.");
      } else if (data) {
        setDisciplinaSelecionada(data);
        // Opcionalmente, se quiser armazenar o ano/semestre da disciplina
        // setAnoSelecionado(data.ano);
        // setSemestreSelecionado(data.semestre);

        // Carrega resumos automaticamente
        carregarResumos(data.iddisciplina);
      }
    } catch (err) {
      console.error("Erro inesperado ao buscar disciplina:", err);
      setErrorMessage("Erro ao obter disciplina.");
    } finally {
      setLoadingData(false);
    }
  };

  // ================== Carrega Disciplinas manualmente ==================
  const carregarDisciplinas = async (ano, semestre) => {
    try {
      setLoadingData(true);
      setDisciplinaSelecionada(null);
      setResumos([]);
      setErrorMessage("");

      const idcurso = user?.user_metadata?.idcurso;
      if (!idcurso) {
        setErrorMessage("Não foi possível identificar o curso do utilizador.");
        setLoadingData(false);
        return;
      }

      const { data, error } = await supabase
        .from("disciplinas")
        .select("*")
        .eq("idcurso", idcurso)
        .eq("ano", ano)
        .eq("semestre", semestre);

      if (error) {
        console.error("Erro ao buscar disciplinas:", error);
        setErrorMessage("Erro ao carregar disciplinas.");
      } else if (!data || data.length === 0) {
        setErrorMessage("Sem disciplinas para este ano e semestre.");
        setDisciplinas([]);
      } else {
        setDisciplinas(data);
      }
    } catch (err) {
      console.error("Erro ao carregar disciplinas:", err);
      setErrorMessage("Erro ao carregar disciplinas.");
    } finally {
      setLoadingData(false);
    }
  };

  // ================== Carrega Resumos ==================
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

      // Para cada resumo, buscar user em auth.users
      const resumosComAutor = [];
      await Promise.all(
        resumosData.map(async (resumo) => {
          let autorNome = "Desconhecido";
          let autorTipo = "desconhecido";

          if (resumo.user_id) {
            const { data: userData, error: userError } = await supabase
              .from("auth.users")
              .select("id, user_metadata")
              .eq("id", resumo.user_id)
              .single();

            if (!userError && userData) {
              autorNome = userData.user_metadata?.nome || "Sem nome";
              const t = userData.user_metadata?.tipo_conta;
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
        })
      );

      setResumos(resumosComAutor);
    } catch (err) {
      console.error("Erro inesperado ao carregar resumos:", err);
      setErrorMessage("Erro ao carregar resumos.");
    } finally {
      setLoadingData(false);
    }
  };

  // ================== Handlers ==================
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
  return (
    <View style={styles.container}>
      <Header />

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>
          Selecione o ano, semestre e disciplina para ver os Resumos
        </Text>

        {loadingData && (
          <ActivityIndicator
            animating={true}
            size="large"
            color="#0056b3"
            style={styles.loader}
          />
        )}
        {errorMessage ? <Text style={styles.errorMessage}>{errorMessage}</Text> : null}

        {/* Caso não tenha disciplinaSelecionada e não tenha iddisciplina, mostramos a escolha manual */}
        {!disciplinaSelecionada && !iddisciplina && (
          <>
            {/* Passo 1: Ano */}
            <Text style={styles.subtitle}>1) Escolha o Ano</Text>
            <View style={styles.anoContainer}>
              {[1, 2, 3].map((ano) => (
                <TouchableOpacity
                  key={`ano-${ano}`} // chave única
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

            {/* Passo 2: Semestre */}
            {anoSelecionado && (
              <>
                <Text style={styles.subtitle}>2) Escolha o Semestre</Text>
                <View style={styles.semestreContainer}>
                  {[1, 2].map((sem) => (
                    <TouchableOpacity
                      key={`sem-${sem}`} // chave única
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

            {/* Passo 3: Disciplina */}
            {semestreSelecionado && (
              <>
                <Text style={styles.subtitle}>3) Escolha a Disciplina</Text>
                <View style={styles.disciplinasContainer}>
                  {disciplinas.map((disc) => {
                    const sel = disciplinaSelecionada?.iddisciplina === disc.iddisciplina;
                    return (
                      <TouchableOpacity
                        key={`disc-${disc.iddisciplina}`} // chave única
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

        {/* Mostra a disciplina selecionada (se houver) */}
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
                key={`resumo-${res.idresumo}`} // chave única
                style={styles.resumoCard}
                onPress={() => {
                  navigation.navigate("PDFViewerScreen", {
                    pdfUrl: res.materia, // link PDF
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

            {!loadingData && !errorMessage && resumos.length === 0 && (
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
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f7f7f7",
  },
  content: {
    padding: 16,
    alignItems: "center",
  },
  loader: {
    marginTop: 20,
  },
  errorMessage: {
    color: "red",
    fontSize: 16,
    textAlign: "center",
    marginVertical: 10,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: "rgb(0, 0, 0)",
    marginBottom: 20,
    textAlign: "center",
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
    backgroundColor: "#0056b3",
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
    backgroundColor: "#0056b3",
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
    borderColor: "#0056b3",
    borderWidth: 2,
    borderRadius: 8,
    padding: 10,
    margin: 5,
  },
  disciplinaSelecionada: {
    borderColor: "#d32f2f",
  },
  disciplinaButtonText: {
    color: "#0056b3",
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
    color: "rgb(0, 0, 0)",
    fontSize: 16,
    textAlign: "center",
    marginTop: 20,
  },
});
