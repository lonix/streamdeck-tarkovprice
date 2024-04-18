const sdWrapper = require('streamdeck-wrapper');
const fetch = require('node-fetch');

let currentSettings = {};

// Handle settings received from the property inspector
sdWrapper.on('didReceiveSettings', (context, settings) => {
  currentSettings = settings.payload.settings;
  updateItem(context);
});

// Function to update the item details and handle errors
async function updateItem(context) {
  const itemName = encodeURIComponent(currentSettings.itemName);
  try {
    const apiResponse = await fetch(`https://api.tarkov.dev/graphql?query={
            itemsByName(name: "${itemName}") {
                name
                icon
                shortName
            }
        }`);
    const jsonData = await apiResponse.json();
    if (jsonData.data && jsonData.data.itemsByName.length > 0) {
      const item = jsonData.data.itemsByName[0];
      sdWrapper.setIcon(context, item.icon);
      queryBitcoinPrice(context, item.shortName);
    } else {
      // No item found, set an error message on the button
      sdWrapper.setTitle(context, `Item not found: ${currentSettings.itemName}`);
    }
  } catch (error) {
    console.error('Failed to fetch item data:', error);
    // Display an error message if there's a problem with the API call
    sdWrapper.setTitle(context, 'Error fetching item data');
  }
}

// Adjusted function to query specific item prices
function queryBitcoinPrice(context, itemShortName) {
  const query = `
        subscription {
            itemPriceHistory(filter: {shortName: "${itemShortName}"}) {
                price
                updatedAt
            }
        }
    `;
  ws.send(JSON.stringify({ query }));
}

ws.on('message', data => {
  const response = JSON.parse(data);
  if (response.data && response.data.itemPriceHistory) {
    sdWrapper.setTitle(context, `Price: ${response.data.itemPriceHistory.price}₽`);
  } else {
    sdWrapper.setTitle(context, 'No price data available');
  }
});
