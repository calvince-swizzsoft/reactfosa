import assert from "node:assert/strict";
import { customerLookupPage } from "../src/pages/Registry/Customers/Documents/customerLookupPage.js";

const rows = [{ Id: "customer-21", IndividualFirstName: "Jane" }];
assert.deepEqual(customerLookupPage({ data: { PageCollection: rows, ItemsCount: 401, PageSize: 20, TotalPages: null } }), { items: rows, totalPages: 21 });
assert.equal(customerLookupPage({ PageCollection: rows, ItemsCount: 400, PageSize: 20 }).totalPages, 20);
assert.equal(customerLookupPage({ Data: { pageCollection: rows, itemsCount: "41", pageSize: "20" } }).totalPages, 3);
assert.equal(customerLookupPage({ PageCollection: rows, ItemsCount: 201, PageSize: 10 }).totalPages, 21);
assert.equal(customerLookupPage({ PageCollection: rows, ItemsCount: 201 }, 50).totalPages, 5);
assert.equal(customerLookupPage({ PageCollection: rows, TotalPages: "9" }).totalPages, 9);
assert.deepEqual(customerLookupPage({ PageCollection: [], ItemsCount: 0, PageSize: 20 }), { items: [], totalPages: 1 });
assert.deepEqual(customerLookupPage(rows), { items: rows, totalPages: 1 });
console.log("Customer lookup pagination: 8 checks passed, including 401 customers across 21 pages.");
