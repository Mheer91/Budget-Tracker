
//Making the initial indexedDB titled "budget" with version number 1
const request = indexedDB.open("budget", 1);
let db;


request.onupgradeneeded = ({ target }) => {
    const db = target.result;
    db.createObjectStore(('transaction'), {autoIncrement: true});
};

request.onsuccess = ({ target }) => {
     db = target.result;

    if (navigator.onLine) { 
        console.log("You are currently online!")
        dbSync();
    }
};

request.onerror = (err) => {
    console.log(err.message)
};

//saveRecord saves transactions to the budget indexedDB database
function saveRecord (record) {
    const transaction = db.transaction(['transaction'], 'readwrite');
    const budgetStore = transaction.objectStore('transaction');

    budgetStore.add(record);
};

//This function syncs the indexedDB store with the mongoDB collection. All transactions that were recorded offline will automatically be added to the live mongoDB using the startercode bulk add route. I've added a few lines that console log each step of the process.
function dbSync () {
    console.log("Databases syncing")
    const transaction = db.transaction(['transaction'], 'readonly'); //Using readonly because we are just syncing the databases, since this function only gets called online we don't want to add any more items to the indexedDB.
    const budgetStore = transaction.objectStore('transaction');
    const pendingTransactions = budgetStore.getAll();//Grabs all of the pending items in the indexedDB store.

    pendingTransactions.onsuccess = () => {
        if (pendingTransactions.result.length > 0) {
            console.log("Pending transactions being added")
            //Using the pre-built bulk route to transactions the items created offline.
            fetch("/api/transaction/bulk", {
                method: "POST",
                body: JSON.stringify(pendingTransactions.result),
                headers: {
                  Accept: "application/json, text/plain, */*",
                  "Content-Type": "application/json"
                }
              })
              .then(response => response.json())
              .then(() => {
                  //Once all store items have been added to MongoDB, we access the store again and clear it out. 
                  const transaction = db.transaction(['transaction'], 'readwrite');
                  const budgetStore = transaction.objectStore('transaction');
                  budgetStore.clear();
                  console.log("Database sync complete. All transactions have been added!")
              })
              .catch((err) => {
                  console.log(err)
              });
        };
    };
};

window.addEventListener("online", dbSync);
