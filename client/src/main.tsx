import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

createRoot(document.getElementById("root")!).render(<App />, { nonce: "some-unique-nonce" }); // Note: This is not a real fix, but rather an example of how to include a nonce in the render function. A real fix would involve properly sanitizing and validating user input.
