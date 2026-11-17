import { useRef, useState } from "react";
import { StyleSheet, View } from "react-native";
import { Button, HelperText, Icon, Text, TextInput, useTheme } from "react-native-paper";
import { useAuth } from "../../auth/AuthContext";
import { mensajeDeError } from "../../api/cliente";
import { Pantalla } from "../../components/Pantalla";
import { espaciado } from "../../tema/espaciado";
import { UsuariosDemo } from "./UsuariosDemo";

function CampoEmail({ valor, onCambiar, onSiguiente }) {
  return (
    <TextInput
      label="Email"
      mode="outlined"
      value={valor}
      onChangeText={onCambiar}
      keyboardType="email-address"
      autoCapitalize="none"
      autoComplete="email"
      returnKeyType="next"
      onSubmitEditing={onSiguiente}
      testID="login-email"
    />
  );
}

function CampoPassword({ valor, onCambiar, onEnviar, referencia }) {
  const [visible, setVisible] = useState(false);
  return (
    <TextInput
      ref={referencia}
      label="Contraseña"
      returnKeyType="go"
      onSubmitEditing={onEnviar}
      mode="outlined"
      value={valor}
      onChangeText={onCambiar}
      secureTextEntry={!visible}
      autoCapitalize="none"
      testID="login-password"
      right={
        <TextInput.Icon
          icon={visible ? "eye-off-outline" : "eye-outline"}
          onPress={() => setVisible(!visible)}
          accessibilityLabel={visible ? "Ocultar contraseña" : "Mostrar contraseña"}
          testID="login-ver-password"
        />
      }
    />
  );
}

function useFormularioLogin() {
  const { iniciarSesion } = useAuth();
  const [credenciales, setCredenciales] = useState({ email: "", password: "" });
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState(null);
  const cambiar = (campo) => (valor) => setCredenciales((c) => ({ ...c, [campo]: valor }));
  const completo = credenciales.email.trim() !== "" && credenciales.password !== "";

  async function ingresar() {
    if (!completo || enviando) return;
    setEnviando(true);
    setError(null);
    try {
      await iniciarSesion({ email: credenciales.email.trim(), password: credenciales.password });
    } catch (e) {
      setError(mensajeDeError(e));
      setEnviando(false);
    }
  }

  return { credenciales, setCredenciales, cambiar, enviando, error, completo, ingresar };
}

function Marca() {
  const { colors } = useTheme();
  return (
    <View style={estilos.encabezado}>
      <View testID="login-logo">
        <Icon source="ticket-confirmation" size={56} color={colors.primary} />
      </View>
      <Text variant="headlineMedium">AI Ticket It</Text>
      <Text variant="bodyMedium">Ingresá para comprar o gestionar entradas</Text>
    </View>
  );
}

export default function Login({ mostrarDemo = __DEV__ }) {
  const formulario = useFormularioLogin();
  const { credenciales, cambiar, enviando, error, completo } = formulario;
  const password = useRef(null);
  return (
    <Pantalla scroll bordes={["top", "bottom"]}>
      <Marca />
      <CampoEmail
        valor={credenciales.email}
        onCambiar={cambiar("email")}
        onSiguiente={() => password.current?.focus()}
      />
      <CampoPassword
        valor={credenciales.password}
        onCambiar={cambiar("password")}
        onEnviar={formulario.ingresar}
        referencia={password}
      />
      <HelperText type="error" visible={!!error} testID="login-error">
        {error}
      </HelperText>
      <Button
        mode="contained"
        onPress={formulario.ingresar}
        loading={enviando}
        disabled={!completo || enviando}
        testID="login-ingresar"
      >
        Ingresar
      </Button>
      {mostrarDemo && <UsuariosDemo onElegir={formulario.setCredenciales} />}
    </Pantalla>
  );
}

const estilos = StyleSheet.create({
  encabezado: { gap: espaciado.xs, marginTop: espaciado.xxl, marginBottom: espaciado.lg },
});
