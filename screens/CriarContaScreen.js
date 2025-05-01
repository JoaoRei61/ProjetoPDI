import React, { useState, useEffect } from 'react';
import { 
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Modal,
  Image,
  Alert
} from 'react-native';
import supabase from '../supabaseconfig';
import LoadingScreen from '../screens/LoadingScreen'; // nova linha 11


const CriarContaScreen = ({ navigation }) => {
  const [username, setUsername] = useState('');
  const [nome, setNome] = useState('');
  const [apelido, setApelido] = useState('');
  const [telefone, setTelefone] = useState('');
  const [email, setEmail] = useState('');
  const [palavrapasse, setPalavrapasse] = useState('');
  const [cursos, setCursos] = useState([]);
  const [cursoSelecionado, setCursoSelecionado] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [emailModalVisible, setEmailModalVisible] = useState(false);
  const [loading, setLoading] = useState(true); 


  // Buscar lista de cursos para exibir no Modal
  useEffect(() => {
    const fetchCursos = async () => {
      const { data, error } = await supabase
        .from('curso')
        .select('*');
      if (!error) setCursos(data);
    };
  
    fetchCursos();
  
    // simular splash por 1 segundo
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1000);
  
    return () => clearTimeout(timer);
  }, []);
  

  // Validação simples dos campos
  const validarCampos = () => {
    if (!nome.trim()) {
      Alert.alert('Erro', 'Por favor, preencha o nome completo.');
      return false;
    }
    if (!apelido.trim()) {
      Alert.alert('Erro', 'Por favor, introduza um Apelido.');
      return false;
    }
    
    if (!telefone.trim()) {
      Alert.alert('Erro', 'Por favor, insira o número de telemóvel.');
      return false;
    }
    if (!username.trim()) {
      Alert.alert('Erro', 'Por favor, introduza um username.');
      return false;
    }    
    if (!email.trim()) {
      Alert.alert('Erro', 'Por favor, introduza um email válido.');
      return false;
    }
    if (!palavrapasse.trim()) {
      Alert.alert('Erro', 'Por favor, introduza uma palavra-passe.');
      return false;
    }
    if (!cursoSelecionado) {
      Alert.alert('Erro', 'Por favor, selecione um curso.');
      return false;
    }
    return true;
  };

  // Criação de conta + Inserção na tabela `utilizadores` (sem guardar `email`)
  const criarConta = async () => {
    if (!validarCampos()) return;

    setLoading(true); // ativa loading antes de criar conta

    // 1) Criar usuário na autenticação do Supabase
    const { data: user, error } = await supabase.auth.signUp({
      email,
      password: palavrapasse
    });

    if (error) {
      Alert.alert('Erro ao criar conta', error.message);
      console.error('Erro ao criar conta:', error);
      return;
    }

    // 2) Guardar dados adicionais na tabela `utilizadores`
    if (user && user.user) {
      const userId = user.user.id;
      const { error: insertError } = await supabase
        .from('utilizadores')
        .insert([
          {
            id: userId,
            username: username,
            nome: nome,
            apelido:apelido,
            telefone: telefone,
            email:email,
            tipo_conta: 'aluno',
            idcurso: cursoSelecionado,
          
          }
        ]);

      if (insertError) {
        Alert.alert('Erro ao salvar os dados', insertError.message);
        console.error('Erro ao salvar os dados:', insertError);
        return;
      }
    }

    // 3) Exibir modal de confirmação de email
    setLoading(false); // desativa loading após criar conta
    setEmailModalVisible(true);
  };

  if (loading) return <LoadingScreen onFinish={null} />;

  return (
    <View style={styles.container}>
      <Image 
        source={require("../assets/logo.jpeg")} 
        style={styles.logo} 
      />
      <Text style={styles.title}>Criar Conta</Text>

      <TextInput 
        style={styles.input} 
        placeholder="Nome" 
        value={nome} 
        onChangeText={setNome} 
      />
      <TextInput 
        style={styles.input} 
        placeholder="Apelido" 
        value={apelido} 
        onChangeText={setApelido} 
      />

      <TextInput 
        style={styles.input} 
        placeholder="Username" 
        value={username} 
        onChangeText={setUsername} 
      />

      <TextInput 
        style={styles.input} 
        placeholder="Nº de telemóvel" 
        value={telefone} 
        onChangeText={setTelefone} 
        keyboardType="phone-pad" 
      />
      <TextInput 
        style={styles.input} 
        placeholder="Email" 
        value={email} 
        onChangeText={setEmail} 
        keyboardType="email-address" 
      />
      <TextInput 
        style={styles.input} 
        placeholder="Palavra-passe" 
        value={palavrapasse} 
        onChangeText={setPalavrapasse} 
        secureTextEntry 
      />

      {/* Botão que abre o Modal para escolher o curso */}
      <TouchableOpacity 
        style={styles.courseButton} 
        onPress={() => setModalVisible(true)}
      >
        <Text style={styles.courseButtonText}>
          {cursoSelecionado 
            ? cursos.find(c => c.idcurso === cursoSelecionado)?.nome 
            : "Selecionar Curso"
          }
        </Text>
      </TouchableOpacity>

      {/* Modal para lista de cursos */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <FlatList
              data={cursos}
              keyExtractor={(item) => item.idcurso.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.courseItem}
                  onPress={() => {
                    setCursoSelecionado(item.idcurso);
                    setModalVisible(false);
                  }}
                >
                  <Text style={styles.courseItemText}>{item.nome}</Text>
                </TouchableOpacity>
              )}
            />
            <TouchableOpacity 
              style={styles.closeButton} 
              onPress={() => setModalVisible(false)}
            >
              <Text style={styles.closeButtonText}>Fechar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Botão para criar conta */}
      <TouchableOpacity style={styles.button} onPress={criarConta}>
        <Text style={styles.buttonText}>Criar Conta</Text>
      </TouchableOpacity>

      {/* Link para ir ao Login */}
      <TouchableOpacity onPress={() => navigation.navigate('Login')}>
        <Text style={styles.loginText}>Já tem conta? Faça login</Text>
      </TouchableOpacity>

      {/* Modal de confirmação de email */}
      <Modal visible={emailModalVisible} transparent animationType="fade">
        <View style={styles.modalContainer}>
          <View style={styles.emailModalContent}>
            <Text style={styles.emailModalTitle}>📩 Aceda ao seu Email para verificar a conta</Text>
            <Text style={styles.emailModalNote}>
              Nota: Ao confirmar o email, serás redirecionado para uma página que aparecerá NOT FOUND, 
              não ligues pois o email ficará verificado.
            </Text>
            <TouchableOpacity 
              style={styles.emailModalButton} 
              onPress={() => {
                setEmailModalVisible(false);
                navigation.navigate('Login');
              }}
            >
              <Text style={styles.emailModalButtonText}>Entendi, proceder ao login</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

