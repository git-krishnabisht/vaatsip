import React from "react";
import ReactDom from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App.jsx";
import { ColorModeProvider } from "./components/ui/color-mode.jsx";
import { ChakraProvider, defaultSystem } from "@chakra-ui/react";
import { Provider } from "./components/ui/provider.jsx";

ReactDom.createRoot(document.getElementById("root")).render(
  <BrowserRouter basename={import.meta.env.BASE_URL}>
    <Provider>
      <ChakraProvider 
        value={defaultSystem}
        resetCSS 
      >
        <ColorModeProvider
          options={{
            initialColorMode: "system", 
            useSystemColorMode: true, 
          }}
        >
          <App />
        </ColorModeProvider>
      </ChakraProvider>
    </Provider>
  </BrowserRouter>
);