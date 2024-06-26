const path = require('path');
const fs = require('fs');
const axios = require('axios');

const stackApiKey = 'YOUR STACK API KEY blt';
const accessToken = 'YOUR DELIVERY TOKEN cs';
const environment = 'development';
const baseUrl = 'https://cdn.contentstack.io/v3/stacks/sync';

// Function to generate a random string
function generateRandomString(length) {
    const characters = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
}

let fileName = '';
let filePath = '';
let totalDataFetched = 0;
let totalAPICalls = 0;
let total_count = 0;
let limit = 0;

// Function to generate file name and path
async function fileNameGenerator(functionName) {
    const responseDir = path.join(__dirname, 'response');
    if (!fs.existsSync(responseDir)) {
        fs.mkdirSync(responseDir);
    }
    const uniqueString = generateRandomString(8);
    fileName = `${functionName}_${uniqueString}.json`;
    filePath = path.join(responseDir, fileName);
    fs.appendFileSync(filePath, `File Name Generated: ${fileName}\n\n`);
    console.log(`Log File Generated: ${fileName}\n\n`);
}

// Function to fetch data with pagination
async function fetchDataWithPagination(url) {
    try {
        const options = {
            headers: {
                api_key: stackApiKey,
                access_token: accessToken,
            },
        };

        const response = await axios.get(url, options);
        const { pagination_token, items } = response.data;

        if (totalAPICalls === 0) {
            total_count = response.data.total_count;
            limit = response.data.limit;
        }

        fs.appendFileSync(filePath, JSON.stringify(items, null, 2));
        fs.appendFileSync(filePath, `\n\nSkip: ${response.data.skip}`);
        fs.appendFileSync(filePath, `\n\nFetched ${items.length} items.`);
        totalDataFetched = response.data.skip + items.length;
        fs.appendFileSync(filePath, `\n\nTotal Items Fetched till now: ${totalDataFetched}\n\n`);

        console.log(`Fetched ${items.length} items.`);
        totalAPICalls++;

        if (pagination_token) {
            console.log(`Pagination token ${pagination_token} exists.. Fetching more data..`);
            await fetchDataWithPagination(`${baseUrl}?pagination_token=${pagination_token}`);
        } else {
            console.log('Finished fetching data.');

            const syncToken = response.data.sync_token;

            if (syncToken) {
                const finalResponse = await axios.get(`${baseUrl}?sync_token=${syncToken}`, options);
                const finalItems = finalResponse.data.items;

                console.log(`\n\nSync Token Found: ${syncToken}`);
                fs.appendFileSync(filePath, `\n\nSync Token:\n`);
                fs.appendFileSync(filePath, JSON.stringify(finalResponse.data, null, 2));
                fs.appendFileSync(filePath, `\n\nFetched ${finalItems.length} final items.\n`);

                console.log(`Fetched ${finalItems.length} final items.`);

                fs.appendFileSync(filePath, `\n\n-----------Final Data------------`);
                fs.appendFileSync(filePath, `\nTotal Count: ${total_count}`);
                fs.appendFileSync(filePath, `\nLimit: ${limit}`);
                fs.appendFileSync(filePath, `\nTotal API Calls: ${totalAPICalls}`);
                fs.appendFileSync(filePath, `\nTotal Items Fetched: ${totalDataFetched}\n\n`);

                console.log('-----------Final Data------------');
                console.log(`Total Count: ${total_count}`);
                console.log(`Limit: ${limit}`);
                console.log(`Total API Calls: ${totalAPICalls}`);
                console.log(`Total Items Fetched: ${totalDataFetched}`);

            } else {
                fs.appendFileSync(filePath, `\n\nNo sync token found.\n`);
                console.log('No sync token found.');
            }
        }
    } catch (error) {
        fs.appendFileSync(filePath, `\n\nError fetching data: ${error} \n ${error.response.data.error_message}\n`);
        console.error('Error fetching data:', error, '\n', error.response.data.error_message);
    }
}

async function fetchAllData() {
    await fileNameGenerator('test_sync_calls');
    await fetchDataWithPagination(`${baseUrl}?init=true&environment=${environment}`);
}

fetchAllData();
