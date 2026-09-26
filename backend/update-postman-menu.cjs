const fs = require('fs');
const path = require('path');

const collectionPath = path.join(__dirname, 'DineHub-API.postman_collection.json');
let collection = JSON.parse(fs.readFileSync(collectionPath, 'utf8'));

const menuFolder = collection.item.find(item => item.name === 'Menu');

if (menuFolder) {
  const existingItemNames = menuFolder.item.map(i => i.name);
  console.log('Existing items in Menu:', existingItemNames);

  const missingItems = [
    {
      name: 'Create Category',
      request: {
        method: 'POST',
        header: [{ key: 'Content-Type', value: 'application/json' }],
        body: { mode: 'raw', raw: '{\n  "name": "Starters"\n}' },
        url: { raw: '{{baseUrl}}/menu/category', host: ['{{baseUrl}}'], path: ['menu', 'category'] },
        auth: { type: 'bearer', bearer: [{ key: 'token', value: '{{jwtToken}}', type: 'string' }] }
      }
    },
    {
      name: 'Add Food Item',
      request: {
        method: 'POST',
        header: [{ key: 'Content-Type', value: 'application/json' }],
        body: { mode: 'raw', raw: '{\n  "categoryId": "<category_uuid_here>",\n  "name": "Paneer Tikka",\n  "description": "Marinated cottage cheese grilled to perfection.",\n  "price": 220,\n  "gst": 5,\n  "isVeg": true,\n  "preparationTime": 15,\n  "isAvailable": true,\n  "addons": [\n    { "name": "Extra Cheese", "price": 40 }\n  ],\n  "variants": [\n    { "name": "Small", "price": 120 }\n  ]\n}' },
        url: { raw: '{{baseUrl}}/menu/item', host: ['{{baseUrl}}'], path: ['menu', 'item'] },
        auth: { type: 'bearer', bearer: [{ key: 'token', value: '{{jwtToken}}', type: 'string' }] }
      }
    },
    {
      name: 'Update / Toggle Food Item',
      request: {
        method: 'PATCH',
        header: [{ key: 'Content-Type', value: 'application/json' }],
        body: { mode: 'raw', raw: '{\n  "isAvailable": false\n}' },
        url: { raw: '{{baseUrl}}/menu/item/:id', host: ['{{baseUrl}}'], path: ['menu', 'item', ':id'], variable: [{ key: 'id', value: '<item_uuid_here>' }] },
        auth: { type: 'bearer', bearer: [{ key: 'token', value: '{{jwtToken}}', type: 'string' }] }
      }
    },
    {
      name: 'Delete Food Item',
      request: {
        method: 'DELETE',
        url: { raw: '{{baseUrl}}/menu/item/:id', host: ['{{baseUrl}}'], path: ['menu', 'item', ':id'], variable: [{ key: 'id', value: '<item_uuid_here>' }] },
        auth: { type: 'bearer', bearer: [{ key: 'token', value: '{{jwtToken}}', type: 'string' }] }
      }
    }
  ];

  for (const item of missingItems) {
    if (!existingItemNames.includes(item.name)) {
      menuFolder.item.push(item);
      console.log(`Added missing item: ${item.name}`);
    }
  }

  fs.writeFileSync(collectionPath, JSON.stringify(collection, null, 2), 'utf8');
  console.log('Postman collection updated for Menu module.');
} else {
  console.log('Menu folder not found!');
}