// Mantendo todos os estilos originais
const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  logo: {
    width: 270,
    height: 270,
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  input: {
    width: '100%',
    padding: 10,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    backgroundColor: '#fff',
    marginBottom: 10,
  },
  courseButton: {
    width: '100%',
    padding: 15,
    backgroundColor: '#e0e0e0',
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 10,
  },
  courseButtonText: {
    fontSize: 16,
    color: '#333',
  },
  button: {
    width: '100%',
    backgroundColor: '#0056b3',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginVertical: 5,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  loginText: {
    marginTop: 10,
    color: '#0056b3',
    fontWeight: 'bold',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    width: '80%',
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
  },
  courseItem: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    width: '100%',
    alignItems: 'center',
  },
  courseItemText: {
    fontSize: 16,
    color: '#333',
  },
  closeButton: {
    marginTop: 10,
    padding: 10,
    backgroundColor: '#ff5252',
    borderRadius: 8,
    alignItems: 'center',
    width: '100%',
  },
  closeButtonText: {
    color: '#fff',
    fontSize: 16,
  },
  emailModalContent: {
    width: '80%',
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
  },
  emailModalTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
  },
  emailModalNote: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 20,
    color: '#555',
  },
  emailModalButton: {
    padding: 10,
    backgroundColor: '#0056b3',
    borderRadius: 8,
    alignItems: 'center',
    width: '100%',
  },
  emailModalButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default CriarContaScreen;
