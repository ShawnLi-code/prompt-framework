import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import Popup from "./Popup";
import "./App.css";

const params = new URLSearchParams(window.location.search);
const isPopup = params.get("window") === "popup";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    {isPopup ? <Popup /> : <App />}
  </React.StrictMode>
);
