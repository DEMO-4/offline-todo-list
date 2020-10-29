importScripts('./ngsw-worker.js');

const DB_NAME = 'MyDb';
const DB_VERSION = 3;
const DB_TASKS_STORE_NAME = 'tasks';
let db;

self.addEventListener('sync', function(sync_event) {
  if(sync_event.tag === 'sync-tasks') {
    let responseData = [];
    console.log('HERE!');
    fetch(new Request("/api/tasks", {cache: "no-store"}))
      .then(response => {
        if (response.status === 200) {
          return response.text();
        } else {
          throw new Error("" + response.status + " " + response.statusText);
        }
      })
      .then(responseText => {
        debugger;
        responseData = JSON.parse(responseText);
        console.log("data is", JSON.parse(responseText));
        return openDb();
      })
      .then(() => {
        const transaction = db.transaction([DB_TASKS_STORE_NAME], "readwrite");
        const store = transaction.objectStore(DB_TASKS_STORE_NAME);
        responseData.forEach(task => {
          store.add(task)
        });
        return transaction.complete;
      }).then(function() {
      console.log('added item to the store os!');
    })
      .catch(err => {
        self.registration.showNotification("Sync fired! There was an error.");
        self.registration.showNotification(err.message);
        console.error(err);
      });
  }
});

async function openDb() {
  return new Promise((resolve, reject) => {
    console.log("opening DB...");
    let req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onsuccess = function (evt) {
      db = this.result;
      console.log("opened DB DONE");
      resolve(evt.target.result);
    };
    req.onerror = function (evt) {
      console.error("open DB error:", evt.target.errorCode);
      reject(new Error("Error opening database."));
    };

    req.onupgradeneeded = function (evt) {
      console.log("openDb.onupgradeneeded");
      var store = evt.currentTarget.result.createObjectStore(
        DB_TASKS_STORE_NAME, {keyPath: 'id', autoIncrement: true});

      store.createIndex('name', 'name', {unique: false});
      store.createIndex('isComplete', 'isComplete', {unique: false});
      store.createIndex('isOnServer', 'isOnServer', {unique: false});
    };
  });
}
