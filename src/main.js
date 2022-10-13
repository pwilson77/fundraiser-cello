import Web3 from "web3";
import { newKitFromWeb3 } from "@celo/contractkit";
import BigNumber from "bignumber.js";
import erc20Abi from "../contract/erc20.abi.json";
import fundraiserFactoryAbi from "../contract/fundraiserFactory.abi.json";
import fundraiserAbi from "../contract/fundraiser.abi.json";

const ERC20_DECIMALS = 18;
const FundraiserFactoryContractAddress =
  "0x1edfe10859FAE2Ae8e2A7502Ee60D87A7dd54456";
const cUSDContractAddress = "0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1";

let kit;
let contract;
let fundraisers = [];

const getBalance = async function () {
  const totalBalance = await kit.getTotalBalance(kit.defaultAccount);
  const cUSDBalance = totalBalance.cUSD.shiftedBy(-ERC20_DECIMALS).toFixed(2);
  // document.querySelector("#balance").textContent = cUSDBalance;
};

const getFundraisers = async function () {
  const _fundraisersLength = await contract.methods
    .getNumberOfFundraisers()
    .call();
  const _fundraisers = [];

  for (let i = 0; i < _fundraisersLength; i++) {
    let _fundraiser = new Promise(async (resolve, reject) => {
      let p = await contract.methods.getFundraiserDetails(i).call();
      resolve({
        index: i,
        prizeName: p[1],
        prizeImage: p[2],
        organizer: p[3],
        description: p[0],
        status: p[4],
        amountToBeRaised: new BigNumber(p[5])
          .shiftedBy(-ERC20_DECIMALS)
          .toFixed(2),
        numberOfContributions: p[6],
        amountRaised: new BigNumber(p[7]).shiftedBy(-ERC20_DECIMALS).toFixed(2),
        contractAddress: p[8],
      });
    });
    _fundraisers.push(_fundraiser);
  }

  fundraisers = await Promise.all(_fundraisers);
  renderFundraisers();
};

function renderFundraisers() {
  document.getElementById("fundraiser-area").innerHTML = "";
  fundraisers.forEach((_fundraiser) => {
    const newDiv = document.createElement("div");
    newDiv.className = "col-md-6";
    newDiv.innerHTML = fundraiserTemplate(_fundraiser);
    document.getElementById("fundraiser-area").appendChild(newDiv);
  });
}

function fundraiserTemplate(_fundraiser) {
  return `
      <div class="card mb-4" style="width: 540px;">
        <div class="row g-0"> 
          <div class="col-md-4">
            <img class="img-fluid rounded-start" src="${
              _fundraiser.prizeImage
            }" alt="...">
            <div class="position-absolute top-0 start-0 bg-warning mt-4 px-2 py-1 rounded-start">
              ${_fundraiser.amountRaised} cUSD Raised
            </div>
          </div>
          <div class="col-md-8">
            <div class="card-body text-left p-4 position-relative">
            <h2 class="card-title fs-4 fw-bold mt-2">
              ${_fundraiser.prizeName} 
              ${
                _fundraiser.status
                  ? `<span class="badge bg-success pull-right">Active</span>`
                  : `<span class="badge bg-warning pull-right">Finished</span>`
              }
            </h2>
            <p class="card-text mb-4" style="min-height: 82px">
              ${_fundraiser.description}             
            </p>
            <p class="card-text">
              <i class="bi bi-123"></i>
              <span> Number of Contributions: ${
                _fundraiser.numberOfContributions
              }</span>
            </p>
            <p class="card-text">
              <i class="bi bi-dice-1-fill"></i>
              <span> Fundraiser Target: ${
                _fundraiser.amountToBeRaised
              } cUSD</span>
            </p>
            <p class="card-text">
              <i class="bi bi-people-fill"></i>
              <span> Organizer address: ${_fundraiser.organizer}</span>
            </p>
            ${
              _fundraiser.winnerAddress
                ? `
              <p class="card-text">
                <i class="bi bi-trophy-fill"></i>         
                <span> Winner address: ${_fundraiser.winnerAddress}</span>
              </p>
            `
                : ""
            }
           
            <div class="d-grid gap-2">
            ${
              kit.defaultAccount === _fundraiser.organizer
                ? `
                    
                    <a class="btn btn-lg btn-outline-dark  fs-6 p-3" btn-id=${_fundraiser.index}
                    id="withdrawBtn"
                    >
                      Withdraw
                    </a>
                 `
                : _fundraiser.status
                ? `
                    <a class="btn btn-lg btn-outline-dark  fs-6 p-3" btn-id=${_fundraiser.index}
                    data-bs-toggle="modal"
                    data-bs-target="#viewContributeModal"
                    id="openContributeModal"
                    >
                      Contribute
                    </a>
                `
                : ""
            }
            
            </div>
          </div>
        </div>
      </div>               
    </div>
  `;
}

