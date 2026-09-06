const { v4: uuidv4 } = require('uuid');
const { memoryStore, getStoreStatus } = require('../config/db');

function createModel(collectionName, mongooseModel) {
  const store = memoryStore[collectionName] || new Map();
  memoryStore[collectionName] = store;

  return {
    async create(doc) {
      if (!getStoreStatus().isInMemoryFallback) {
        return await mongooseModel.create(doc);
      }
      const _id = doc._id || uuidv4();
      const newDoc = {
        _id,
        id: _id,
        ...doc,
        createdAt: doc.createdAt || new Date(),
        updatedAt: new Date(),
      };
      store.set(_id.toString(), newDoc);
      return JSON.parse(JSON.stringify(newDoc));
    },

    async find(filter = {}) {
      if (!getStoreStatus().isInMemoryFallback) {
        return await mongooseModel.find(filter);
      }
      const results = [];
      for (const item of store.values()) {
        let match = true;
        for (const key of Object.keys(filter)) {
          if (filter[key] !== undefined && item[key] !== filter[key]) {
            // handle string/id equality
            if (String(item[key]) !== String(filter[key])) {
              match = false;
              break;
            }
          }
        }
        if (match) results.push(JSON.parse(JSON.stringify(item)));
      }
      // Return chainable mock
      return results;
    },

    async findOne(filter = {}) {
      if (!getStoreStatus().isInMemoryFallback) {
        return await mongooseModel.findOne(filter);
      }
      for (const item of store.values()) {
        let match = true;
        for (const key of Object.keys(filter)) {
          if (filter[key] !== undefined && item[key] !== filter[key]) {
            if (String(item[key]) !== String(filter[key])) {
              match = false;
              break;
            }
          }
        }
        if (match) return JSON.parse(JSON.stringify(item));
      }
      return null;
    },

    async findById(id) {
      if (!getStoreStatus().isInMemoryFallback) {
        return await mongooseModel.findById(id);
      }
      const item = store.get(String(id));
      return item ? JSON.parse(JSON.stringify(item)) : null;
    },

    async findByIdAndUpdate(id, update, options = {}) {
      if (!getStoreStatus().isInMemoryFallback) {
        return await mongooseModel.findByIdAndUpdate(id, update, options);
      }
      const item = store.get(String(id));
      if (!item) return null;
      const updated = {
        ...item,
        ...(update.$set ? update.$set : update),
        updatedAt: new Date(),
      };
      delete updated.$set;
      store.set(String(id), updated);
      return JSON.parse(JSON.stringify(updated));
    },

    async findByIdAndDelete(id) {
      if (!getStoreStatus().isInMemoryFallback) {
        return await mongooseModel.findByIdAndDelete(id);
      }
      const item = store.get(String(id));
      if (item) {
        store.delete(String(id));
        return JSON.parse(JSON.stringify(item));
      }
      return null;
    },

    async countDocuments(filter = {}) {
      if (!getStoreStatus().isInMemoryFallback) {
        return await mongooseModel.countDocuments(filter);
      }
      let count = 0;
      for (const item of store.values()) {
        let match = true;
        for (const key of Object.keys(filter)) {
          if (filter[key] !== undefined && item[key] !== filter[key]) {
            if (String(item[key]) !== String(filter[key])) {
              match = false;
              break;
            }
          }
        }
        if (match) count++;
      }
      return count;
    },

    // Raw direct access to collection
    get collection() {
      return store;
    },
  };
}

module.exports = { createModel };
