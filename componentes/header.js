import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Image, Text, TouchableOpacity } from 'react-native';
import { Appbar, Avatar, Menu, Divider, Button, Drawer } from 'react-native-paper';
import { useNavigation, CommonActions } from '@react-navigation/native';
import { useAuth } from '../context/AuthProvider';
import { Ionicons } from '@expo/vector-icons';

const Header = () => {
  const { user, logout, supabase } = useAuth();
  const navigation = useNavigation();
  const [menuVisible, setMenuVisible] = useState(false);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [nomeCurso, setNomeCurso] = useState('Carregando...');

  useEffect(() => {
    const fetchCursoNome = async () => {
      if (user?.user_metadata?.idcurso) {
        const { data } = await supabase
          .from('cursos')
          .select('nome')
          .eq('idcurso', user.user_metadata.idcurso)
          .single();

        if (data) setNomeCurso(data.nome);
      }
    };

    fetchCursoNome();
  }, [user, supabase]);

  const toggleMenu = () => setMenuVisible(!menuVisible);
  const toggleDrawer = () => setDrawerVisible(!drawerVisible);

  const handleLogout = async () => {
    try {
      setMenuVisible(false);
      await supabase.auth.signOut();
      navigation.reset({
        index: 0,
        routes: [{ name: 'Login' }],
      });
    } catch (error) {
      console.error("Erro ao fazer logout:", error);
    }
  };

  return (
    <>
      <Appbar.Header style={styles.header}>
        <TouchableOpacity onPress={toggleDrawer}>
          <Ionicons name="menu" size={28} color="#fff" style={{ marginLeft: 10 }} />
        </TouchableOpacity>

        <View style={styles.logoContainer}>
          <Image source={require('../assets/logo.jpeg')} style={styles.logo} />
        </View>

        <Menu
          visible={menuVisible}
          onDismiss={() => setMenuVisible(false)}
          anchor={
            <TouchableOpacity onPress={toggleMenu} style={{ marginRight: 10 }}>
              <Avatar.Text
                size={40}
                label={user?.user_metadata?.nome ? user.user_metadata.nome[0].toUpperCase() : 'U'}
                style={styles.avatar}
              />
            </TouchableOpacity>
          }
        >
          <View style={styles.userInfoContainer}>
            <View style={styles.infoButton}>
              <Text style={styles.label}>Nome:</Text>
              <Text>{user?.user_metadata?.nome || 'N/A'}</Text>
            </View>
            <View style={styles.infoButton}>
              <Text style={styles.label}>Email:</Text>
              <Text>{user?.email || 'N/A'}</Text>
            </View>
            <View style={styles.infoButton}>
              <Text style={styles.label}>Telefone:</Text>
              <Text>{user?.user_metadata?.telefone || 'Sem telefone'}</Text>
            </View>
            <View style={styles.infoButton}>
              <Text style={styles.label}>Curso:</Text>
              <Text>{nomeCurso}</Text>
            </View>
          </View>

          <Divider />

          <Button mode="contained" style={styles.manageAccountButton} onPress={() => {
              setMenuVisible(false);
              navigation.navigate('GerirConta'); 
            }}>Gerir Conta</Button>
            
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

          <Button mode="contained" onPress={handleLogout} style={styles.logoutButton}>
            Sair
          </Button>
        </Menu>
      </Appbar.Header>

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
              onPress={() => navigation.navigate('ExameScreen')} 
              style={styles.drawerItem} 
            />
            <Drawer.Item 
              icon="file-document-outline" 
              label="Resumos" 
              onPress={() => navigation.navigate('ResumosScreen')} 
              style={styles.drawerItem} 
            />
            <Drawer.Item 
              icon="check-circle-outline" 
              label="Testes Personalizados" 
              onPress={() => navigation.navigate('Testes')} 
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