function identiconTemplate(_address) {
  const icon = blockies
    .create({
      seed: _address,
      size: 8,
      scale: 16,
    })
    .toDataURL();

  return `
    <div class="rounded-circle overflow-hidden d-inline-block border border-white border-2 shadow-sm m-0">
      <a href="https://alfajores-blockscout.celo-testnet.org/address/${_address}/transactions"
          target="_blank">
          <img src="${icon}" width="48" alt="${_address}">
      </a>
    </div>
    `;
}

function notification(_text) {
  document.querySelector(".alert").style.display = "block";
  document.querySelector("#notification").textContent = _text;
}

function notificationOff() {
  document.querySelector(".alert").style.display = "none";
}

window.addEventListener("load", async () => {
  notification("⌛ Loading...");
  await connectCeloWallet();
  await getBalance();
  await getFundraisers();
  notificationOff();
});

document
  .querySelector("#newFundraiserBtn")
  .addEventListener("click", async (e) => {
    const params = [
      new BigNumber(document.getElementById("amountToBeRaised").value)
        .shiftedBy(ERC20_DECIMALS)
        .toString(),
      document.getElementById("fundraiserName").value,
      document.getElementById("prizeName").value,
      document.getElementById("prizeImageUrl").value,
    ];
    notification(`⌛ Adding "${params[1]}"...`);

    try {
      const result = await contract.methods
        .createFundRaiser(...params)
        .send({ from: kit.defaultAccount });
      notification(`🎉 You successfully added "${params[1]}".`);
      getFundraisers();
    } catch (error) {
      notification(`⚠️ ${error}.`);
    }
  });

document
  .querySelector("#fundraiser-area")
  .addEventListener("click", async (e) => {
    const index = e.target.getAttribute("btn-id");
    let fundraiserContract;

    if (e.target.className.includes("contributeBtn")) {
      notification("⌛ Waiting for payment approval...");
      try {
        await approve(amount);
      } catch (error) {
        notification(`⚠️ ${error}.`);
      }
      notification(
        `⌛ Awaiting payment for "${fundraisers[index].description}"...`
      );
      try {
        contractAddress = await contract.methods
          .fundraisers(fundraisers[index])
          .call();
        fundraiserContract = new kit.web3.eth.Contract(
          fundraiserAbi,
          contractAddress
        );

        const result = await fundraiserContract.methods
          .contribute(amount)
          .send({ from: kit.defaultAccount });
        notification(
          `🎉 You successfully contributed to "${fundraisers[index].description}".`
        );
        getFundraisers();
        getBalance();
      } catch (error) {
        notification(`⚠️ ${error}.`);
      }
    }

    if (e.target.id === "openContributeModal") {
      const index = e.target.getAttribute("btn-id");
      document
        .getElementById("contributeToFundraiser")
        .setAttribute("btn-id", index);
    }

    if (e.target.id === "withdrawBtn") {
      notification("⌛ Waiting ...");
      const index = e.target.getAttribute("btn-id");

      try {
        fundraiserContract = new kit.web3.eth.Contract(
          fundraiserAbi,
          fundraisers[index].contractAddress
        );

        await fundraiserContract.methods
          .withdraw()
          .send({ from: kit.defaultAccount });
        notificationOff();
      } catch (error) {
        notification(`⚠️ ${error}.`);
      }
    }
  });

document
  .getElementById("contributeToFundraiser")
  .addEventListener("click", async (e) => {
    const amount = new BigNumber(
      document.getElementById("amountToContribute").value
    )
      .shiftedBy(ERC20_DECIMALS)
      .toString();

    const index = e.target.getAttribute("btn-id");
    notification("⌛ Waiting for payment approval...");

    const contractAddress = await contract.methods.fundraisers(index).call();
    const fundraiserContract = new kit.web3.eth.Contract(
      fundraiserAbi,
      contractAddress
    );

    try {
      await approve(amount, contractAddress);
    } catch (error) {
      notification(`⚠️ ${error}.`);
    }

    notification(
      `⌛ Awaiting payment for "${fundraisers[index].description}"...`
    );

    try {
      const result = await fundraiserContract.methods
        .contribute(amount)
        .send({ from: kit.defaultAccount });
      notification(
        `🎉 You successfully contributed to "${fundraisers[index].description}".`
      );
      getFundraisers();
      getBalance();
    } catch (error) {
      notification(`⚠️ ${error}.`);
    }
  });

const connectCeloWallet = async function () {
  if (window.celo) {
    notification("⚠️ Please approve this DApp to use it.");
    try {
      await window.celo.enable();
      notificationOff();

      const web3 = new Web3(window.celo);
      kit = newKitFromWeb3(web3);

      const accounts = await kit.web3.eth.getAccounts();
      kit.defaultAccount = accounts[0];

      contract = new kit.web3.eth.Contract(
        fundraiserFactoryAbi,
        FundraiserFactoryContractAddress
      );
    } catch (error) {
      notification(`⚠️ ${error}.`);
    }
  } else {
    notification("⚠️ Please install the CeloExtensionWallet.");
  }
};

async function approve(_price, contractAddress) {
  const cUSDContract = new kit.web3.eth.Contract(erc20Abi, cUSDContractAddress);

  const result = await cUSDContract.methods
    .approve(contractAddress, _price)
    .send({ from: kit.defaultAccount });
  return result;
}
