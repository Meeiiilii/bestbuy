import fs from 'fs/promises';
import BestBuyAPI from 'bestbuy';
import open from 'open';

const API_KEY = ''; // Replace with your API key
const SKUs = [6535503];

async function delay(ms) {
    await new Promise(resolve => setTimeout(resolve, ms));
}

(async () => {
    const LastOnlineAvailability = [false, false, false];
    let counter = 0;

    async function monitor() {
        try {
            const bb = BestBuyAPI({ key: API_KEY });
            const response = await bb.products(`sku in (${SKUs.join(',')})`, {
                show: 'sku,name,onlineAvailability,salePrice,addToCartUrl'
            });
            const prods = response.products;

            for (let i = 0; i < prods.length; i++) {
                const name = prods[i].name;
                const availability = prods[i].onlineAvailability;
                const price = prods[i].salePrice || 'N/A';

                if (availability !== LastOnlineAvailability[i]) {
                    if (availability) {
                        const currentTime = new Date();
                        const dateString = currentTime.toLocaleDateString();
                        const timeString = currentTime.toLocaleTimeString();

                        const logEntry = `${name} - Available at ${timeString} on ${dateString} - Price: $${price}\n`;

                        await fs.appendFile('available.txt', logEntry);

                        // Read previous price from available.txt
                        const prevPriceEntry = await fs.readFile('available.txt', 'utf-8');
                        const prevPrice = parseFloat(prevPriceEntry.split('Price: $')[1]);

                        if (prevPrice > parseFloat(price)) {
                            const saleEntry = `${name} is on SALE! Previous Price: $${prevPrice}, Current Price: $${price}\n`;
                            await fs.appendFile('sale.txt', saleEntry);
                        }

                        console.log(name + " becomes available.");
                        console.log("Price: $" + price);
                        console.log("Paste the link into a browser if needed: " + prods[i].addToCartUrl);

                        await open(prods[i].addToCartUrl); // Open URL in browser
                    } else {
                        console.log(name + " becomes unavailable.");
                    }
                    LastOnlineAvailability[i] = availability;
                }
            }

            if (counter % 50 === 0) {
                for (let i = 0; i < prods.length; i++) {
                    const pStr = `${new Date().toLocaleTimeString()} ${prods[i].name} is [${prods[i].onlineAvailability ? "AVAILABLE" : "NOT AVAILABLE"}] for online shipping.`;
                    console.log(pStr);
                }
            }
        } catch (err) {
            console.error('Error:', err);
        }
        counter++;
    }

    const monitorInterval = setInterval(monitor, 120000); // Set delay to 2 minutes

    console.log(new Date().toLocaleDateString() + " " + new Date().toLocaleTimeString());
    console.log("Start Running");
    console.log("The program is checking with BestBuy API every 2 minutes.");
})();
