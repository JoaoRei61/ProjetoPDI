import React, { useEffect, useState } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
  TextInput,
  Pressable,
} from "react-native";

// Bibliotecas expo
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system";

// Converte base64 -> ArrayBuffer
import { decode } from "base64-arraybuffer";

// Exemplo de contexto de Auth e Supabase (ajusta conforme teu projeto)
import { useAuth } from "../context/AuthProvider";
import Header from "../componentes/header";

const TABELA_RESUMOS = "resumos";
const BUCKET_NAME = "pdfs"; // Altere para o nome do seu bucket no Supabase

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

  // Controla o Modal de Adicionar Resumo
  const [showAddModal, setShowAddModal] = useState(false);

  // Formulário de adicionar resumo
  const [novoNome, setNovoNome] = useState("");
  const [novoFicheiroUri, setNovoFicheiroUri] = useState("");
  const [novoFicheiroName, setNovoFicheiroName] = useState("");
  const [novaMateria, setNovaMateria] = useState("");

  // Upload “fake” progress
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

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
          nome,
          idutilizador,
          idmateria,
          data_envio,
          estado,
          materias: idmateria (nome),
          utilizadores: idutilizador (nome, tipo_conta)
        `)
        .eq("iddisciplina", idd)
        .eq("estado", true);

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

  // ================== 5) Adicionar Resumo ==================
  const abrirModalAdicionar = () => {
    setNovoNome("");
    setNovoFicheiroUri("");
    setNovoFicheiroName("");
    setNovaMateria("");
    setShowAddModal(true);
  };

  const fecharModalAdicionar = () => {
    setShowAddModal(false);
    setIsUploading(false);
    setUploadProgress(0);
  };

  // Selecionar arquivo
  const pickFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        copyToCacheDirectory: true,
        multiple: false,
      });

      if (result.type === "success") {
        setNovoFicheiroUri(result.uri);
        setNovoFicheiroName(result.name || "sem_nome.pdf");
      }
    } catch (error) {
      console.log("Erro ao escolher ficheiro:", error);
      Alert.alert("Erro", "Não foi possível escolher o ficheiro.");
    }
  };

  // Função para subir para Supabase
  const uploadParaSupabase = async (localUri, originalName) => {
    // Extrair extensão
    const fileExt = originalName.split(".").pop() || "pdf";
    // Nome final no storage
    const fileName = `resumo_${Date.now()}.${fileExt}`;
    // Caminho dentro do bucket
    const filePath = `disciplinas/${disciplinaSelecionada.iddisciplina}/${fileName}`;

    // Ler como base64
    const base64Data = await FileSystem.readAsStringAsync(localUri, {
      encoding: FileSystem.EncodingType.Base64,
    });

    // Converte base64 -> ArrayBuffer
    const fileArrayBuffer = decode(base64Data);

    // Barra de progresso “fake”
    setIsUploading(true);
    setUploadProgress(0);
    const progressInterval = setInterval(() => {
      setUploadProgress((old) => {
        if (old < 90) {
          return old + 10; // avança 10% a cada meio segundo
        } 
        return old;
      });
    }, 500);

    try {
      const { data, error } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(filePath, fileArrayBuffer, {
          contentType: "application/octet-stream",
          upsert: false,
        });

      if (error) {
        console.error("Erro no upload do ficheiro:", error);
        throw error;
      }

      // Gerar URL pública
      const { data: publicData } = supabase.storage
        .from(BUCKET_NAME)
        .getPublicUrl(filePath);

      const publicURL = publicData?.publicUrl;
      return publicURL;
    } finally {
      clearInterval(progressInterval);
      setUploadProgress(100);
      setTimeout(() => {
        setIsUploading(false);
      }, 1000);
    }
  };

  // Salvar no BD
  const handleSalvarResumo = async () => {
    try {
      if (!disciplinaSelecionada) {
        Alert.alert("Atenção", "Selecione uma disciplina antes de adicionar.");
        return;
      }
      if (!novoNome.trim()) {
        Alert.alert("Atenção", "Informe o nome do resumo.");
        return;
      }
      if (!novoFicheiroUri) {
        Alert.alert("Atenção", "Selecione um ficheiro para upload.");
        return;
      }

      setLoadingData(true);

      // 1) Upload do ficheiro
      const urlFicheiro = await uploadParaSupabase(novoFicheiroUri, novoFicheiroName);

      // 2) Inserir na tabela
      const { data, error } = await supabase
        .from(TABELA_RESUMOS)
        .insert({
          iddisciplina: disciplinaSelecionada.iddisciplina,
          nome: novoNome.trim(),
          ficheiro: urlFicheiro, // URL final
          idmateria: null, // se quiseres usar o valor de novaMateria, ajusta
          data_envio: new Date().toISOString(),
          idutilizador: user?.id || null,
          estado: false, // false => aguarda aprovação do admin
        })
        .single();

      if (error) {
        console.error("Erro ao inserir resumo:", error);
        Alert.alert("Erro", "Não foi possível adicionar o resumo.");
      } else {
        Alert.alert(
          "Resumo Adicionado",
          "O resumo foi enviado com sucesso! Aguarde aprovação do Admin."
        );
      }
    } catch (err) {
      console.error("Erro inesperado ao inserir resumo:", err);
      Alert.alert("Erro", "Não foi possível adicionar o resumo.");
    } finally {
      setLoadingData(false);
      fecharModalAdicionar();
      // Lembra: como estado=false, não aparecerá na lista atual (que só mostra estado=true)
    }
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

        {/* Botão para adicionar novo resumo */}
        {disciplinaSelecionada && (
          <TouchableOpacity style={styles.addButton} onPress={abrirModalAdicionar}>
            <Text style={styles.addButtonText}>Adicionar Resumo</Text>
          </TouchableOpacity>
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
                      navigation.navigate("PDFViewerScreen", {
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

      {/* MODAL para adicionar resumo */}
      <Modal
        visible={showAddModal}
        animationType="slide"
        transparent={true}
        onRequestClose={fecharModalAdicionar}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Adicionar Novo Resumo</Text>

            <TextInput
              style={styles.modalInput}
              placeholder="Nome do Resumo"
              placeholderTextColor="#666"
              value={novoNome}
              onChangeText={setNovoNome}
            />

            <TextInput
              style={styles.modalInput}
              placeholder="Matéria (opcional)"
              placeholderTextColor="#666"
              value={novaMateria}
              onChangeText={setNovaMateria}
            />

            {/* Botão para escolher ficheiro */}
            <Pressable style={styles.btnEscolherFicheiro} onPress={pickFile}>
              <Text style={styles.btnEscolherFicheiroText}>
                Escolher Ficheiro
              </Text>
            </Pressable>
            <Text style={{ marginTop: 5 }}>
              {novoFicheiroName
                ? `Ficheiro selecionado: ${novoFicheiroName}`
                : "Nenhum ficheiro selecionado"}
            </Text>

            {isUploading && (
              <View style={styles.progressBarContainer}>
                <View
                  style={[
                    styles.progressBarFill,
                    { width: `${uploadProgress}%` },
                  ]}
                />
                <Text style={styles.progressBarText}>
                  {uploadProgress}%
                </Text>
              </View>
            )}

            <View style={styles.modalButtonContainer}>
              <Pressable style={styles.btnSalvar} onPress={handleSalvarResumo}>
                <Text style={styles.btnSalvarText}>Salvar</Text>
              </Pressable>

              <Pressable style={styles.btnCancelar} onPress={fecharModalAdicionar}>
                <Text style={styles.btnCancelarText}>Cancelar</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
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

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    width: "90%",
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 15,
    textAlign: "center",
  },
  modalInput: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 6,
    padding: 10,
    marginBottom: 12,
    color: "#000",
  },
  modalButtonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
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
