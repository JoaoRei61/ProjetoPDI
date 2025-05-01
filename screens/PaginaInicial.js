import React, { useEffect, useState, useRef } from 'react';
import {
  View, Text, TouchableOpacity, FlatList, StyleSheet,
  SafeAreaView, ScrollView, Animated
} from 'react-native';
import { useAuth } from '../context/AuthProvider';
import Header from '../componentes/header';
import { Ionicons } from '@expo/vector-icons';
import LoadingScreen from "../screens/LoadingScreen"; // nova linha 11


const PaginaInicial = ({ navigation }) => {
  const { user, supabase } = useAuth();

  const [nome, setNome] = useState('');
  const [idCurso, setIdCurso] = useState(null);

  const [anoSelecionado, setAnoSelecionado] = useState(1);
  const [mostrarAnos, setMostrarAnos] = useState(false);
  const rotateAnim = useRef(new Animated.Value(0)).current;

  const [disciplinasPrimeiroSemestre, setDisciplinasPrimeiroSemestre] = useState([]);
  const [disciplinasSegundoSemestre, setDisciplinasSegundoSemestre] = useState([]);

  const [loading, setLoading] = useState(true); // nova linha 24


  // -------------------------------------------------
  // A) Carregar dados do utilizador
  // -------------------------------------------------
  useEffect(() => {
    const fetchUtilizador = async () => {
      if (user) {
        setLoading(true); // ativa o loading
        const { data: userData, error } = await supabase
          .from('utilizadores')
          .select('idcurso, nome, telefone, tipo_conta')
          .eq('id', user.id)
          .maybeSingle();
  
        if (error) {
          console.log('Erro ao buscar utilizador:', error);
          setLoading(false);
          return;
        }
  
        if (!userData) {
          console.log('Nenhum utilizador encontrado para esse ID:', user.id);
          setLoading(false);
          return;
        }
  
        setNome(userData.nome);
        setIdCurso(userData.idcurso);
        setLoading(false); // desativa o loading
      }
    };
    fetchUtilizador();
  }, [user, supabase]);
  

  // -------------------------------------------------
  // B) Carregar disciplinas quando anoSelecionado ou idCurso mudar
  // -------------------------------------------------
  useEffect(() => {
    if (idCurso) {
      carregarDisciplinas();
    }
  }, [anoSelecionado, idCurso]);

  // -------------------------------------------------
  // C) Carregar disciplinas (curso_disciplina + disciplinas)
  // -------------------------------------------------
  const carregarDisciplinas = async () => {
    try {
      const { data: primeiro, error: erroP } = await supabase
        .from('curso_disciplina')
        .select(`
          ano,
          semestre,
          disciplina:disciplinas(iddisciplina, nome)
        `)
        .eq('idcurso', idCurso)
        .eq('ano', anoSelecionado)
        .eq('semestre', 1);

      const { data: segundo, error: erroS } = await supabase
        .from('curso_disciplina')
        .select(`
          ano,
          semestre,
          disciplina:disciplinas(iddisciplina, nome)
        `)
        .eq('idcurso', idCurso)
        .eq('ano', anoSelecionado)
        .eq('semestre', 2);

      if (erroP) {
        console.log('Erro ao buscar disciplinas (1º semestre):', erroP);
      }
      if (erroS) {
        console.log('Erro ao buscar disciplinas (2º semestre):', erroS);
      }

      const primeiroSemestre = (primeiro || []).map(item => ({
        ...item.disciplina, // { iddisciplina, nome }
      }));
      const segundoSemestre = (segundo || []).map(item => ({
        ...item.disciplina, // { iddisciplina, nome }
      }));

      setDisciplinasPrimeiroSemestre(primeiroSemestre);
      setDisciplinasSegundoSemestre(segundoSemestre);
    } catch (err) {
      console.log('Erro geral ao carregar disciplinas:', err);
    }
  };

  // Navegação
  const navegarParaDisciplinas = (iddisciplina) => {
    navigation.navigate('Disciplinas', { iddisciplina });
  };

  // -------------------------------------------------
  // D) Animação da seta do dropdown de anos
  // -------------------------------------------------
  const animarSeta = (abrir) => {
    Animated.timing(rotateAnim, {
      toValue: abrir ? 1 : 0,
      duration: 200,
      useNativeDriver: true,
    }).start();
  };

  if (loading) return <LoadingScreen onFinish={null} />;

  return (
    <SafeAreaView style={styles.container}>
      <Header navigation={navigation} />

      <ScrollView style={styles.contentContainer}>
        <Text style={styles.welcome}>Olá, {nome || 'Aluno'}!</Text>

        <View style={styles.anoContainer}>
          <TouchableOpacity
            style={styles.dropdownBotao}
            onPress={() => {
              setMostrarAnos(!mostrarAnos);
              animarSeta(!mostrarAnos);
            }}
            activeOpacity={0.85}
          >
            <Text style={styles.dropdownTexto}>Escolhe Ano</Text>
            <Animated.View
              style={{
                transform: [{
                  rotate: rotateAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0deg', '180deg'],
                  }),
                }],
              }}
            >
              <Ionicons name="chevron-down" size={20} color="#fff" />
            </Animated.View>
          </TouchableOpacity>
        </View>

        <View style={styles.anoBadge}>
          <Ionicons
            name="book-outline"
            size={20}
            color="#0d47a1"
            style={{ marginRight: 6 }}
          />
          <Text style={styles.anoBadgeTexto}>
            Estás a ver o {anoSelecionado}º Ano
          </Text>
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
                  animarSeta(false);
                }}
              >
                <Text style={styles.anoTexto}>{ano}º Ano</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* 1º Semestre */}
        <Text style={styles.semestreTitle}>1º Semestre</Text>
        <FlatList
          horizontal
          data={disciplinasPrimeiroSemestre}
          keyExtractor={(item) => item.iddisciplina.toString()}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.disciplinaButton}
              onPress={() => navegarParaDisciplinas(item.iddisciplina)}
            >
              <Text style={styles.disciplinaText}>{item.nome}</Text>
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <Text style={styles.empty}>Sem disciplinas disponíveis.</Text>
          }
        />

        <View style={styles.separator} />

        {/* 2º Semestre */}
        <Text style={styles.semestreTitle}>2º Semestre</Text>
        <FlatList
          horizontal
          data={disciplinasSegundoSemestre}
          keyExtractor={(item) => item.iddisciplina.toString()}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.disciplinaButton}
              onPress={() => navegarParaDisciplinas(item.iddisciplina)}
            >
              <Text style={styles.disciplinaText}>{item.nome}</Text>
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <Text style={styles.empty}>Sem disciplinas disponíveis.</Text>
          }
        />

        <View style={styles.separator} />

        {/* Acesso Rápido */}
        <Text style={styles.acessoRapidoTitle}>Acesso Rápido</Text>
        <View style={styles.acessoRapidoContainer}>
          <TouchableOpacity
            style={styles.botaoAcessoRapido}
            onPress={() => navigation.navigate('ExerciciosScreen')}
          >
            <Ionicons name="document-text" size={24} color="#fff" />
            <Text style={styles.botaoTexto}>Exercícios</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.botaoAcessoRapido}
            onPress={() => navigation.navigate('Exames')}
          >
            <Ionicons name="pencil" size={24} color="#fff" />
            <Text style={styles.botaoTexto}>Exame</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.botaoAcessoRapido}
            onPress={() => navigation.navigate('Resumos')}
          >
            <Ionicons name="book" size={24} color="#fff" />
            <Text style={styles.botaoTexto}>Resumos</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

