import { HelperText } from "react-native-paper";

export function ErrorCampo({ mensaje, testID }) {
  if (!mensaje) return null;
  return (
    <HelperText type="error" visible testID={testID} accessibilityLiveRegion="polite">
      {mensaje}
    </HelperText>
  );
}
