import React from "react"
import ReactDOM from "react-dom/client"
import App from "./App"
import "./index.css"
import "@fontsource/roboto/300.css"
import "@fontsource/roboto/400.css"
import "@fontsource/roboto/500.css"
import "@fontsource/roboto/700.css"
import { initializeApp } from "firebase/app"
import { firebaseConfig } from "./app/firebase-config"
import { initializeAnalytics } from "firebase/analytics"

const firebaseApp = initializeApp(firebaseConfig)
initializeAnalytics(firebaseApp)

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
