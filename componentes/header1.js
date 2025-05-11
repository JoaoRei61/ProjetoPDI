import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Image, Text, TouchableOpacity } from 'react-native';
import { Appbar, Avatar, Menu, Divider, Drawer, Button } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../context/AuthProvider';
import { Ionicons } from '@expo/vector-icons';

const Header1 = () => {
  const { user, supabase } = useAuth();
  const navigation = useNavigation();

  const [menuVisible, setMenuVisible] = useState(false);
  const [drawerVisible, setDrawerVisible] = useState(false);

  const [nome, setNome] = useState('Carregando...');
  const [apelido, setApelido] = useState('');
  const [tipoConta, setTipoConta] = useState('');

  useEffect(() => {
    const fetchUtilizador = async () => {
      if (user) {
        const { data, error } = await supabase
          .from('utilizadores')
          .select('nome, apelido, tipo_conta')
          .eq('id', user.id)
          .maybeSingle();
        if (!error && data) {
          setNome(data.nome);
          setApelido(data.apelido);
          setTipoConta(data.tipo_conta);
        }
      }
    };
    fetchUtilizador();
  }, [user, supabase]);

  const toggleMenu = () => setMenuVisible(!menuVisible);
  const toggleDrawer = () => setDrawerVisible(!drawerVisible);

  const handleLogout = async () => {
    try {
      setMenuVisible(false);
      await supabase.auth.signOut();
      navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
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
                label={nome ? nome[0].toUpperCase() : 'P'}
                style={styles.avatar}
              />
            </TouchableOpacity>
          }
        >
          <View style={styles.userInfoContainer}>
            <Text style={styles.label}>{nome} {apelido}</Text>
            <Text style={styles.label}>Tipo: {tipoConta}</Text>
          </View>
          <Divider />
          <Button
            mode="contained"
            style={styles.logoutButton}
            onPress={handleLogout}
          >
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
              icon="file-cog"
              label="Gerir Conteúdos"
              onPress={() => {
                setDrawerVisible(false);
                navigation.navigate('GerirConteudos');
              }}
              style={styles.drawerItem}
            />
            <Drawer.Item
              icon="file-document-edit"
              label="Gerir Resumos"
              onPress={() => {
                setDrawerVisible(false);
                navigation.navigate('SubmissoesResumos');
              }}
              style={styles.drawerItem}
            />
            <Drawer.Item
              icon="chart-bar"
              label="Ranking"
              onPress={() => {
                setDrawerVisible(false);
                navigation.navigate('Ranking');
              }}
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
    backgroundColor: '#D32F2F',
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
    backgroundColor: '#b71c1c',
  },
  userInfoContainer: {
    padding: 15,
    alignItems: 'flex-start',
  },
  label: {
    fontWeight: 'bold',
    color: '#D32F2F',
    marginVertical: 4,
  },
  drawerContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '60%',
    height: '115%',
    backgroundColor: '#D32F2F',
    elevation: 5,
    zIndex: 100,
    paddingTop: 120,
  },
  drawerSection: {
    marginTop: 20,
  },
  drawerItem: {
    backgroundColor: '#fff',
    marginVertical: 10,
    marginHorizontal: 10,
    borderRadius: 25,
  },
  drawerToggle: {
    position: 'absolute',
    top: 80,
    right: 20,
  },
  logoutButton: {
    margin: 10,
    backgroundColor: '#b71c1c',
    borderRadius: 5,
  },
});

export default Header1;
