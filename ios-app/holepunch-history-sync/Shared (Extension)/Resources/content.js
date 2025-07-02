browser.runtime.sendMessage({ greeting: "hello" }).then((response) => {
    console.log("Received response: ", response);
});

browser.runtime.onMessage.addListener((request, _sender, _sendResponse) => {
    console.log("Received request: ", request);
});
