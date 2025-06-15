import React, { useEffect, useState, useRef } from 'react';
import {
  View, Text, TouchableOpacity, FlatList, StyleSheet,
  SafeAreaView, ScrollView, Animated
} from 'react-native';
import { useAuth } from '../context/AuthProvider';
import Header from '../componentes/header';
import { Ionicons } from '@expo/vector-icons';
import LoadingScreen from "../screens/LoadingScreen"; // nova linha 11
import PaginaInicial1 from './PaginaInicial1';


const PaginaInicial = ({ navigation }) => {
  const { user, supabase } = useAuth();

  const [nome, setNome] = useState('');
  const [idCurso, setIdCurso] = useState(null);
  const [tipoConta, setTipoConta] = useState(null);
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
        setTipoConta(userData.tipo_conta);  
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

  if (tipoConta === 'docente') {
    return <PaginaInicial1 navigation={navigation} />;
  }

  return (
    <>
    <Header navigation={navigation} />
    <SafeAreaView style={styles.container}>
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
    </>
  );
};

// -------------------------------------------------
// Estilos
// -------------------------------------------------
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#eef2f5',
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingBottom: 60,
  },
  welcome: {
    fontSize: 30,
    fontWeight: '800',
    color: '#1a237e',
    textAlign: 'center',
    marginVertical: 30,
  },
  anoContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 10,
  },
  dropdownBotao: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#3949ab',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 16,
    width: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 6,
  },
  dropdownTexto: {
    fontSize: 17,
    fontWeight: '600',
    color: '#fff',
  },
  anosDropdown: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 25,
  },
  ano: {
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#c5cae9',
    minWidth: 80,
    alignItems: 'center',
  },
  anoSelecionado: {
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#3f51b5',
    minWidth: 80,
    alignItems: 'center',
  },
  anoTexto: {
    color: '#fff',
    fontWeight: '600',
  },
  anoBadge: {
    flexDirection: 'row',
    alignSelf: 'center',
    backgroundColor: '#d1c4e9',
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 25,
    marginBottom: 20,
    alignItems: 'center',
    shadowColor: '#aaa',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  anoBadgeTexto: {
    color: '#1a237e',
    fontSize: 16,
    fontWeight: '600',
  },
  semestreTitle: {
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'left',
    color: '#283593',
    marginBottom: 10,
    marginTop: 30,
  },
  disciplinaButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 16,
    paddingVertical: 20,
    paddingHorizontal: 16,
    marginHorizontal: 10,
    minWidth: 130,
    alignItems: 'center',
    justifyContent: 'center',
    borderColor: '#ddd',
    borderWidth: 1,
    backdropFilter: 'blur(10px)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 4,
  },
  disciplinaText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212121',
    textAlign: 'center',
  },
  empty: {
    fontSize: 14,
    color: '#999',
    marginVertical: 20,
    textAlign: 'center',
  },
  separator: {
    height: 1,
    backgroundColor: '#bbb',
    marginVertical: 40,
    opacity: 0.3,
  },
  acessoRapidoTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1a237e',
    textAlign: 'left',
    marginBottom: 20,
  },
  acessoRapidoContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
  },
  botaoAcessoRapido: {
    alignItems: 'center',
    backgroundColor: '#3949ab',
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 14,
    width: 90,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  botaoTexto: {
    color: '#fff',
    fontSize: 13,
    textAlign: 'center',
    marginTop: 8,
    fontWeight: '500',
  },
});


export default PaginaInicial;