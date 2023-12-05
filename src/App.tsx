import { Container, CssBaseline } from "@mui/material"
import { useEffect } from "react"
import { AutoSignIn } from "./features/AutoSignIn"

function App() {
  return (
    <>
      <CssBaseline />
      <AutoSignIn />
      <Container maxWidth="sm"></Container>
    </>
  )
}

export default App
