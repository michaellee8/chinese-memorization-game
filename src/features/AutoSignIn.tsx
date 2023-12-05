import { Snackbar } from "@mui/material"
import { FirebaseError } from "firebase/app"
import { getAuth, signInAnonymously } from "firebase/auth"
import { useEffect, useState } from "react"

export function AutoSignIn() {
  const [snackbarMessage, setSnackbarMessage] = useState("")
  const [openSnackbar, setOpenSnackbar] = useState(false)
  useEffect(() => {
    async function performSignIn() {
      const auth = getAuth()
      try {
        await signInAnonymously(auth)
        console.info("successfully signed in with firebase auth")
      } catch (err) {
        console.error("firebase annoymus sign in error", err)
        setSnackbarMessage(
          `無法以遊客帳戶登入: ${
            (err as FirebaseError)?.message ?? "未知錯誤"
          }`,
        )
        setOpenSnackbar(true)
      }
    }
    performSignIn()
  }, [])
  return (
    <>
      <Snackbar
        open={openSnackbar}
        autoHideDuration={6000}
        onClose={() => {
          setOpenSnackbar(false)
        }}
        message={snackbarMessage}
      />
    </>
  )
}
