import { Pressable, StyleSheet } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { responsiveSize, getDynamicSize } from "../util/responsive";

function IconButton({ icon, color, size, onPress }) {
  return (
    <Pressable
      style={({ pressed }) => [
                styles.button, 
                pressed && styles.pressed,
                { 
                    width: Math.max(size + responsiveSize.lg, responsiveSize.xxl * 2),
                    height: Math.max(size + responsiveSize.lg, responsiveSize.xxl * 2)
                }
            ]} 
      onPress={onPress}
      testID='icon-button'
    >
      <MaterialIcons name={icon} size={size} color={color} />
    </Pressable>
  );
}

export default IconButton;

const styles = StyleSheet.create({
  button: {
    justifyContent:'center',
    alignItems:'center',
    borderRadius: responsiveSize.xs,
  },
  pressed: {
    opacity: 0.75,
  },
});