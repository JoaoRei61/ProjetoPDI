import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { Appbar, Button, Divider } from 'react-native-paper';
import { useAuth } from '../context/AuthProvider';
import Header from '../componentes/header';
import LoadingScreen from "../screens/LoadingScreen";


const MaterialScreen = ({ route, navigation }) => {
  if (!route || !route.params || !route.params.disciplinaId) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Erro: Nenhuma disciplina selecionada.</Text>
      </View>
    );
  }

  const { disciplinaId } = route.params;
  const { supabase, user, loading } = useAuth();
  const [materialData, setMaterialData] = useState([]);
  const [loadingData, setLoadingData] = useState(true);
  const [professorNome, setProfessorNome] = useState("Professor não encontrado");

  useEffect(() => {
    if (!user && !loading) {
      Alert.alert("Sessão Expirada", "Por favor, faça login novamente.", [
        { text: "OK", onPress: () => navigation.replace("Login") },
      ]);
      return;
    }

    fetchMaterial();
  }, [user]);

  const fetchMaterial = async () => {
    try {
      const { data, error } = await supabase
        .from('materia')
        .select('nome, materia, quizzes, material_aluno')
        .eq('iddisciplina', disciplinaId);

      if (error) {
        console.error('Erro ao buscar materiais:', error);
      } else {
        setMaterialData(data || []);
      }

      const { data: disciplinaData, error: disciplinaError } = await supabase
        .from('disciplinas')
        .select('idprofessor')
        .eq('iddisciplina', disciplinaId)
        .single();

      if (disciplinaError) {
        console.error('Erro ao buscar disciplina:', disciplinaError);
      } else if (disciplinaData?.idprofessor) {
        const { data: professorData, error: professorError } = await supabase
          .from('professores')
          .select('nome')
          .eq('idprofessor', disciplinaData.idprofessor)
          .single();

        if (professorError) {
          console.error('Erro ao buscar nome do professor:', professorError);
        } else {
          setProfessorNome(professorData?.nome || "Professor não encontrado");
        }
      }
    } catch (err) {
      console.error('Erro inesperado:', err);
    }

    setLoadingData(false);
  };

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer}>
      <Header />
      <Appbar.Header style={styles.appbar}>
        <Appbar.BackAction onPress={() => navigation.goBack()} />
        <Appbar.Content title="Material da Disciplina" />
      </Appbar.Header>

      {loadingData ? (
        <ActivityIndicator size="large" color="#6200ea" style={styles.loader} />
      ) : (
        <View style={styles.container}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Material da Disciplina</Text>
            <Divider style={styles.divider} />

            <View style={styles.subSection}>
              <Text style={styles.subSectionTitle}>Material disponibilizado por {professorNome}</Text>
              {materialData.some((material) => material.materia) ? (
                materialData.map(
                  (material, index) =>
                    material.materia && (
                      <Button
                        key={index}
                        mode="contained"
                        onPress={() => navigation.navigate('PDFViewer', { pdfUrl: material.materia })}
                        style={styles.button}
                      >
                        {String(material.nome || `Ver Matéria ${index + 1}`)}
                      </Button>
                    )
                )
              ) : (
                <Text style={styles.noDataText}>Não há dados</Text>
              )}
            </View>

            <View style={styles.subSection}>
              <View style={styles.buttonContainer}>
                <Button
                  mode="contained"
                  style={styles.criarQuizButton}
                  onPress={() => navigation.navigate("QuizScreen", { disciplinaId })}
                >
                  Modo Exame
                </Button>
                <Button
                  mode="contained"
                  style={styles.criarQuizButton}
                  onPress={() => navigation.navigate("CriarQuiz", { disciplinaId })}
                >
                  Criar Quiz
                </Button>
              </View>
            </View>
          </View>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
  },
  appbar: {
    backgroundColor: "#6200ea",
  },
  scrollContainer: {
    flexGrow: 1,
  },
  loader: {
    marginTop: 20,
  },
  section: {
    marginBottom: 30,
    padding: 15,
    backgroundColor: "#f5f5f5",
    borderRadius: 10,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 10,
    color: "#6200ea",
  },
  divider: {
    marginBottom: 10,
  },
  subSection: {
    marginTop: 10,
    padding: 10,
    backgroundColor: "#ffffff",
    borderRadius: 8,
    elevation: 2,
  },
  noDataText: {
    textAlign: "center",
    color: "#888",
    fontSize: 14,
  },
  button: {
    marginVertical: 5,
    backgroundColor: "#6200ea",
  },
  criarQuizButton: {
    backgroundColor: "#03dac6",
    marginTop: 10,
  },
});

export default MaterialScreen;
