import { View } from "react-native";

export default function MapView({ children, ...props }) {
  return <View {...props}>{children}</View>;
}

export function Marker({ coordinate }) {
  return <View testID="mapa-marcador" coordinate={coordinate} />;
}
