// Import Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-app.js";
// TODO: import libraries for Cloud Firestore Database
// https://firebase.google.com/docs/firestore

import { getFirestore, collection, addDoc, getDocs, doc, updateDoc, query, where, deleteDoc, getDoc } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-firestore.js";

import { GoogleAuthProvider, signInWithPopup, onAuthStateChanged, signOut, getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-auth.js";


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
const auth = getAuth(app);

//logs in a user and redirects them to the dashboard page
export const login = function (email, password){
  signInWithEmailAndPassword(auth, email, password)
  .then((userCredential) => {
    const user = userCredential.user;
    location.replace('index.html');
  })
  .catch((error) => {
    const errorCode = error.code;
    const errorMessage = error.message; 
    return errorCode
  });
}
//makes sure login page cannot be bypassed - forces user to login page if not signed in already
export const checkLogin = async function(){
  console.log("checking that the user is logged in")
  auth.onAuthStateChanged((user) => {
    console.log(user);
    if(!user){
      //user is not signed in; redirect to login page
      window.location.href = "login.html"; //adjust the path as needed
    }
  });
}
//signs out the user
export const logout = () => {
  signOut(auth).then(() =>{
    console.log("User signed out"); 
    document.getElementById("userInfo").innerText = "Not signed in";
  });
}

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


// This fucntion creates invoice entries in firebase based on form input values. It reads the first order fields from the form, then loops through
// all elements like width or height and saves each as a separate invoice document
// The fucntion stores the last document ID in sessionStorage and redirects to output.html.
export const createInvoice = async function(){
    var inputs = document.getElementsByTagName("input");
    var descriptions = document.getElementsByTagName("textarea");
    console.log(inputs);

     for(let i = 0; i < inputs.length; i++){

        if(inputs[i].value.length === 0 && inputs[i].type !== "radio"){
            alert("You have one or more empty fields.");
            return;
        }
    }
    //  Get the first order fields based on their ids except for the mounting
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
    // Determine mounting type for the first order
    if (isFoam){
        mounting = "Foam Board"
    }
    else if(isMat){
        mounting = "Mat Board"
    }
    // Save the first order to firebase
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
        isCompleted: false 
    });
    //Loop through all the rest of orders (starting at index 10, every 8 elements like title, width....)
    var counter = 1;
    var counter = 1;
    for(var i = 10; i < inputs.length; i+=7){
        console.log(inputs[i].value);
        if (inputs[i+3].checked){
            mounting = "Foam Board"
        }
        else if(inputs[i+4].checked){
            mounting = "Mat Board"
        }
        else{
            mounting = "None"
        }
    // Save rest of  orders' elements to firebase
        const docRef = await addDoc(collection(db, "invoices"),{
            title: inputs[i].value,
            date: date, 
            width: Number(inputs[i+1].value,), 
            height: Number(inputs[i+2].value,), 
            mounting: mounting,
            quantity: Number(inputs[i+6].value,), 
            bill: bill, 
            requestFrom: requestFrom, 
            description: descriptions[counter].value,
            isCompleted: false 
        });
        counter++;

    }
   // Get all order tiles (first + added ones)
    // Store the last order's id in sessionStorage and direct to the output page
    const docSnap = await getDoc(docRef);
    sessionStorage.setItem("orderID", docSnap.id);
    
    location.href = 'output.html';

}



