import React from 'react';
import { View, Button, Text } from 'react-native';
import { useAuth } from '../context/AuthProvider';

export default function ProfileScreen() {
  const { user, supabase } = useAuth();

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  return (
    <View>
      <Text>Bem-vindo, {user?.email}</Text>
      <Button title="Logout" onPress={handleLogout} />
    </View>
  );
}
