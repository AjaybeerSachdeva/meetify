import React, { useState, useLayoutEffect } from 'react'; 
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  Alert, 
  StyleSheet,
  ScrollView
} from 'react-native';
import { useDispatch } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { login } from '../redux/slices/userSlice';
import SplashScreen from "./SplashScreen";
import { createUser } from '../util/database';
import { responsiveSize, responsiveFontSize, scaleHeight, getHeaderFontSize, useOrientation } from '../util/responsive';

function RegisterScreen() {
  const isLandscape=useOrientation();
  const dispatch = useDispatch();
  const navigation = useNavigation();
  const [name,setName]=useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [department, setDepartment] = useState('');
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  useLayoutEffect(()=>{
    navigation.setOptions({
      headerTitle: 'Create Account',
      headerTitleStyle: {
        fontSize:getHeaderFontSize(),
        fontWeight:'bold',
      }
    })
  },[navigation]);

  const handleSignUp = async () => {
    setIsAuthenticating(true);

    if(!name || !email || !password){
        Alert.alert('Error', 'Please fill all required fields');
        setIsAuthenticating(false);
        return;
    }

    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      setIsAuthenticating(false);
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert('Error', 'Please enter a valid email address');
      setIsAuthenticating(false);
      return;
    }

    const newUser={
        id:Date.now().toString(),
        name:name,
        email:email,
        password:password,
        department:department || 'General'
    };
        
        try{
          const createdUser=await createUser(newUser);
          console.log('User registered in database:', createdUser.name);
          if(!createdUser){
            throw new Error('User creation failed');
          }
            await AsyncStorage.setItem('token', 'demo-token-123');
            await AsyncStorage.setItem('user', JSON.stringify(createdUser));
            dispatch(login({ user: createdUser, token: 'demo-token-123' }));
        } catch (error) {
            if (error.message && error.message.includes('UNIQUE constraint failed')) {
        Alert.alert('Error', 'This email is already registered. Please use a different email.');
      } else {
        Alert.alert('Error', 'Registration failed. Please try again.');
      }
        }
        setIsAuthenticating(false);
    } 
    

  if (isAuthenticating) {
    return <SplashScreen />
  }

  return (
    <ScrollView 
    style={styles.container}
    contentContainerStyle={styles.contentContainer}
    keyboardShouldPersistTaps="handled"
    showsVerticalScrollIndicator={false}
  >
      <Text style={styles.title}>🏢</Text>
      <Text style={styles.subtitle}>Create your Account</Text>
      
      <TextInput
        style={[styles.input, isLandscape && styles.inputLandscape]}
        placeholder="Full Name *"
        value={name}
        onChangeText={setName}
        autoCapitalize="words"
        maxLength={50}
      />

      <TextInput
        style={[styles.input, isLandscape && styles.inputLandscape]}
        placeholder="Email *"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        maxLength={50}
      />
      
      <TextInput
        style={[styles.input, isLandscape && styles.inputLandscape]}
        placeholder="Password * (min 6 characters)"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        maxLength={50}
      />

      <TextInput
        style={[styles.input, isLandscape && styles.inputLandscape]}
        placeholder="Department (Optional)"
        value={department}
        onChangeText={setDepartment}
        autoCapitalize="words"
        maxLength={50}
      />
      
      <TouchableOpacity 
        style={[
          styles.loginButton, 
          isLandscape && styles.loginButtonLandscape, 
          isAuthenticating && styles.buttonDisabled
        ]}  
        onPress={handleSignUp}
        disabled={isAuthenticating}
      >
        <Text style={styles.loginButtonText}>
          {isAuthenticating ? 'Creating Account...' : 'Register'}
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={styles.registerLink}
        onPress={() => navigation.replace('Login')}
      >
        <Text style={styles.registerLinkText}>
          Already have an account? Login here
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
    backgroundColor: '#28a745',
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
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
  loginButtonText: {
    color: 'white',
    textAlign: 'center',
    fontSize: responsiveFontSize.xl,
    fontWeight: 'bold',
  },
  registerLink: {
    marginTop: responsiveSize.xl,
    padding: responsiveSize.md
  },
  registerLinkText: {
    color: '#007AFF',
    textAlign: 'center',
    fontSize: responsiveFontSize.lg,
  },
});

export default RegisterScreen;