// calculates the  total price for a group of orders sharing the same date and person as the current order stored in sessionStorage.
// price is based on quantity, mounting type, and per-sq-inch rate from firebase. Then, displays total in the invoice page
export const calculatePrice = async function() {

  // Retrieve the current order from firebase using the id saved in sessionStorage
  const orderID = sessionStorage.getItem("orderID");
  const orderRef = doc(db, "invoices", orderID);
  const orderSnap = await getDoc(orderRef);
  //get price rates from firebase
  const pricesRef = doc(db, "prices", "prices");
  const pricesSnap = await getDoc(pricesRef);

  // get all the orders with the same date + person
  const ordersQuery = query(
      collection(db, "invoices"),
      where("date", "==", orderSnap.data().date),
      where("requestFrom", "==", orderSnap.data().requestFrom)
  );
  const ordersSnapshot = await getDocs(ordersQuery);
  // get individual price rates
  var epsonPricePerSqIn = pricesSnap.data().epsonPricePerSqIn;
  var foamPricePerSqIn = pricesSnap.data().foamPricePerSqIn;
  var matPricePerSqIn = pricesSnap.data().matPricePerSqIn;
  var inkPricePerSqIn = pricesSnap.data().inkPricePerSqIn;

  var grandTotal = 0;

  // Loop through every order in the group
  ordersSnapshot.forEach((item) => {
      const data = item.data();
      var priceEach = 0;
    // calculate price per unit based on mounting type and size
      if (data.mounting == "Foam Board") {
          priceEach = data.width * data.height * (foamPricePerSqIn + inkPricePerSqIn + epsonPricePerSqIn);
      } else if (data.mounting == "Mat Board") {
          priceEach = data.width * data.height * (matPricePerSqIn + inkPricePerSqIn + epsonPricePerSqIn);
      } else {
          priceEach = data.width * data.height * (inkPricePerSqIn + epsonPricePerSqIn);
      }
    // multiply by quantity and add to the total price
      grandTotal += priceEach * data.quantity;
  });
  // format it to usd displaying
  let USDollar = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });
  document.getElementById("total").innerHTML = USDollar.format(grandTotal);
  return grandTotal;
}

export const applyDiscount= async function() {
  const grandTotal = await calculatePrice();
  const discountType = document.getElementById("discount-type").value;
  const amountInput = document.getElementById("discount-amount").value;
  var finalTotal=0;
  if (amountInput === "" || isNaN(amountInput)) {
    alert("Please enter a discount value");
    return;
  }
  const value = parseFloat(amountInput);

  if (discountType === "percent") {
    finalTotal = grandTotal - (grandTotal * value / 100);
  } 
  else if (discountType === "dollar amount") {
    finalTotal = grandTotal - value; 
  }

  if (finalTotal < 0) finalTotal = 0;

  let USDollar = new Intl.NumberFormat('en-US', { 
    style: 'currency', 
    currency: 'USD' 
  });
  document.getElementById("total").textContent = USDollar.format(finalTotal);
}


