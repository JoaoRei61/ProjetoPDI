import React, { useEffect, useState } from "react";
import { View, StyleSheet, ScrollView, Alert } from "react-native";
import { Appbar, List, Button, ActivityIndicator, TextInput, Checkbox, Text } from "react-native-paper";
import supabase from "../supabaseconfig";

const QuizScreen = ({ route, navigation }) => {
  const { disciplinaId } = route.params;
  const [materias, setMaterias] = useState([]);
  const [selectedMaterias, setSelectedMaterias] = useState([]);
  const [numPerguntas, setNumPerguntas] = useState("5");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const fetchMaterias = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("materias")
        .select("*")
        .eq("iddisciplina", disciplinaId);

      if (error) {
        console.error("Erro ao buscar matérias:", error);
        setErrorMessage("Erro ao carregar as matérias.");
      } else {
        if (data.length === 0) {
          setErrorMessage("Não há matérias disponíveis para esta disciplina.");
        } else {
          setMaterias(data);
        }
      }
      setLoading(false);
    };
    fetchMaterias();
  }, [disciplinaId]);

  const handleMateriaToggle = (idmateria) => {
    setSelectedMaterias((prev) =>
      prev.includes(idmateria) ? prev.filter((id) => id !== idmateria) : [...prev, idmateria]
    );
  };

  const iniciarQuiz = async () => {
    if (selectedMaterias.length === 0) {
      alert("Selecione pelo menos uma matéria.");
      return;
    }

    let totalPerguntasDisponiveis = 0;

    const perguntasPorMateria = await Promise.all(
      selectedMaterias.map(async (idmateria) => {
        const { data, error } = await supabase
          .from("perguntas")
          .select("*")
          .eq("idmateria", idmateria);

        if (error) {
          console.error("Erro ao buscar perguntas:", error);
          return 0;
        }
        return data.length;
      })
    );

    totalPerguntasDisponiveis = perguntasPorMateria.reduce((acc, curr) => acc + curr, 0);

    if (totalPerguntasDisponiveis < parseInt(numPerguntas, 10)) {
      Alert.alert(
        "Perguntas Insuficientes",
        `Existem apenas ${totalPerguntasDisponiveis} perguntas disponíveis para as matérias selecionadas. Continuar com o quiz?`,
        [
          { text: "Cancelar", style: "cancel" },
          {
            text: "Continuar",
            onPress: () => {
              navigation.navigate("QuizPerguntasScreen", {
                selectedMaterias,
                numPerguntas: totalPerguntasDisponiveis,
              });
            },
          },
        ]
      );
    } else {
      navigation.navigate("QuizPerguntasScreen", {
        selectedMaterias,
        numPerguntas: parseInt(numPerguntas, 10),
      });
    }
  };

  return (
    <View style={styles.container}>
      <Appbar.Header style={styles.appbar}>
        <Appbar.Action icon="arrow-left" onPress={() => navigation.goBack()} />
        <Appbar.Content title="Realizar Quiz" />
      </Appbar.Header>

      {loading ? (
        <ActivityIndicator animating={true} size="large" color="#6200ea" style={styles.loader} />
      ) : (
        <ScrollView contentContainerStyle={styles.content}>
          {errorMessage ? (
            <Text style={styles.errorMessage}>{errorMessage}</Text>
          ) : (
            <>
              <Text variant="titleMedium">Selecione as matérias:</Text>
              {materias.map((materia) => (
                <List.Item
                  key={materia.idmateria}
                  title={materia.nome}
                  left={() => (
                    <Checkbox
                      status={selectedMaterias.includes(materia.idmateria) ? "checked" : "unchecked"}
                      onPress={() => handleMateriaToggle(materia.idmateria)}
                    />
                  )}
                />
              ))}

              <TextInput
                label="Número de Perguntas"
                value={numPerguntas}
                onChangeText={setNumPerguntas}
                keyboardType="numeric"
                style={styles.input}
              />

              <Button mode="contained" onPress={iniciarQuiz} style={styles.startButton}>
                Iniciar Quiz
              </Button>
            </>
          )}
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex:1, backgroundColor: "#f7f7f7" },
  appbar: { backgroundColor: "#6200ea", elevation: 4 },
  loader: { marginTop: 20 },
  content: { padding: 16 },
  input: { marginTop: 16, marginBottom: 20 },
  startButton: { backgroundColor: "#6200ea", padding: 8 },
  errorMessage: {
    color: "red",
    fontSize: 16,
    textAlign: "center",
    marginTop: 20,
  },
});

export default QuizScreen;
