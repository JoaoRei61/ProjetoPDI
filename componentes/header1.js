import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Image, Text, TouchableOpacity } from 'react-native';
import { Appbar, Avatar, Menu, Divider, Button, Drawer } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../context/AuthProvider';
import { Ionicons } from '@expo/vector-icons';
import { TouchableWithoutFeedback } from 'react-native';


const Header1 = () => {
  const { user, supabase } = useAuth();
  const navigation = useNavigation();

  const [menuVisible, setMenuVisible] = useState(false);
  const [drawerVisible, setDrawerVisible] = useState(false);

  const [nome, setNome] = useState('Carregando...');
  const [apelido, setApelido] = useState('');
  const [telefone, setTelefone] = useState('');
  
  const [tipoConta, setTipoConta] = useState('');
 
  useEffect(() => {
    const fetchUtilizador = async () => {
      if (!user) return;
      const { data, error } = await supabase
        .from('utilizadores')
        .select('nome, apelido, telefone, tipo_conta')
        .eq('id', user.id)
        .maybeSingle();
      if (!error && data) {
        setNome(data.nome);
        setApelido(data.apelido);
        setTelefone(data.telefone);
  
        setTipoConta(data.tipo_conta);
      }
    };
    fetchUtilizador();
  }, [user, supabase]);

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
            
            <View style={styles.infoButton}>
            <Text style={styles.label}>Email: {user?.email}</Text>
            </View>
            <View style={styles.infoButton}>
            <Text style={styles.label}>Tel: {telefone || '-'}</Text>
            </View>
            <View style={styles.infoButton}>
            <Text style={{ color: 'rgb(197, 3, 3)', fontSize: 16, fontWeight: 'bold' }}>
              {tipoConta}
            </Text>

            </View>
          </View>
          <Divider />
          <Button mode="contained" style={styles.logoutButton} onPress={handleLogout}>
            Log Out
          </Button>
        </Menu>
      </Appbar.Header>

      {drawerVisible && (
  <TouchableWithoutFeedback onPress={() => setDrawerVisible(false)}>
    <View style={styles.drawerOverlay}>
      <TouchableWithoutFeedback>
        <View style={styles.drawerContainer}>
          <TouchableOpacity onPress={toggleDrawer} style={styles.drawerClose}>
            <Ionicons name="close" size={28} color="#fff" />
          </TouchableOpacity>
          <Drawer.Section style={styles.drawerSection}>
            <Drawer.Item
              icon="home"
              label="Início"
              onPress={() => {
                setDrawerVisible(false);
                navigation.navigate('PaginaInicial');
              }}
              style={styles.drawerItem}
            />
            <Drawer.Item
              icon="file-document-edit"
              label="Gerir Exercícios"
              onPress={() => {
                setDrawerVisible(false);
                navigation.navigate('GerirExercicios');
              }}
              style={styles.drawerItem}
            />
            <Drawer.Item
              icon="file-check"
              label="Validar Resumos"
              onPress={() => {
                setDrawerVisible(false);
                navigation.navigate('GerirConteudos');
              }}
              style={styles.drawerItem}
            />
          </Drawer.Section>
        </View>
      </TouchableWithoutFeedback>
    </View>
  </TouchableWithoutFeedback>
)}
    </>
  );
};

const styles = StyleSheet.create({
  drawerOverlay: {
  position: 'absolute',
  top: 0,
  left: 0,
  width: '100%',
  height: '100%',
  backgroundColor: 'rgba(0,0,0,0.2)',
  zIndex: 99,
},

  header: {
    backgroundColor: 'rgb(129, 235, 235)',
    height: 100,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
  },
   label: {
    fontWeight: 'bold',
    color: '#0056b3',
    marginRight: 5,
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
  menuButton: { width: 40, alignItems: 'flex-start' },
  logoContainer: { flex: 1, alignItems: 'center' },
  logo: { width: 80, height: 80, borderRadius: 20 },
  avatarButton: { width: 40, alignItems: 'flex-end' },
  avatar: { backgroundColor: '#b71c1c' },
  userInfoContainer: { padding: 20, alignItems: 'flex-start' },
  userName: { fontWeight: 'bold', fontSize: 16, marginBottom: 8, color: '#D32F2F' },
  infoText: { fontSize: 14, marginBottom: 4 },
  
  logoutButton: { margin: 10, backgroundColor: '#d32f2f', borderRadius: 5 },
  drawerContainer: { position: 'absolute', top: 0, left: 0, width: '60%', height: '100%', backgroundColor: 'rgb(98, 167, 224)', paddingTop: 100, zIndex: 100 },
  drawerClose: { position: 'absolute', top: 50, right: 12 },
  drawerSection: { marginTop: 20 },
  drawerItem: { backgroundColor: '#FFFFFF', marginVertical: 10, marginHorizontal: 10, borderRadius: 25 },
});

export default Header1;
