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


function saveRecord (record) {
    const transaction = db.transaction(['transaction'], 'readwrite');
    const budgetStore = transaction.objectStore('transaction');

    budgetStore.add(record);
};

function dbSync () {
    console.log("Databases syncing")
    const transaction = db.transaction(['transaction'], 'readonly');
    const budgetStore = transaction.objectStore('transaction');
    const pendingTransactions = budgetStore.getAll();

    pendingTransactions.onsuccess = () => {
        if (pendingTransactions.result.length > 0) {
            console.log("Pending transactions being added")
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
