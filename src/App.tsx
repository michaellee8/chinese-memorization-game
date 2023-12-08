import { Container, CssBaseline } from "@mui/material"
import { useEffect } from "react"
import { AutoSignIn } from "./features/AutoSignIn"
import { Game } from "./features/Game"
import { getAuth } from "firebase/auth"
import { useAuthState } from "react-firebase-hooks/auth"
import { useCoreServiceClient } from "./features/CoreService"

function App() {
  const auth = getAuth()
  const [user] = useAuthState(auth)
  const coreServiceClient = useCoreServiceClient()
  return (
    <>
      <CssBaseline />
      <AutoSignIn />
      <Game user={user} coreServiceClient={coreServiceClient} />
    </>
  )
}

export default App