// -------------------------------------------------
// Estilos
// -------------------------------------------------
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9f9f9' },
  contentContainer: { paddingHorizontal: 20 },
  welcome: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#d32f2f',
    textAlign: 'center',
    marginVertical: 20,
  },
  anoContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 15,
  },
  anosDropdown: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 15,
  },
  dropdownBotao: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#0056b3',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#004399',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
    width: '70%',
    alignSelf: 'center',
  },
  dropdownTexto: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  anoBadge: {
    flexDirection: 'row',
    alignSelf: 'center',
    backgroundColor: '#e3f2fd',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    marginBottom: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  anoBadgeTexto: {
    color: '#0d47a1',
    fontSize: 15,
    fontWeight: '600',
  },
  ano: {
    padding: 10,
    borderRadius: 8,
    backgroundColor: '#ccc',
  },
  anoSelecionado: {
    padding: 10,
    borderRadius: 8,
    backgroundColor: '#0056b3',
  },
  anoTexto: {
    color: '#fff',
  },
  semestreTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginVertical: 30,
    color: '#333',
  },
  disciplinaButton: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    marginHorizontal: 12,
    elevation: 3,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 120,
  },
  disciplinaText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '600',
  },
  empty: {
    fontSize: 14,
    color: '#aaa',
    marginVertical: 15,
  },
  separator: {
    borderBottomColor: '#ddd',
    borderBottomWidth: 1,
    marginVertical: 30,
  },
  acessoRapidoTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 30,
    textAlign: 'center',
  },
  acessoRapidoContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: 30,
  },
  botaoAcessoRapido: {
    alignItems: 'center',
    backgroundColor: '#0056b3',
    padding: 10,
    borderRadius: 10,
    width: 60,
  },
  botaoTexto: {
    color: '#fff',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 5,
  },
});

export default PaginaInicial;
