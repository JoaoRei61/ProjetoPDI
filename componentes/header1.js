import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Image, Text, TouchableOpacity } from 'react-native';
import { Appbar, Avatar, Menu, Divider, Button, Drawer } from 'react-native-paper';
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
  const [telefone, setTelefone] = useState('');
  const [idCurso, setIdCurso] = useState('');
  const [tipoConta, setTipoConta] = useState('');
  const [nomeCurso, setNomeCurso] = useState('Carregando...');

  useEffect(() => {
    const fetchUtilizador = async () => {
      if (!user) return;
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
    };
    fetchUtilizador();
  }, [user, supabase]);

  useEffect(() => {
    const fetchCursoNome = async () => {
      if (!idCurso) return;
      const { data, error } = await supabase
        .from('curso')
        .select('nome')
        .eq('idcurso', idCurso)
        .maybeSingle();
      setNomeCurso(!error && data ? data.nome : 'Desconhecido');
    };
    fetchCursoNome();
  }, [idCurso, supabase]);

  const toggleMenu = () => setMenuVisible(v => !v);
  const toggleDrawer = () => setDrawerVisible(v => !v);

  const handleLogout = async () => {
    setMenuVisible(false);
    await supabase.auth.signOut();
    navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
  };

  return (
    <>
      <Appbar.Header style={styles.header}>
        <TouchableOpacity onPress={toggleDrawer} style={styles.menuButton}>
          <Ionicons name="menu" size={28} color="#fff" />
        </TouchableOpacity>

        <View style={styles.logoContainer}>
          <Image source={require('../assets/logo.jpeg')} style={styles.logo} />
        </View>

        <Menu
          visible={menuVisible}
          onDismiss={() => setMenuVisible(false)}
          anchor={
            <TouchableOpacity onPress={toggleMenu} style={styles.avatarButton}>
              <Avatar.Text
                size={40}
                label={nome[0]?.toUpperCase() || 'U'}
                style={styles.avatar}
              />
            </TouchableOpacity>
          }>
          <View style={styles.userInfoContainer}>
            <Text style={styles.userName}>{nome} {apelido}</Text>
            <Text style={styles.infoText}>Email: {user?.email}</Text>
            <Text style={styles.infoText}>Tel: {telefone || '-'}</Text>
            <Text style={styles.infoText}>Curso: {nomeCurso}</Text>
            <Text style={styles.infoText}>Tipo: {tipoConta}</Text>
          </View>
          <Divider />
          <Button mode="contained" style={styles.manageAccountButton} onPress={() => { setMenuVisible(false); navigation.navigate('GerirConta'); }}>
            Gerir Conta
          </Button>
          <Button mode="contained" style={styles.achievementsButton} onPress={() => { setMenuVisible(false); navigation.navigate('Conquistas'); }}>
            Minhas Conquistas
          </Button>
          <Button mode="contained" style={styles.logoutButton} onPress={handleLogout}>
            Sair
          </Button>
        </Menu>
      </Appbar.Header>

      {drawerVisible && (
        <View style={styles.drawerContainer}>
          <TouchableOpacity onPress={toggleDrawer} style={styles.drawerClose}>
            <Ionicons name="close" size={28} color="#fff" />
          </TouchableOpacity>
          <Drawer.Section style={styles.drawerSection}>
            <Drawer.Item
              icon="home"
              label="Início"
              onPress={() => { setDrawerVisible(false); navigation.navigate('PaginaInicial'); }}
              style={styles.drawerItem}
            />
            <Drawer.Item
              icon="file-document-edit"
              label="Gerir Exercícios"
              onPress={() => { setDrawerVisible(false); navigation.navigate('GerirExercicios'); }}
              style={styles.drawerItem}
            />
            <Drawer.Item
              icon="file-check"
              label="Validar Resumos"
              onPress={() => { setDrawerVisible(false); navigation.navigate('GerirConteudos'); }}
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
    backgroundColor: 'rgb(129, 235, 235)',
    height: 100,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
  },
  menuButton: { width: 40, alignItems: 'flex-start' },
  logoContainer: { flex: 1, alignItems: 'center' },
  logo: { width: 80, height: 80, borderRadius: 20 },
  avatarButton: { width: 40, alignItems: 'flex-end' },
  avatar: { backgroundColor: '#b71c1c' },
  userInfoContainer: { padding: 15, alignItems: 'flex-start' },
  userName: { fontWeight: 'bold', fontSize: 16, marginBottom: 8, color: '#D32F2F' },
  infoText: { fontSize: 14, marginBottom: 4 },
  manageAccountButton: { margin: 10, backgroundColor: '#0056b3', borderRadius: 5 },
  achievementsButton: { margin: 10, backgroundColor: '#007BFF', borderRadius: 5 },
  logoutButton: { margin: 10, backgroundColor: '#d32f2f', borderRadius: 5 },
  drawerContainer: { position: 'absolute', top: 0, left: 0, width: '60%', height: '100%', backgroundColor: 'rgb(98, 167, 224)', paddingTop: 100, zIndex: 100 },
  drawerClose: { position: 'absolute', top: 50, right: 12 },
  drawerSection: { marginTop: 20 },
  drawerItem: { backgroundColor: '#FFFFFF', marginVertical: 10, marginHorizontal: 10, borderRadius: 25 },
});

export default Header1;
