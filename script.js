// Import Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-app.js";
// TODO: import libraries for Cloud Firestore Database
// https://firebase.google.com/docs/firestore
import { getFirestore, collection, addDoc, getDocs, doc, updateDoc, query, where, deleteDoc, getDoc } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-firestore.js";

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

export const addPrice = async function(){
    var epsonWidth = document.getElementById("epson-width").value;
    var epsonLength = document.getElementById("epson-length").value;
    var epsonPrice = document.getElementById("epson-price").value;
    var epsonPricePerSqIn = epsonPrice/(epsonWidth*epsonLength);

    var foamWidth = document.getElementById("foam-width").value;
    var foamLength = document.getElementById("foam-length").value;
    var foamSheets = document.getElementById("foam-qty(sheets)").value;
    var foamPrice = document.getElementById("foam-price").value;
    var foamArea = foamWidth*foamLength;
    var foamPricePerSqIn = foamPrice/(foamArea*foamSheets);

    var matWidth = document.getElementById("mat-width").value;
    var matLength = document.getElementById("mat-length").value;
    var matSheets = document.getElementById("mat-qty(sheets)").value;
    var matPrice = document.getElementById("mat-price").value;
    var matArea = matWidth*matLength;
    var matPricePerSqIn = matPrice/(matArea*matSheets);

    var inkQTY = document.getElementById("ink-qty(ml)").value;
    var inkCost = document.getElementById("ink-price").value;
    var inkConsumptionPerSqIn = document.getElementById("consumption-perSqIn").value;
    var inkPricePerSqIn = (inkCost/inkQTY)*inkConsumptionPerSqIn;

  const pricesDoc = doc(db,"prices","prices")
  await updateDoc(pricesDoc, {
    epsonPricePerSqIn: epsonPricePerSqIn,
    foamPricePerSqIn: foamPricePerSqIn,
    matPricePerSqIn: matPricePerSqIn,
    inkPricePerSqIn: inkPricePerSqIn,
    
  });
  document.getElementById("epson-width").value = "";
  document.getElementById("epson-length").value = "";
  document.getElementById("epson-price").value = "";

  document.getElementById("foam-width").value = "";
  document.getElementById("foam-length").value = "";
  document.getElementById("foam-qty(sheets)").value = "";
  document.getElementById("foam-price").value = "";

  document.getElementById("mat-width").value = "";
  document.getElementById("mat-length").value = "";
  document.getElementById("mat-qty(sheets)").value = "";
  document.getElementById("mat-price").value = "";

  document.getElementById("ink-qty(ml)").value = "";
  document.getElementById("ink-price").value = "";
  document.getElementById("consumption-perSqIn").value = "";
  
  showPrices();
 
}


export const showPrices = async function(){
    const docRef = doc(db, "prices", "prices");
    const docSnap = await getDoc(docRef);


  document.getElementById("epson-result").innerText = 
  "Calculated price: $" + docSnap.data().epsonPricePerSqIn.toFixed(6) + " per sq in";
  document.getElementById("foam-result").innerText = 
  "Calculated price: $" + docSnap.data().foamPricePerSqIn.toFixed(6) + " per sq in";
  document.getElementById("mat-result").innerText = 
  "Calculated price: $" + docSnap.data().matPricePerSqIn.toFixed(6) + " per sq in";
  document.getElementById("ink-result").innerText = 
  "Calculated price: $" + docSnap.data().inkPricePerSqIn.toFixed(6) + " per sq in";

}






export const createInvoice = async function(){
    var title = document.getElementById("title").value;
    var date = document.getElementById("date").value;
    var width = document.getElementById("width").value;
    var height = document.getElementById("height").value;
    var isFoam = document.getElementById("foamBoard").checked;
    var isMat = document.getElementById("matBoard").checked;
    var mounting = "None";
    var quantity = document.getElementById("quantity").value; 
    var bill = document.getElementById("bill").value;
    var requestFrom = document.getElementById("requestFrom").value;
    var description = document.getElementById("description").value;

    if (isFoam){
        mounting = "Foam Board"
    }
    else if(isMat){
        mounting = "Mat Board"
    }

    const docRef = await addDoc(collection(db, "invoices"),{
        title: title,
        date: date, 
        width: Number(width), 
        height: Number(height), 
        mounting: mounting,
        quantity: Number(quantity), 
        bill: bill, 
        requestFrom: requestFrom, 
        description: description,
    });

    document.getElementById("title").value = "";
    document.getElementById("date").value = "";
    document.getElementById("width").value = "";
    document.getElementById("height").value = "";
    document.getElementById("foamBoard").checked = false;
    document.getElementById("matBoard").checked = false;
    document.getElementById("none").checked = false;
    document.getElementById("quantity").value = "";
    document.getElementById("bill").value = "";
    document.getElementById("requestFrom").value = "";
    document.getElementById("description").value = "";
    // console.log(docRef.title);
    const docSnap = await getDoc(docRef);
    console.log(docSnap.data().title);
    sessionStorage.setItem("orderID", docSnap.id);
    
    location.href = 'output.html';

}

export const showOrders = async function(){
  const orders = document.getElementById("orders");

  orders.innerHTML = ""; 
  
  const ordersQuery = query(collection(db, "invoices"));
  const ordersSnapshot = await getDocs(ordersQuery);
  ordersSnapshot.forEach((item) => {
    // const addToDashboard = document.getElementById("submit-order")
    // addToDashboard.onclick = async function(){
    //   await updateDoc(doc(db, "rectangle", item.id), {
    //     isCompleted: true
    //   });
    //   showItems();
    // }
    const orderTile = document.createElement("div");
    orderTile.className = "orderTile";

    const orderNameLabel = document.createElement("p");
    orderNameLabel.innerHTML = "Order Name:";
    const orderName = document.createElement("p");
    orderName.innerHTML = item.data().title;

    // const width = document.createElement("p");
    // width.innerHTML = item.data().width;
    
    // const widthLabel = document.createElement("p")
    // widthLabel.innerHTML = "Width:"

    orderTile.appendChild(orderNameLabel);
    orderTile.appendChild(orderName);
    // orderTile.appendChild(widthLabel);
    // orderTile.appendChild(width);

    orders.appendChild(orderTile);
    }); //closes loop for incomplete items
}

export const createPDF = async function(){
    const orderID = sessionStorage.getItem("orderID");
    console.log(orderID);
    // const issuedTo = document.getElementById("issued-to");

    // issuedTo.innerHTML = "";
    const docRef = doc(db,  "invoices", orderID);
    const docSnap = await getDoc(docRef);
   

    const issuedNameOutput = document.createElement("div");
    issuedNameOutput.className = "issuedNameOutput";
    const issuedName = document.getElementById("issued-to");
    issuedName.innerHTML = docSnap.data().bill;

    // issuedNameOutput.appendChild(issuedName);
    // issuedTo.appendChild(issuedNameOutput);

    const date = document.getElementById("date");
    // const dateOutput = document.createElement("div");
    // dateOutput.className = "dateOutput";
    // const dateP = document.createElement("p");
    date.innerHTML = docSnap.data().date;

    // dateOutput.appendChild(dateP);
    // date.appendChild(dateOutput);

    const requested = document.getElementById("requested-by");
    // const requestedOutput = document.createElement("div");
    // requestedOutput.className = "requestedOutput";
    // const requestedP = document.createElement("p");
    requested.innerHTML = docSnap.data().requestFrom;

    // requestedOutput.appendChild(requestedP);
    // requested.appendChild(requestedOutput);

    const title = document.getElementById("title");
    title.innerHTML = docSnap.data().title;


}


