import { Container, CssBaseline } from "@mui/material"
import { useEffect } from "react"
import { AutoSignIn } from "./features/AutoSignIn"
import { Game } from "./features/Game"

function App() {
  return (
    <>
      <CssBaseline />
      <AutoSignIn />
      <Game />
    </>
  )
}

export default App
