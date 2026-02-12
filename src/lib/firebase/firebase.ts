// "use client" solo si usas esto en componentes cliente
import { initializeApp } from "firebase/app"
import { getAuth } from "firebase/auth"
import { getFirestore } from "firebase/firestore"
import { getStorage } from "firebase/storage"

const firebaseConfig = {
    apiKey: "AIzaSyDvsvYEK-Ooix8dG0k0Owb5R9TSzDVsc8c",
    authDomain: "iattend-df79a.firebaseapp.com",
    projectId: "iattend-df79a",
    storageBucket: "iattend-df79a.appspot.com",
    messagingSenderId: "159081793403",
    appId: "1:159081793403:web:76a3d495de96b7fa97dfde",
    measurementId: "G-2K62M7ZB8Z"
}

const app = initializeApp(firebaseConfig)

export const auth = getAuth(app)
export const db = getFirestore(app)
export const storage = getStorage(app)