export const showOrders = async function () {

    const orderID = sessionStorage.getItem("orderID");
      console.log(orderID);
  
    const makeRow = (label, value) => {
      const p = document.createElement("p");
      p.innerHTML = `${label} ${value ?? ""}`;
      return p;
    };

    const snapshot = await getDocs(collection(db, "invoices"));


//gives order the incomplete status which will allow it to show on the dashboard
//instead of the archive
for (const item of snapshot.docs) {
  if (item.data().isCompleted === undefined) {
    await updateDoc(doc(db, "invoices", item.id), {
      isCompleted: false
    });
  }
}
  
    const orders = document.getElementById("orders");
    orders.innerHTML = "";
  
    //gets incompleted invoices from firebase
    
    const ordersQuery = query(collection(db, "invoices"), where("isCompleted", "==", false));
    const ordersSnapshot = await getDocs(ordersQuery);

    //groups orders if they're duplicates
    const orderGroups = {};
  
    ordersSnapshot.forEach((item) => {
      const data = item.data();
  
      const key = `${data.requestFrom}_${data.date}`;
  
      //creates new array for that key if not a duplicate
      if (!orderGroups[key]) {
        orderGroups[key] = [];
      }
  
      orderGroups[key].push({
        id: item.id,
        title: data.title,
        mounting: data.mounting,
        width: data.width,
        height: data.height, 
        quantity: data.quantity,
        description: data.description,
        requestFrom: data.requestFrom, 
        issuedTo: data.bill,
        date: data.date,
      });
    });



    Object.values(orderGroups).forEach(group => {
      if (group.length == 1) {
        orders.appendChild(createOrderTile(group[0]));
      } else {
        orders.appendChild(createOrderCarousel(group));
      }
    });

    //Compiles title, width, height, mounting, material, quantity, and any notes
    //into one rectangle with buttons that can remove the order from the dasboard page
    //and move it to the archive page and a button that, when pressed, will take the user to the invoice output
    //with additional information

    function createOrderTile(order) {

      const editInvoiceButton = document.createElement("button");
      editInvoiceButton.innerHTML = "✎"
      editInvoiceButton.className = "editButton";
      editInvoiceButton.onclick = () => {
        sessionStorage.setItem("orderID", order.id);
        location.href = "place-order.html";
      }
      
      const orderTile = document.createElement("div");
      orderTile.className = "orderTile";

      orderTile.appendChild(editInvoiceButton);
      orderTile.appendChild(makeRow("Order Name:", order.title));
      orderTile.appendChild(makeRow("Width (in):", order.width));
      orderTile.appendChild(makeRow("Height (in):", order.height));
      orderTile.appendChild(makeRow("Mounting:", order.mounting));
      orderTile.appendChild(makeRow("Quantity:", order.quantity));
      orderTile.appendChild(makeRow("Notes:", order.description));
  
      const seeInvoiceButton = document.createElement("button");
      seeInvoiceButton.innerHTML = "See Invoice";
      seeInvoiceButton.className = "button";
      seeInvoiceButton.onclick = () => {
        sessionStorage.setItem("orderID", order.id);
        location.href = "output.html";
      };
  
      const markCompleteButton = document.createElement("button");
      markCompleteButton.innerHTML = "Mark Complete";
      markCompleteButton.className = "button";
      console.log("orderGroups");
      console.log(orderGroups);
      markCompleteButton.onclick = async () => {
          if (confirm("You are marking this/these item(s) as complete. Press OK to proceed.")) {
            const ordersQuery = query(collection(db, "invoices"), where("date", "==", order.date), where("requestFrom", "==", order.requestFrom));
            const ordersSnapshot = await getDocs(ordersQuery);
            for (const item of ordersSnapshot.docs) {
                await updateDoc(doc(db, "invoices", item.id), {
                  isCompleted: true //turns order incomplete status to true
                  //order is now completed and removed from the main dashboard
                });
            }
 
            sessionStorage.setItem("orderID", order.id);
          }
        await showOrders();
      };
      orderTile.appendChild(seeInvoiceButton);
      orderTile.appendChild(markCompleteButton);
  
      return orderTile;
    }

    // creates a track with all the duplicate orders of one group
    // Shows one order at a time through a viewport 
    function createOrderCarousel(group) {
  
      //buttons and viewport
      const carousel = document.createElement("div");
      carousel.className = "orderCarousel";
  
      //giant slide with all the "duplicate" orders
      const track = document.createElement("div");
      track.className = "carouselTrack";
      
  
      group.forEach(order => {
          //one slide per position
          const slide = document.createElement("div");
          slide.className = "carouselSlide";
          
          const inner = document.createElement("div");
          inner.className = "carouselSlideInner";
          
          inner.appendChild(createOrderTile(order));
          slide.appendChild(inner);
          track.appendChild(slide);
      });
  
      //current visible slide
      let index = 0;
  
      //next/prev buttons
  
      const prev = document.createElement("button");
      prev.innerHTML = "‹";
      prev.className = "carouselBtn prev";
      prev.onclick = () => {
          //prevents from over sliding
        index = Math.max(index - 1, 0);
        update();
      };
  
      const next = document.createElement("button");
      next.innerHTML = "›";
      next.className = "carouselBtn next";
      next.onclick = () => {
          //prevents from over sliding
        index = Math.min(index + 1, group.length - 1);
        update();
      };
  
      //moves track horizontally
      function update() {

        console.log(index);
          const viewportWidth = viewport.offsetWidth;
          track.style.transform = `translateX(-${index * 100}%)`;
          // track.style.transform = `translateX(-200)`;
          console.log(`translateX(-${index * 100}%)`);
          const activeSlide = track.children[index];
          // console.log(activeSlide);
          const inner = activeSlide.querySelector(".carouselSlideInner");
          viewport.style.height = inner.offsetHeight + "px";
  }
  
      //window shows one card at a time
      const viewport = document.createElement("div");
      viewport.className = "carouselViewport";
      //puts the track into the viewport
      viewport.appendChild(track);
      carousel.appendChild(viewport);
      
      carousel.appendChild(prev);
      carousel.appendChild(next);
  
      return carousel;
    }
  };

  //shows completed (past) invoices in archive which can be later deleted permenantly 
  export const showArchive = async function(){


    const orderID = sessionStorage.getItem("orderID");
      console.log(orderID);
  
    const makeRow = (label, value) => {
      const p = document.createElement("p");
      p.innerHTML = `${label} ${value ?? ""}`;
      return p;
    };
  
    const orders = document.getElementById("orders");
    orders.innerHTML = "";
  
    //gets invoices from firebase
    
    const ordersQuery = query(collection(db, "invoices"), where("isCompleted", "==", true));
    const ordersSnapshot = await getDocs(ordersQuery);

    //groups orders if they're duplicates
    const orderGroups = {};
  
    ordersSnapshot.forEach((item) => {
      const data = item.data();
  
      const key = `${data.requestFrom}_${data.date}`;
  
      //creates new array for that key if not a duplicate
      if (!orderGroups[key]) {
        orderGroups[key] = [];
      }
  
      orderGroups[key].push({
        id: item.id,
        title: data.title,
        mounting: data.mounting,
        width: data.width,
        height: data.height, 
        quantity: data.quantity,
        description: data.description,
        requestFrom: data.requestFrom, 
        issuedTo: data.bill,
        date: data.date,
      });
    });

    Object.values(orderGroups).forEach(group => {
      if (group.length == 1) {
        orders.appendChild(createOrderTile(group[0]));
      } else {
        orders.appendChild(createOrderCarousel(group));
      }
    });

    //Compiles title, width, height, mounting, material, quantity, and any notes
    //into one rectangle with buttons that can delete the order from the database
    //and a button that, when pressed, will take the user to the invoice output
    //with additional information
    
    function createOrderTile(order) {
      const orderTile = document.createElement("div");
      orderTile.className = "orderTile";
  
      orderTile.appendChild(makeRow("Order Name:", order.title));
      orderTile.appendChild(makeRow("Width (in):", order.width));
      orderTile.appendChild(makeRow("Height (in):", order.height));
      orderTile.appendChild(makeRow("Mounting:", order.mounting));
      orderTile.appendChild(makeRow("Quantity:", order.quantity));
      orderTile.appendChild(makeRow("Notes:", order.description));
  
      const seeInvoiceButton = document.createElement("button");
      seeInvoiceButton.innerHTML = "See Invoice";
      seeInvoiceButton.className = "button";
      seeInvoiceButton.onclick = () => {
        sessionStorage.setItem("orderID", order.id);
        location.href = "output.html";
      };
  
      const markCompleteButton = document.createElement("button");
      markCompleteButton.innerHTML = "Delete Permenantly";
      markCompleteButton.className = "button";
      console.log("orderGroups");
      console.log(orderGroups);
      markCompleteButton.onclick = async () => {
          if (confirm("You are permenantly deleting this item. Press OK to proceed")) {
            sessionStorage.setItem("orderID", order.id);
            await deleteOrdersWith(order.requestFrom, order.date);   
          }
        await showArchive();
      };
  
      orderTile.appendChild(seeInvoiceButton);
      orderTile.appendChild(markCompleteButton);
  
      return orderTile;
    }

    // creates a track with all the duplicate orders of one group
    // Shows one order at a time through a viewport 
    function createOrderCarousel(group) {
  
      //buttons and viewport
      const carousel = document.createElement("div");
      carousel.className = "orderCarousel";
  
      //giant slide with all the "duplicate" orders
      const track = document.createElement("div");
      track.className = "carouselTrack";
      
  
      group.forEach(order => {
          //one slide per position
          const slide = document.createElement("div");
          slide.className = "carouselSlide";
          
          const inner = document.createElement("div");
          inner.className = "carouselSlideInner";
          
          inner.appendChild(createOrderTile(order));
          slide.appendChild(inner);
          track.appendChild(slide);
      });
  
      //current visible slide
      let index = 0;
  
      //next/prev buttons
  
      const prev = document.createElement("button");
      prev.innerHTML = "‹";
      prev.className = "carouselBtn prev";
      prev.onclick = () => {
          //prevents from over sliding
        index = Math.max(index - 1, 0);
        update();
      };
  
      const next = document.createElement("button");
      next.innerHTML = "›";
      next.className = "carouselBtn next";
      next.onclick = () => {
          //prevents from over sliding
        index = Math.min(index + 1, group.length - 1);
        update();
      };
  
      //moves track horizontally
      function update() {

        console.log(index);
          const viewportWidth = viewport.offsetWidth;
          track.style.transform = `translateX(-${index * 100}%)`;
          // track.style.transform = `translateX(-200)`;
          console.log(`translateX(-${index * 100}%)`);
          const activeSlide = track.children[index];
          // console.log(activeSlide);
          const inner = activeSlide.querySelector(".carouselSlideInner");
          viewport.style.height = inner.offsetHeight + "px";
  }
  
      //window shows one card at a time
      const viewport = document.createElement("div");
      viewport.className = "carouselViewport";
      //puts the track into the viewport
      viewport.appendChild(track);
      carousel.appendChild(viewport);
      
      carousel.appendChild(prev);
      carousel.appendChild(next);
  
      return carousel;
    }
  }
  
  //Finds duplicates and deletes group or deletes the single order if no duplicates are found
  export const deleteOrdersWith = async function(requestFrom, date){
    const orderID = sessionStorage.getItem("orderID");
    const docRef = doc(db, "invoices", orderID);
    const docSnap = await getDoc(docRef);
    
     //gets invoices from firebase
    const ordersQuery = query(collection(db, "invoices"), where("date", "==", docSnap.data().date), where("requestFrom", "==", docSnap.data().requestFrom));
    const ordersSnapshot = await getDocs(ordersQuery);
  
    for (const item of ordersSnapshot.docs) {
      if (item.data().requestFrom == requestFrom && item.data().date == date) {
      await deleteDoc(doc(db, "invoices", item.id));
    }
  }
}
  
  export const createPDF = async function(){
    const orderID = sessionStorage.getItem("orderID");
    const docRef = doc(db, "invoices", orderID);
    const docSnap = await getDoc(docRef);
  
    const ordersQuery = query(
      collection(db, "invoices"), 
      where("date", "==", docSnap.data().date), 
      where("requestFrom", "==", docSnap.data().requestFrom)
    );
    const ordersSnapshot = await getDocs(ordersQuery);
  
    const pricesRef = doc(db, "prices", "prices");
    const pricesSnap = await getDoc(pricesRef);
  
    const epsonPricePerSqIn = pricesSnap.data().epsonPricePerSqIn;
    const foamPricePerSqIn = pricesSnap.data().foamPricePerSqIn;
    const matPricePerSqIn = pricesSnap.data().matPricePerSqIn;
    const inkPricePerSqIn = pricesSnap.data().inkPricePerSqIn;
  
    let USDollar = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });
    let grandTotal = 0;
  
    // Clear existing rows and make sure these columns exists in the HTML
    document.getElementById("title").innerHTML = "";
    document.getElementById("quantity").innerHTML = "";
    document.getElementById("amount").innerHTML = ""; 
  
    ordersSnapshot.forEach((item) => {
    const data = item.data();
  
      // Set header info (same for all items in group)
      document.getElementById("issued-to").innerHTML = data.bill;
      document.getElementById("date").innerHTML = data.date;
      document.getElementById("requested-by").innerHTML = data.requestFrom;
  
      // Calculate  price per items
      let priceEach = 0;
      if (data.mounting == "Foam Board") {
        priceEach = data.width * data.height * (foamPricePerSqIn + inkPricePerSqIn + epsonPricePerSqIn);
      } else if (data.mounting == "Mat Board") {
        priceEach = data.width * data.height * (matPricePerSqIn + inkPricePerSqIn + epsonPricePerSqIn);
      } else {
        priceEach = data.width * data.height * (inkPricePerSqIn + epsonPricePerSqIn);
      }
  
      grandTotal += priceEach * data.quantity;
  
      // Add a row for each order item
      document.getElementById("title").innerHTML += data.title + "<br>";
      document.getElementById("quantity").innerHTML += data.quantity + "<br>";
      document.getElementById("amount").innerHTML += USDollar.format(priceEach) + "<br>"; 
    });
  
    document.getElementById("total").innerHTML = USDollar.format(grandTotal);
  }


