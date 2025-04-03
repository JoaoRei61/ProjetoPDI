import React, { useEffect, useState } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  Modal,
  Alert,
  TouchableOpacity,
  Text,
} from "react-native";
import { Button, TextInput } from "react-native-paper";
import { useNavigation } from "@react-navigation/native";
import Header from "../componentes/header";
import { useAuth } from "../context/AuthProvider";
import supabase from "../supabaseconfig";

export default function GerirContaScreen() {
  const navigation = useNavigation();
  const { user } = useAuth();

  // Estados para dados do usuário (nome, telefone, tipoConta, idCurso)
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [telefone, setTelefone] = useState("");
  const [tipoConta, setTipoConta] = useState("");
  const [idCurso, setIdCurso] = useState(null);

  // Para exibir lista de cursos
  const [courses, setCourses] = useState([]);

  // Modals de edição
  const [modalNomeVisible, setModalNomeVisible] = useState(false);
  const [modalEmailVisible, setModalEmailVisible] = useState(false);
  const [modalTelefoneVisible, setModalTelefoneVisible] = useState(false);
  const [modalTipoContaVisible, setModalTipoContaVisible] = useState(false);
  const [modalIdCursoVisible, setModalIdCursoVisible] = useState(false);

  // Modal para confirmar envio de link de redefinição
  const [modalResetVisible, setModalResetVisible] = useState(false);

  // Valores de edição temporária
  const [tempNome, setTempNome] = useState("");
  const [tempEmail, setTempEmail] = useState("");
  const [tempTelefone, setTempTelefone] = useState("");

  useEffect(() => {
    if (user) {
      // 1) Carregar o email diretamente do objeto user (auth.users)
      setEmail(user.email ?? "");

      // 2) Carregar dados adicionais da tabela "utilizadores"
      fetchUtilizador();
    }
    // Buscar lista de cursos
    fetchCourses();
  }, [user]);

  // Busca dados do utilizador na tabela "utilizadores"
  const fetchUtilizador = async () => {
    try {
      const { data: info, error } = await supabase
        .from("utilizadores")
        .select("nome, telefone, tipo_conta, idcurso")
        .eq("id", user.id)
        .single();

      if (!error && info) {
        setNome(info.nome || "");
        setTelefone(info.telefone || "");
        setTipoConta(info.tipo_conta || "");
        setIdCurso(info.idcurso || null);
      }
    } catch (err) {
      console.error("Erro ao buscar utilizador:", err);
    }
  };

  // Busca lista de cursos no Supabase
  const fetchCourses = async () => {
    try {
      const { data, error } = await supabase.from("curso").select("idcurso, nome");
      if (error) {
        console.error("Erro ao buscar cursos:", error);
      } else {
        setCourses(data || []);
      }
    } catch (err) {
      console.error("Erro inesperado ao buscar cursos:", err);
    }
  };

  // ============ ATUALIZAÇÕES NA TABELA UTILIZADORES ============

  // Função genérica para atualizar a tabela utilizadores
  const updateUtilizadores = async (newValues) => {
    try {
      // Faz update na tabela "utilizadores" com base no user.id
      const { error } = await supabase
        .from("utilizadores")
        .update(newValues)
        .eq("id", user.id);

      if (error) {
        Alert.alert("Erro", error.message);
      } else {
        Alert.alert("Sucesso", "Alteração salva com sucesso!");
      }
    } catch (err) {
      console.error("Erro ao atualizar utilizadores:", err);
      Alert.alert("Erro", "Não foi possível atualizar.");
    }
  };

  // ============ ATUALIZAÇÕES NO AUTH (apenas email) ============
  const updateAuthEmail = async (novoEmail) => {
    try {
      const { error } = await supabase.auth.updateUser({ email: novoEmail });
      if (error) {
        Alert.alert("Erro", error.message);
      } else {
        Alert.alert("Sucesso", "Email atualizado com sucesso!");
      }
    } catch (err) {
      console.error("Erro ao atualizar email:", err);
      Alert.alert("Erro", "Não foi possível atualizar o email.");
    }
  };

  // ====== Nome ======
  const handleAlterarNome = () => {
    setTempNome(nome);
    setModalNomeVisible(true);
  };
  const handleSalvarNome = async () => {
    setModalNomeVisible(false);
    setNome(tempNome);
    // Atualiza a tabela "utilizadores"
    await updateUtilizadores({ nome: tempNome });
  };

  // ====== Email ======
  const handleAlterarEmail = () => {
    setTempEmail(email);
    setModalEmailVisible(true);
  };
  const handleSalvarEmail = async () => {
    setModalEmailVisible(false);
    setEmail(tempEmail);
    // Atualiza o email no auth.users
    await updateAuthEmail(tempEmail);
  };

  // ====== Telefone ======
  const handleAlterarTelefone = () => {
    setTempTelefone(telefone);
    setModalTelefoneVisible(true);
  };
  const handleSalvarTelefone = async () => {
    setModalTelefoneVisible(false);
    setTelefone(tempTelefone);
    // Atualiza a tabela "utilizadores"
    await updateUtilizadores({ telefone: tempTelefone });
  };

  // ====== Tipo de Conta ======
  const handleAlterarTipoConta = () => {
    setModalTipoContaVisible(true);
  };
  const selectTipoConta = async (valor) => {
    setModalTipoContaVisible(false);
    setTipoConta(valor);
    // Atualiza a tabela "utilizadores"
    await updateUtilizadores({ tipo_conta: valor });
  };

  // ====== idCurso ======
  const handleAlterarCurso = () => {
    setModalIdCursoVisible(true);
  };
  const selectCurso = async (cursoSelecionado) => {
    setModalIdCursoVisible(false);
    setIdCurso(cursoSelecionado.idcurso);
    // Atualiza a tabela "utilizadores"
    await updateUtilizadores({ idcurso: cursoSelecionado.idcurso });
  };

  // ====== Redefinir senha (envia email) ======
  const handleResetPassword = async () => {
    if (!email) {
      Alert.alert("Ops", "Não foi possível identificar seu email.");
      return;
    }
    const { data, error } = await supabase.auth.resetPasswordForEmail(email);
    if (error) {
      Alert.alert("Erro", error.message);
    } else {
      setModalResetVisible(true);
    }
  };

  return (
    <View style={styles.container}>
      <Header />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Gerir Conta</Text>

        {/* Card NOME */}
        <View style={[styles.card, { backgroundColor: "#FDE2E4" }]}>
          <Text style={styles.label}>Nome</Text>
          <Text style={styles.value}>{nome || "Sem nome"}</Text>
          <TouchableOpacity style={styles.alterarButton} onPress={handleAlterarNome}>
            <Text style={styles.alterarButtonText}>Alterar</Text>
          </TouchableOpacity>
        </View>

        {/* Card EMAIL */}
        <View style={[styles.card, { backgroundColor: "#E2F0CB" }]}>
          <Text style={styles.label}>Email</Text>
          <Text style={styles.value}>{email || "Sem email"}</Text>
          <TouchableOpacity style={styles.alterarButton} onPress={handleAlterarEmail}>
            <Text style={styles.alterarButtonText}>Alterar</Text>
          </TouchableOpacity>
        </View>

        {/* Card TELEFONE */}
        <View style={[styles.card, { backgroundColor: "#DCE7FF" }]}>
          <Text style={styles.label}>Telefone</Text>
          <Text style={styles.value}>{telefone || "Sem telefone"}</Text>
          <TouchableOpacity style={styles.alterarButton} onPress={handleAlterarTelefone}>
            <Text style={styles.alterarButtonText}>Alterar</Text>
          </TouchableOpacity>
        </View>

        {/* Card TIPO_CONTA */}
        <View style={[styles.card, { backgroundColor: "#FFF5BA" }]}>
          <Text style={styles.label}>Tipo de Conta</Text>
          <Text style={styles.value}>{tipoConta || "desconhecido"}</Text>
          <TouchableOpacity style={styles.alterarButton} onPress={handleAlterarTipoConta}>
            <Text style={styles.alterarButtonText}>Alterar</Text>
          </TouchableOpacity>
        </View>

        {/* Card IDCURSO */}
        <View style={[styles.card, { backgroundColor: "#C5E7E2" }]}>
          <Text style={styles.label}>Curso</Text>
          <Text style={styles.value}>
            {idCurso
              ? (courses.find((c) => c.idcurso === idCurso)?.nome || `ID: ${idCurso}`)
              : "Nenhum curso selecionado"}
          </Text>
          <TouchableOpacity style={styles.alterarButton} onPress={handleAlterarCurso}>
            <Text style={styles.alterarButtonText}>Alterar</Text>
          </TouchableOpacity>
        </View>

        {/* Card para Redefinir Senha */}
        <View style={[styles.card, { backgroundColor: "#FEE4B7" }]}>
          <Text style={styles.label}> password</Text>
          <Text style={styles.value}>
            Clique no botão abaixo para receber um link de redefinição no seu email.
          </Text>
          <TouchableOpacity style={styles.alterarButton} onPress={handleResetPassword}>
            <Text style={styles.alterarButtonText}>Alterar password</Text>
          </TouchableOpacity>
        </View>

        <Button
          mode="contained"
          style={styles.voltarButton}
          onPress={() => navigation.goBack()}
        >
          Voltar
        </Button>
      </ScrollView>

      {/* ============ MODAL de Confirmação de envio de email ============ */}
      <Modal visible={modalResetVisible} transparent animationType="fade">
        <View style={styles.resetModalOverlay}>
          <View style={styles.resetModalContainer}>
            <Text style={styles.resetModalTitle}>Pedido de Redefinição de Senha</Text>
            <Text style={styles.resetModalMsg}>
              Foi enviado um email para <Text style={{ fontWeight: "bold" }}>{email}</Text>{" "}
              com o link de redefinição. Acesse-o para definir uma nova senha.
            </Text>
            <Button
              mode="contained"
              onPress={() => setModalResetVisible(false)}
              style={styles.resetModalButton}
            >
              Fechar
            </Button>
          </View>
        </View>
      </Modal>

      {/* ============ MODAL para alterar Nome ============ */}
      <Modal visible={modalNomeVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Alterar Nome</Text>
            <TextInput
              label="Novo Nome"
              value={tempNome}
              onChangeText={setTempNome}
              mode="outlined"
              style={styles.modalInput}
            />
            <View style={styles.modalButtons}>
              <Button
                mode="contained"
                onPress={() => setModalNomeVisible(false)}
                style={[styles.modalButton, { backgroundColor: "#aaa" }]}
              >
                Cancelar
              </Button>
              <Button mode="contained" onPress={handleSalvarNome} style={styles.modalButton}>
                Salvar
              </Button>
            </View>
          </View>
        </View>
      </Modal>

      {/* ============ MODAL para alterar Email ============ */}
      <Modal visible={modalEmailVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Alterar Email</Text>
            <TextInput
              label="Novo Email"
              value={tempEmail}
              onChangeText={setTempEmail}
              mode="outlined"
              style={styles.modalInput}
            />
            <View style={styles.modalButtons}>
              <Button
                mode="contained"
                onPress={() => setModalEmailVisible(false)}
                style={[styles.modalButton, { backgroundColor: "#aaa" }]}
              >
                Cancelar
              </Button>
              <Button mode="contained" onPress={handleSalvarEmail} style={styles.modalButton}>
                Salvar
              </Button>
            </View>
          </View>
        </View>
      </Modal>

      {/* ============ MODAL para alterar Telefone ============ */}
      <Modal visible={modalTelefoneVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Alterar Telefone</Text>
            <TextInput
              label="Novo Telefone"
              value={tempTelefone}
              onChangeText={setTempTelefone}
              mode="outlined"
              style={styles.modalInput}
            />
            <View style={styles.modalButtons}>
              <Button
                mode="contained"
                onPress={() => setModalTelefoneVisible(false)}
                style={[styles.modalButton, { backgroundColor: "#aaa" }]}
              >
                Cancelar
              </Button>
              <Button mode="contained" onPress={handleSalvarTelefone} style={styles.modalButton}>
                Salvar
              </Button>
            </View>
          </View>
        </View>
      </Modal>

      {/* ============ MODAL para alterar TipoConta ============ */}
      <Modal visible={modalTipoContaVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Alterar Tipo de Conta</Text>
            <View style={{ flexDirection: "row", justifyContent: "space-evenly", marginTop: 20 }}>
              <Button
                mode="outlined"
                onPress={async () => {
                  setModalTipoContaVisible(false);
                  selectTipoConta("aluno");
                }}
              >
                Aluno
              </Button>
              <Button
                mode="outlined"
                onPress={async () => {
                  setModalTipoContaVisible(false);
                  selectTipoConta("professor");
                }}
              >
                Professor
              </Button>
            </View>

            <Button
              mode="contained"
              onPress={() => setModalTipoContaVisible(false)}
              style={[styles.modalButton, { marginTop: 20, backgroundColor: "#aaa" }]}
            >
              Fechar
            </Button>
          </View>
        </View>
      </Modal>

      {/* ============ MODAL para alterar Curso (lista de courses) ============ */}
      <Modal visible={modalIdCursoVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContainer, { maxHeight: "60%" }]}>
            <Text style={styles.modalTitle}>Selecionar Curso</Text>
            <ScrollView style={{ marginVertical: 10 }}>
              {courses.map((curso) => (
                <TouchableOpacity
                  key={`curso-${curso.idcurso}`}
                  style={styles.cursoItem}
                  onPress={() => selectCurso(curso)}
                >
                  <Text style={styles.cursoItemText}>{curso.nome}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <Button
              mode="contained"
              onPress={() => setModalIdCursoVisible(false)}
              style={[styles.modalButton, { backgroundColor: "#aaa" }]}
            >
              Cancelar
            </Button>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// =============== ESTILOS ===============
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f7f7f7",
  },
  content: {
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    textAlign: "center",
    marginBottom: 20,
  },
  card: {
    padding: 16,
    borderRadius: 10,
    marginBottom: 15,
    elevation: 3,
  },
  label: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 4,
    color: "#333",
  },
  value: {
    fontSize: 16,
    color: "#555",
    marginBottom: 8,
  },
  alterarButton: {
    alignSelf: "flex-start",
    backgroundColor: "#0056b3",
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  alterarButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "bold",
  },
  voltarButton: {
    marginTop: 20,
    backgroundColor: "#444",
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    width: "85%",
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 20,
    elevation: 4,
    alignItems: "center",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
    textAlign: "center",
  },
  modalInput: {
    width: "100%",
    marginBottom: 15,
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
  },
  modalButton: {
    flex: 1,
    marginHorizontal: 5,
  },

  // Lista de cursos
  cursoItem: {
    padding: 12,
    backgroundColor: "#e0f0ff",
    borderRadius: 6,
    marginVertical: 6,
  },
  cursoItemText: {
    fontSize: 16,
    color: "#0056b3",
  },

  // Modal Reset
  resetModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  resetModalContainer: {
    width: "80%",
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 20,
    elevation: 4,
    alignItems: "center",
  },
  resetModalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
    color: "#333",
    textAlign: "center",
  },
  resetModalMsg: {
    fontSize: 15,
    color: "#555",
    marginBottom: 20,
    textAlign: "center",
  },
  resetModalButton: {
    backgroundColor: "#0056b3",
  },
});
