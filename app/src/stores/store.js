const Dispatcher = require("flux").Dispatcher;
const Emitter = require("events").EventEmitter;

const dispatcher = new Dispatcher();
const emitter = new Emitter();

class Store {
  constructor() {
    this.store = {
      elections: [],
    };

    dispatcher.register(
      function (payload) {
        switch (payload.type) {
          case "ADD_ELECTION":
            this.addElection(payload.content.election);
            break;
          default: {
          }
        }
      }.bind(this)
    );
  }

  addElection(elec) {
    console.log("addElection ", elec);
    let elections = this.store.elections;
    let foundElection = elections.filter((e) => e.id == elec.id);
    if (foundElection.length == 0) {
      elections.push(elec);
      store.setStore({ elections: elections });
    }
  }

  getElectionById(id) {
    // console.log("getElectionById ", id);
    let elections = this.store.elections;
    let foundElection = elections.filter((e) => e.id == id);
    return foundElection;
  }

  getStore() {
    return this.store;
  }

  setStore(obj) {
    this.store = { ...this.store, ...obj };
    return emitter.emit("StoreUpdated");
  }
}

const store = new Store();
const stores = {
  store: store,
  dispatcher: dispatcher,
  emitter: emitter,
};
export default stores;
