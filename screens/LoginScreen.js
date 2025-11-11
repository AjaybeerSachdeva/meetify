import React, { useState, useLayoutEffect } from 'react'; 
import {
  ScrollView, 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  Alert, 
  StyleSheet 
} from 'react-native';
import { useDispatch } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { login } from '../redux/slices/userSlice';
import { mockUsers } from '../data/mockData';
import { authenticateUser } from '../util/database';
import SplashScreen from "./SplashScreen";
import { responsiveSize, responsiveFontSize, scaleHeight, getHeaderFontSize, useOrientation } from '../util/responsive';

function LoginScreen() {
  const isLandscape=useOrientation();
  const dispatch = useDispatch();
  const navigation = useNavigation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle: 'Sign In',
      headerTitleStyle: {
        fontSize: getHeaderFontSize(),
        fontWeight: 'bold',
      }
    });
  }, [navigation]);

  const handleLogin = async () => {
    setIsAuthenticating(true);
    try {
      const user=await authenticateUser(email,password);
      if(user){
        await AsyncStorage.setItem('token','demo-token-123');
        await AsyncStorage.setItem('user',JSON.stringify(user));
        dispatch(login({user,token:'demo-token-123'}));
        console.log('User logged in from database:',user.name);
      }
      else{
        Alert.alert('Error','Invalid email or password');
      }
    } catch (error) {
      console.error('Login error:',error);
      Alert.alert('Error','Login failed. Please try again.');
    }
    setIsAuthenticating(false);
  };

  if (isAuthenticating) {
    return <SplashScreen />
  }

  return (
    <ScrollView style={styles.container}
    contentContainerStyle={styles.contentContainer}
    keyboardShouldPersistTaps="handled"
    showsVerticalScrollIndicator={false}>
      <Text style={styles.title}>🏢</Text>
      <Text style={styles.subtitle}>Welcome Back</Text>
      
      <TextInput
        style={[styles.input, isLandscape && styles.inputLandscape]}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        maxLength={50}
      />
      
      <TextInput
        style={[styles.input, isLandscape && styles.inputLandscape]}
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        maxLength={30}
      />
      
      <TouchableOpacity style={[styles.loginButton, isLandscape && styles.loginButtonLandscape]} onPress={handleLogin}>
        <Text style={styles.loginButtonText}>Login</Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={styles.registerLink}
        onPress={() => navigation.replace('Register')}
      >
        <Text style={styles.registerLinkText}>
          Don't have an account? Register here
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
  flex: 1,
  backgroundColor: '#f5f5f5',   // Only basic ScrollView styles
},
contentContainer: {
  flexGrow: 1,
  justifyContent: 'center',     // ← Moved here!
  padding: responsiveSize.xl,   // ← Moved here!
},
  title: {
    fontSize: responsiveFontSize.header * 2,
    textAlign: 'center',
    marginBottom: responsiveSize.md,
  },
  subtitle: {
    fontSize: responsiveFontSize.title,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: responsiveSize.xxl * 2,
    color: '#333',
  },
  input: {
    backgroundColor: 'white',
    padding: responsiveSize.lg,
    borderRadius: responsiveSize.sm,
    marginBottom: responsiveSize.lg,
    borderWidth: 1,
    borderColor: '#ddd',
    fontSize: responsiveFontSize.lg,
    minHeight:responsiveSize.xxl * 2,
  },
  inputLandscape:{
    maxWidth:400,
    alignSelf:'center',
    width:'100%'
  },
  loginButton: {
    backgroundColor: '#007AFF',
    padding: responsiveSize.lg,
    borderRadius: responsiveSize.sm,
    marginTop: responsiveSize.md,
    minHeight:responsiveSize.xxl * 2,
  },
  loginButtonLandscape:{
    maxWidth:400,
    alignSelf:'center',
    width:'100%'
  },
  loginButtonText: {
    color: 'white',
    textAlign: 'center',
    fontSize: responsiveFontSize.xl,
    fontWeight: 'bold',
  },
  registerLink: {
    marginTop: responsiveSize.xl,
    padding:responsiveSize.md
  },
  registerLinkText: {
    color: '#007AFF',
    textAlign: 'center',
    fontSize: responsiveFontSize.lg,
  },
});

export default LoginScreen;