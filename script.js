// Import Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-app.js";
// TODO: import libraries for Cloud Firestore Database
// https://firebase.google.com/docs/firestore
import { getFirestore, collection, addDoc, getDocs, doc, updateDoc, query, where, deleteDoc } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyCHr1JjEk-uhcZizVy4AuKCIwcO5hpdxFY",
  authDomain: "artdeptinvoicing.firebaseapp.com",
  projectId: "artdeptinvoicing",
  storageBucket: "artdeptinvoicing.firebasestorage.app",
  messagingSenderId: "529335133443",
  appId: "1:529335133443:web:5975182827ef71f8d73536",
  measurementId: "G-NHPQG19YWR"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);


export const addOrder = async function(order){
  const docRef = await addDoc(collection(db, "invoices"), {
    orderName: order,
    isCompleted: false,
  });

  document.getElementById("orderName").value = "";
  
}
