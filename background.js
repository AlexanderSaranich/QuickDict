import { initializeApp } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword } from "firebase/auth";
import { distance, closest } from "fastest-levenshtein";
const firebaseConfig = {
  apiKey: "AIzaSyC8S5rt-xT0e-x6DDZbhro2zHjtuKX16Oc",
  authDomain: "quick-dict-90f49.firebaseapp.com",
  projectId: "quick-dict-90f49",
  storageBucket: "quick-dict-90f49.firebasestorage.app",
  messagingSenderId: "170646181573",
  appId: "1:170646181573:web:d580c74b36cf675c8642ac",
  measurementId: "G-9F1HSKJ4BF"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

let englishDict = [];

// Load the dictionary when the background script starts
fetch(chrome.runtime.getURL('meta/english.txt'))
  .then(r => r.text())
  .then(text => {
    englishDict = text.split(/\r?\n/);
  });

function levanshtein(word) {
  return closest(word,englishDict)
}

chrome.runtime.onMessage.addListener((message, sender, sendresponse) => {
  if (message.type === "levanshtein") {
    sendresponse(levanshtein(message.data))
  }
  if (message.type == 'createUserWithEmailAndPassword') {
        (async () => {
            try {          
                const userCredential = await createUserWithEmailAndPassword(auth,message.data.email,message.data.pass)
                const user = userCredential.user
                console.log("welcome, " + user.uid)
            } catch (e) {
                if (e.code === 'auth/email-already-in-use') {
        alert("That email is already registered.");
    } else if (e.code === 'auth/weak-password') {
        alert("Password is too weak.");
    } else {
        console.error(e.message);
    }
            }
        })();
    }
    // handle logout
    if (message.command == 'logoutAuth'){
    }
})