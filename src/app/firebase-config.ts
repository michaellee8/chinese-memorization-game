const devFirebaseConfig = {
  apiKey: "AIzaSyC7HdaD6cuebKLB_gatgTy2DXXb2PzL3Eo",
  authDomain: "dsepractice-dev.firebaseapp.com",
  databaseURL:
    "https://dsepractice-dev-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "dsepractice-dev",
  storageBucket: "dsepractice-dev.appspot.com",
  messagingSenderId: "403448510901",
  appId: "1:403448510901:web:45351030c06da645c501fc",
  measurementId: "G-2TL497XNXS",
}

const prodFirebaseConfig = {
  apiKey: "AIzaSyC96haverbY1M9NvMvXSrOM5TGcXZ0XDHU",
  authDomain: "dsepractice-beta.firebaseapp.com",
  projectId: "dsepractice-beta",
  storageBucket: "dsepractice-beta.appspot.com",
  messagingSenderId: "514894173323",
  appId: "1:514894173323:web:d8d3b6baac9a7f07c4b08e",
  measurementId: "G-41NC3XTVRS",
}

export const firebaseConfig =
  import.meta.env.MODE === "production" ? prodFirebaseConfig : devFirebaseConfig
