import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Image, Text, TouchableOpacity } from 'react-native';
import { Appbar, Avatar, Menu, Divider, Button, Drawer } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../context/AuthProvider';
import { Ionicons } from '@expo/vector-icons';

const Header = () => {
  const { user, supabase } = useAuth();
  const navigation = useNavigation();
  
  // Controla o estado do menu e drawer
  const [menuVisible, setMenuVisible] = useState(false);
  const [drawerVisible, setDrawerVisible] = useState(false);

  // Estados para dados de utilizador (sem metadata)
  const [nome, setNome] = useState('Carregando...');
  const [apelido, setApelido] = useState('');
  const [telefone, setTelefone] = useState('');
  const [idCurso, setIdCurso] = useState('');
  const [tipoConta, setTipoConta] = useState('');
  const [nomeCurso, setNomeCurso] = useState('Carregando...');

  // 1) Buscar dados do utilizador
  useEffect(() => {
    const fetchUtilizador = async () => {
      if (user) {
        const { data, error } = await supabase
          .from('utilizadores')
          .select('nome, apelido, telefone, idcurso, tipo_conta')
          .eq('id', user.id)
          .maybeSingle();

        if (!error && data) {
          setNome(data.nome);
          setApelido(data.apelido);
          setTelefone(data.telefone);
          setIdCurso(data.idcurso);
          setTipoConta(data.tipo_conta);
        }
      }
    };
    fetchUtilizador();
  }, [user, supabase]);

  // 2) Buscar nome do curso, dado o idCurso
  useEffect(() => {
    const fetchCursoNome = async () => {
      if (idCurso) {
        const { data, error } = await supabase
          .from('curso')
          .select('nome')
          // Se a PK em 'curso' for "id", troque para eq('id', idCurso)
          .eq('idcurso', idCurso)
          .maybeSingle();

        if (!error && data) {
          setNomeCurso(data.nome);
        } else {
          setNomeCurso('Desconhecido');
        }
      }
    };
    fetchCursoNome();
  }, [idCurso, supabase]);

  // Ações do menu e drawer
  const toggleMenu = () => setMenuVisible(!menuVisible);
  const toggleDrawer = () => setDrawerVisible(!drawerVisible);

  const handleLogout = async () => {
    try {
      setMenuVisible(false);
      await supabase.auth.signOut();
      navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
    } catch (error) {
      console.error("Erro ao fazer logout:", error);
    }
  };

  return (
    <>
      <Appbar.Header style={styles.header}>
        {/* Botão lateral esquerdo que abre o Drawer */}
        <TouchableOpacity onPress={toggleDrawer}>
          <Ionicons name="menu" size={28} color="#fff" style={{ marginLeft: 10 }} />
        </TouchableOpacity>

        {/* Logo no centro */}
        <View style={styles.logoContainer}>
          <Image source={require('../assets/logo.jpeg')} style={styles.logo} />
        </View>

        {/* Avatar que mostra o menu do utilizador */}
        <Menu
          visible={menuVisible}
          onDismiss={() => setMenuVisible(false)}
          anchor={
            <TouchableOpacity onPress={toggleMenu} style={{ marginRight: 10 }}>
              <Avatar.Text
                size={40}
                label={nome ? nome[0].toUpperCase() : 'U'}
                style={styles.avatar}
              />
            </TouchableOpacity>
          }
        >
          {/* Dados do utilizador */}
          <View style={styles.userInfoContainer}>
            <View style={styles.infoButton}>
              <Text style={styles.label}>Nome:</Text>
              <Text>{nome} {apelido}</Text>
            </View>
            <View style={styles.infoButton}>
              <Text style={styles.label}>Email:</Text>
              <Text>{user?.email || 'N/A'}</Text>
            </View>
            <View style={styles.infoButton}>
              <Text style={styles.label}>Telefone:</Text>
              <Text>{telefone || 'Sem telefone'}</Text>
            </View>
            <View style={styles.infoButton}>
              <Text style={styles.label}>Curso:</Text>
              <Text>{nomeCurso}</Text>
            </View>
            <View style={styles.infoButton}>
              <Text style={styles.label}>Tipo:</Text>
              <Text>{tipoConta || 'N/A'}</Text>
            </View>
          </View>

          <Divider />

          <Button
            mode="contained"
            style={styles.manageAccountButton}
            onPress={() => {
              setMenuVisible(false);
              navigation.navigate('GerirConta'); 
            }}
          >
            Gerir Conta
          </Button>
            
          <Button
            mode="contained"
            style={styles.achievementsButton}
            onPress={() => {
              setMenuVisible(false);
              navigation.navigate('Conquistas'); 
            }}
          >
            Minhas Conquistas
          </Button>

          {/* ====== NOVO BOTÃO: RANKING GLOBAL ====== */}
          <Button
            mode="contained"
            style={styles.rankingGlobalButton}
            onPress={() => {
              setMenuVisible(false);
              navigation.navigate('Ranking'); // Rota da tela RankingScreen
            }}
          >
            Ranking Global
          </Button>
          {/* ======================================== */}

          <Button
            mode="contained"
            onPress={handleLogout}
            style={styles.logoutButton}
          >
            Sair
          </Button>
        </Menu>
      </Appbar.Header>

      {/* Drawer lateral */}
      {drawerVisible && (
        <View style={styles.drawerContainer}>
          <TouchableOpacity onPress={toggleDrawer} style={styles.drawerToggle}>
            <Ionicons name="menu" size={28} color="#fff" />
          </TouchableOpacity>
          <Drawer.Section style={styles.drawerSection}>
            <Drawer.Item 
              icon="home" 
              label="Início" 
              onPress={() => navigation.navigate('PaginaInicial')} 
              style={styles.drawerItem} 
            />
            <Drawer.Item 
              icon="file-document" 
              label="Exercícios" 
              onPress={() => navigation.navigate('ExerciciosScreen')} 
              style={styles.drawerItem} 
            />
            <Drawer.Item 
              icon="pencil" 
              label="Modo Exame" 
              onPress={() => navigation.navigate('Exames')} 
              style={styles.drawerItem} 
            />
            <Drawer.Item 
              icon="file-document-outline" 
              label="Resumos" 
              onPress={() => navigation.navigate('Resumos')} 
              style={styles.drawerItem} 
            />
          </Drawer.Section>
        </View>
      )}
    </>
  );
};

