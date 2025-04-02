import React, { useEffect, useState } from "react";
import { View, StyleSheet, ScrollView, Alert, KeyboardAvoidingView, Platform } from "react-native";
import { Appbar, Button, TextInput, Text, Divider, IconButton, ActivityIndicator } from "react-native-paper";
import { useAuth } from "../context/AuthProvider";
import supabase from "../supabaseconfig";
import Header from "../componentes/header";

const CriarQuizScreen = ({ route, navigation }) => {
  const { supabase, user, loading } = useAuth();
  const { disciplinaId } = route.params;
  const [materias, setMaterias] = useState([]);
  const [materiaSelecionada, setMateriaSelecionada] = useState(null);
  const [novaMateria, setNovaMateria] = useState("");
  const [perguntaTexto, setPerguntaTexto] = useState("");
  const [explicacao, setExplicacao] = useState("");
  const [alternativas, setAlternativas] = useState([
    { texto: "", correta: false },
    { texto: "", correta: false },
    { texto: "", correta: false },
    { texto: "", correta: false },
  ]);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    if (!user && !loading) {
      Alert.alert("Sessão Expirada", "Por favor, faça login novamente.", [
        { text: "OK", onPress: () => navigation.replace("Login") },
      ]);
      return;
    }
    fetchMaterias();
  }, [user]);

  const fetchMaterias = async () => {
    try {
      const { data, error } = await supabase
        .from("materias")
        .select("idmateria, nome")
        .eq("iddisciplina", disciplinaId);

      if (error) {
        console.error("Erro ao buscar matérias:", error);
      } else {
        setMaterias(data);
      }
    } catch (err) {
      console.error("Erro inesperado ao carregar matérias:", err);
    }

    setLoadingData(false);
  };

  const adicionarMateria = async () => {
    if (!novaMateria.trim()) {
      Alert.alert("Erro", "O nome da matéria não pode estar vazio.");
      return;
    }

    try {
      const { data, error } = await supabase.from("materias").insert([
        { nome: novaMateria.trim(), iddisciplina: disciplinaId },
      ]).select();

      if (error) {
        console.error("Erro ao adicionar matéria:", error);
        Alert.alert("Erro", "Não foi possível adicionar a matéria.");
      } else {
        setNovaMateria("");
        fetchMaterias(); // Atualiza a lista de matérias automaticamente
      }
    } catch (err) {
      console.error("Erro inesperado ao adicionar matéria:", err);
    }
  };

  const salvarPergunta = async () => {
    if (!materiaSelecionada) {
      Alert.alert("Erro", "Por favor, selecione uma matéria.");
      return;
    }

    try {
      const { data, error } = await supabase.from("perguntas").insert([
        { idmateria: materiaSelecionada, texto: perguntaTexto.trim(), explicacao: explicacao.trim() },
      ]).select();

      if (error) {
        console.error("Erro ao salvar pergunta:", error);
        Alert.alert("Erro", "Não foi possível salvar a pergunta.");
        return;
      }

      const perguntaId = data[0].idpergunta;

      const alternativasFormatadas = alternativas.map((alt) => ({
        idpergunta: perguntaId,
        texto: alt.texto.trim(),
        correta: alt.correta,
      }));

      const { error: errorAlternativas } = await supabase.from("alternativas").insert(alternativasFormatadas);

      if (errorAlternativas) {
        console.error("Erro ao salvar alternativas:", errorAlternativas);
        Alert.alert("Erro", "Não foi possível salvar as alternativas.");
      } else {
        Alert.alert("Sucesso", "Pergunta e alternativas salvas com sucesso!");
        navigation.goBack();
      }
    } catch (err) {
      console.error("Erro inesperado ao salvar pergunta:", err);
      Alert.alert("Erro", "Ocorreu um erro ao salvar a pergunta.");
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === "ios" ? "padding" : "height"}>
      <Header />
      <Appbar.Header style={styles.appbar}>
        <Appbar.BackAction onPress={() => navigation.goBack()} />
        <Appbar.Content title="Criar Quiz" />
      </Appbar.Header>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.label}>Selecione a Matéria</Text>
        {materias.map((mat) => (
          <Button
            key={mat.idmateria}
            mode={materiaSelecionada === mat.idmateria ? "contained" : "outlined"}
            onPress={() => setMateriaSelecionada(mat.idmateria)}
            style={styles.materiaButton}
          >
            {mat.nome}
          </Button>
        ))}

        <TextInput label="Nova Matéria" value={novaMateria} onChangeText={setNovaMateria} style={styles.input} />
        <Button mode="contained" onPress={adicionarMateria} style={styles.addMateriaButton}>
          Adicionar Matéria
        </Button>

        <TextInput label="Digite a Pergunta" value={perguntaTexto} onChangeText={setPerguntaTexto} style={styles.input} multiline />
        <TextInput label="Explicação" value={explicacao} onChangeText={setExplicacao} style={styles.input} multiline />

        <Divider style={styles.divider} />
        <Text style={styles.subtitle}>Alternativas:</Text>
        {alternativas.map((alt, index) => (
          <View key={index} style={styles.alternativaContainer}>
            <TextInput style={styles.inputAlternativa} label={`Alternativa ${index + 1}`} value={alt.texto} onChangeText={(text) => {
                const novasAlternativas = [...alternativas];
                novasAlternativas[index].texto = text;
                setAlternativas(novasAlternativas);
              }}
            />
            <IconButton icon={alt.correta ? "check-circle" : "circle-outline"} color={alt.correta ? "green" : "gray"} onPress={() => {
                const novasAlternativas = alternativas.map((item, i) => ({
                  ...item,
                  correta: i === index,
                }));
                setAlternativas(novasAlternativas);
              }}
            />
          </View>
        ))}

        <Button mode="contained" onPress={salvarPergunta} style={styles.salvarButton}>
          Salvar Pergunta
        </Button>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f7f7f7" },
  content: { padding: 20 },
  label: { fontSize: 16, fontWeight: "bold", marginBottom: 5 },
  input: { marginBottom: 10 },
  salvarButton: { marginTop: 20 },
  addMateriaButton: { marginTop: 10 },
  materiaButton: { marginVertical: 5 },
});

export default CriarQuizScreen;
