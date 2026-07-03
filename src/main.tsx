import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import i18n from "./i18n/i18n";

document.documentElement.dir = i18n.language === "ar" ? "rtl" : "ltr";

createRoot(document.getElementById("root")!).render(<App />);