export const addToOrder = async function () {
    
    // Make sure the mounting works
    var uid = Date.now(); 
    var mountingGroupName = "mounting_" + uid;

    // Make sure the buttons is hidden
    var addButtons = document.querySelectorAll("#add-to-order");
    var lastAddButton = addButtons[addButtons.length - 1];
    var buttonRow = lastAddButton.parentElement;
    buttonRow.style.display = "none";

    
    console.log("adding section");
    var tile = document.createElement("div");
    tile.setAttribute("class", "rectangle");
    tile.style.position = "relative";
   
    var deleteBtn = document.createElement("button");
    deleteBtn.textContent = "x";
    deleteBtn.setAttribute("type", "button");
    deleteBtn.style = `
    top: 8px;
     right: 10px;
     position: absolute;
     background: #ffffff;
     border-radius: 50%;
     width: 30px;
     font-size: 30px;
     font-weight: 600;
     color: #b71c1c;
     line-height: 1;
     padding: 2px;
    `
    deleteBtn.onclick = () => {
      tile.remove();
      // re show the last "Add to Order" button after this tile is gone
      var remainingAddButtons = document.querySelectorAll("#add-to-order");
      if (remainingAddButtons.length > 0) {
        var lastBtn = remainingAddButtons[remainingAddButtons.length - 1];
        lastBtn.parentElement.style.display = "";
      }
    };
    tile.appendChild(deleteBtn);
    // first row
    var firstRow = document.createElement("div");
    firstRow.setAttribute("class", "row");

    var Half1 = document.createElement("div");
    Half1.setAttribute("class", "half");
    firstRow.appendChild(Half1);
  
    var input1 = document.createElement("label");
    input1.setAttribute("class", "inputs");
    input1.innerHTML = 'Title<span class="highlight">*</span>';
    Half1.appendChild(input1);
    Half1.appendChild(document.createElement("br"));
  
    var Row1Style1 = document.createElement("input");
     
    Row1Style1.setAttribute("class", "row1Style1");
    Row1Style1.type = "text";
    Half1.appendChild(Row1Style1);
  
    var Half2 = document.createElement("div");
    Half2.setAttribute("class", "half");
    firstRow.appendChild(Half2);
  
    // var input2 = document.createElement("label");
    // input2.setAttribute("class", "inputs");
    // input2.innerHTML = 'Date Invoiced<span class="highlight">*</span>';
    // Half2.appendChild(input2);
    // Half2.appendChild(document.createElement("br"));
  
    // var Row1Style2 = document.createElement("input");
    // Row1Style2.setAttribute("class", "row1Style2");
    // Row1Style2.type = "date";
    // Half2.appendChild(Row1Style2);
  
    tile.appendChild(firstRow);
    tile.appendChild(document.createElement("br"));
  
    // second row
    var secondRow = document.createElement("div");
    secondRow.setAttribute("class", "row");
    tile.appendChild(secondRow);
 
  
    var hAlf2 = document.createElement("div");
    hAlf2.setAttribute("class", "half2");
    secondRow.appendChild(hAlf2);
  
    var input3Wrap = document.createElement("div");
    var input3 = document.createElement("label");
    input3.setAttribute("class", "inputs");
    input3.innerHTML = 'Width<span class="highlight">*</span>';
    input3Wrap.appendChild(input3);
    hAlf2.appendChild(input3Wrap);
  
    var widthWrap = document.createElement("div");
    var Row2Style1 = document.createElement("input");
    Row2Style1.setAttribute("class", "row2Style1");
    Row2Style1.type = "text";
    widthWrap.appendChild(Row2Style1);
    widthWrap.appendChild(document.createTextNode(" in"));
    hAlf2.appendChild(widthWrap);
  
    
    var hALf2 = document.createElement("div");
    hALf2.setAttribute("class", "half2");
    secondRow.appendChild(hALf2);
  
    var input4Wrap = document.createElement("div");
    var input4 = document.createElement("label");
    input4.setAttribute("class", "inputs");
    input4.innerHTML = 'Height<span class="highlight">*</span>';
    input4Wrap.appendChild(input4);
    hALf2.appendChild(input4Wrap);
  
    var heightWrap = document.createElement("div");
    var Row2Style2 = document.createElement("input");
    Row2Style2.setAttribute("class", "row2Style2");
    Row2Style2.type = "text";
    heightWrap.appendChild(Row2Style2);
    heightWrap.appendChild(document.createTextNode(" in"));
    hALf2.appendChild(heightWrap);
  
    // mounting
    var hAlf3 = document.createElement("div");
    hAlf3.setAttribute("class", "half3");
    secondRow.appendChild(hAlf3);

    var input5 = document.createElement("label");
    input5.setAttribute("class", "inputs");
    input5.innerHTML = 'Mounting<span class="highlight">*</span>';
    hAlf3.appendChild(input5);
    hAlf3.appendChild(document.createElement("br"));

    var Checkbox = document.createElement("div");
    Checkbox.setAttribute("class", "checkbox");

    // foam
    var foamInput = document.createElement("input");
    foamInput.type = "radio";
    foamInput.name = mountingGroupName;
    foamInput.id = "foamBoard_" + uid;

    var foamLabel = document.createElement("label");
    foamLabel.setAttribute("for", "foamBoard_" + uid);
    foamLabel.textContent = "Foam Board";

    Checkbox.appendChild(foamInput);
    Checkbox.appendChild(foamLabel);

    // mat
    var matInput = document.createElement("input");
    matInput.type = "radio";
    matInput.name = mountingGroupName;
    matInput.id = "matBoard_" + uid;
    

    var matLabel = document.createElement("label");
    matLabel.setAttribute("for", "matBoard_" + uid);
    matLabel.textContent = "Mat Board";

    Checkbox.appendChild(matInput);
    Checkbox.appendChild(matLabel);

    // none
    var noneInput = document.createElement("input");
    noneInput.type = "radio";
    noneInput.name = mountingGroupName;
    noneInput.id = "none_" + uid;

    var noneLabel = document.createElement("label");
    noneLabel.setAttribute("for", "none_" + uid);
    noneLabel.textContent = "None";

    Checkbox.appendChild(noneInput);
    Checkbox.appendChild(noneLabel);

    hAlf3.appendChild(Checkbox);

    tile.appendChild(document.createElement("br"));
  
    // third row
    var thirdRow = document.createElement("div");
    thirdRow.setAttribute("class", "row");
    tile.appendChild(thirdRow);
  
    
    var Half4 = document.createElement("div");
    Half4.setAttribute("class", "half4");
    Half4.style.width = "50%";
    thirdRow.appendChild(Half4);
  
    var input6Wrap = document.createElement("div");
    var input6 = document.createElement("label");
    input6.setAttribute("class", "inputs");
    input6.innerHTML = 'Quantity<span class="highlight">*</span>';
    input6Wrap.appendChild(input6);
    Half4.appendChild(input6Wrap);
  
    var qtyWrap = document.createElement("div");
    var Row3Style1 = document.createElement("input");
    Row3Style1.setAttribute("class", "row3Style1");
    Row3Style1.type = "text";
    qtyWrap.appendChild(Row3Style1);
    Half4.appendChild(qtyWrap);
  
    // bill and reuqest
    // var HAlf4 = document.createElement("div");
    // HAlf4.setAttribute("class", "half4");
    // thirdRow.appendChild(HAlf4);
  
    // var input7Wrap = document.createElement("div");
    // var input7 = document.createElement("label");
    // input7.setAttribute("class", "inputs");
    // input7.innerHTML = 'Bill To (Department)<span class="highlight">*</span>';
    // input7Wrap.appendChild(input7);
    // HAlf4.appendChild(input7Wrap);
  
    // var billWrap = document.createElement("div");
    // var Row3Style2 = document.createElement("input");
    // Row3Style2.setAttribute("class", "row3Style2");
    // Row3Style2.type = "text";
    // billWrap.appendChild(Row3Style2);
    // HAlf4.appendChild(billWrap);

    // var HALf4 = document.createElement("div");
    // HALf4.setAttribute("class", "half4");
    // thirdRow.appendChild(HALf4);
  
    // var input8Wrap = document.createElement("div");
    // var input8 = document.createElement("label");
    // input8.setAttribute("class", "inputs");
    // input8.innerHTML = 'Requested By<span class="highlight">*</span>';
    // input8Wrap.appendChild(input8);
    // HALf4.appendChild(input8Wrap);
  
    // var reqWrap = document.createElement("div");
    // var Row3Style3 = document.createElement("input");
    // Row3Style3.setAttribute("class", "row3Style3");
    // Row3Style3.type = "text";
    // reqWrap.appendChild(Row3Style3);
    // HALf4.appendChild(reqWrap);
  
    // tile.appendChild(document.createElement("br"));
  
    // fourth row
    var fourthRow = document.createElement("div");
    fourthRow.setAttribute("class", "row");
    tile.appendChild(fourthRow);
  
    var Description = document.createElement("div");
    Description.setAttribute("class", "desc");
    fourthRow.appendChild(Description);
  
    var notesWrap2 = document.createElement("div");
    var input9 = document.createElement("label");
    input9.setAttribute("class", "inputs");
    input9.textContent = "Notes";
    notesWrap2.appendChild(input9);
  
    var textarea = document.createElement("textarea");
    textarea.id = "description";
    notesWrap2.appendChild(textarea);
  
    Description.appendChild(notesWrap2);
  
    // fifth row
    var fifthRow = document.createElement("div");
    fifthRow.setAttribute("class", "row");
    tile.appendChild(fifthRow);
  
    var submitBtn = document.createElement("button");
    submitBtn.id = "submit-order";
    submitBtn.textContent = "Submit Order to Invoice";
    submitBtn.onclick = function () {
      if (typeof window.createInvoice === "function") window.createInvoice();
    };
  
    var addBtn = document.createElement("button");
    addBtn.id = "add-to-order";
    addBtn.textContent = "Add to Order";
    addBtn.onclick = function () {
      addToOrder();
    };
  
    
    fifthRow.appendChild(addBtn);
    fifthRow.appendChild(submitBtn);
  

    document.body.appendChild(tile);
  };
