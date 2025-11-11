import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { responsiveSize, responsiveFontSize } from '../util/responsive';

function SplashScreen() {
  return (
    <View style={styles.rootContainer}>
      <Text style={styles.message}>Loading...</Text>
      <ActivityIndicator size="large" />
    </View>
  );
}

export default SplashScreen;

const styles = StyleSheet.create({
  rootContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: responsiveSize.xxl + responsiveSize.sm,
  },
  message: {
    fontSize: responsiveFontSize.lg,
    marginBottom: responsiveSize.md,
    color: '#666',
  },
});