const styles = StyleSheet.create({
  header: {
    backgroundColor: '#0056b3',
    justifyContent: 'space-between',
    height: 100,
  },
  logoContainer: {
    flex: 1,
    alignItems: 'center',
  },
  logo: {
    width: 80,
    height: 80,
    borderRadius: 20,
  },
  avatar: {
    backgroundColor: '#4caf50',
  },
  userInfoContainer: {
    padding: 15,
    alignItems: 'flex-start',
  },
  infoButton: {
    flexDirection: 'row',
    padding: 8,
    marginVertical: 4,
    backgroundColor: '#f0f4ff',
    borderRadius: 5,
    width: '100%',
    elevation: 2,
    alignItems: 'center',
  },
  label: {
    fontWeight: 'bold',
    color: '#0056b3',
    marginRight: 5,
  },
  manageAccountButton: {
    margin: 10,
    backgroundColor: '#0056b3',
    borderRadius: 5,
  },
  achievementsButton: {
    margin: 10,
    backgroundColor: '#007BFF',
    borderRadius: 5,
  },
  rankingGlobalButton: {
    margin: 10,
    backgroundColor: '#8e44ad',
    borderRadius: 5,
  },
  logoutButton: {
    margin: 10,
    backgroundColor: '#d32f2f',
    borderRadius: 5,
  },
  drawerContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '60%',
    height: '115%',
    backgroundColor: '#0056b3',
    elevation: 5,
    zIndex: 100,
    paddingTop: 120,
  },
  drawerItem: {
    backgroundColor: '#FFFFFF',
    marginVertical: 10,
    marginHorizontal: 10,
    borderRadius: 25,
  },
  drawerToggle: {
    position: 'absolute',
    top: 80,
    right: 20,
  },
});

export default Header;
