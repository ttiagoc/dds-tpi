import { render, screen } from "@testing-library/react-native";
import { PaperProvider } from "react-native-paper";
import Inicio from "../app/index";

it("muestra el nombre de la app", async () => {
  await render(
    <PaperProvider>
      <Inicio />
    </PaperProvider>,
  );
  expect(screen.getByText("AI Ticket It")).toBeTruthy();
});
