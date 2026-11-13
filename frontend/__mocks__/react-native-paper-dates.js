import { Button } from "react-native-paper";

export const DIA_ELEGIDO = new Date(2026, 11, 5);
export const HORA_ELEGIDA = { hours: 22, minutes: 0 };

function modal(testID, valor) {
  return function ModalDePrueba({ visible, onConfirm }) {
    if (!visible) return null;
    return <Button testID={testID} onPress={() => onConfirm(valor)} />;
  };
}

export const DatePickerModal = modal("modal-fecha-ok", { date: DIA_ELEGIDO });
export const TimePickerModal = modal("modal-hora-ok", HORA_ELEGIDA);
export const registerTranslation = jest.fn();
export const es = {};
