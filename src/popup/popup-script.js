const rootElement = document.getElementById("root");

const injectedFunction = async () => {
    const BACKEND_URL = 'http://localhost:8000';
    const content = new window.Readability(document.cloneNode(true)).parse();
    
    const flagsRequest = await fetch(`${BACKEND_URL}/flags`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            article: content.textContent
        })
    });

    const response = await flagsRequest.json();
    
    const authorFlag = document.querySelectorAll('[class*="author"]').length != 0
    response.push(['Článok uvádza autora.', 'has-author', authorFlag]);

    return response;    
}

const queryTab = (options) => {
    return new Promise((resolve, reject) => {
        chrome.tabs.query(options, (result) => {
            if (!result) {
                reject(null);
            } else {
                resolve(result);
            }
        })
    })
}

const icons = {
    "alarming-tone": "assets/img/ucel-alarm64x64.png",
    "controversial-topic": "assets/img/ucel-kontroverzia64x64.png",
    "immidiate-reaction": "assets/img/ucel-konanie64x64.png",
    "negative-tone": "assets/img/ucel-negativita64x64.png",
    "profit": "assets/img/ucel-profit64x64.png",
    "provocative-tone": "assets/img/ucel-provokacia64x64.png",
    "sharing": "assets/img/ucel-sirenie64x64.png",
    "has-author": "assets/img/fajka64x64.png"
}

window.onload = async () => {
    let activeTab = await queryTab({ active: true, currentWindow: true });
    
    if (activeTab.length != 0) {
        activeTab = activeTab[0];
    } else {
        throw new Error("Couldn't find active tab.");
    }

    await chrome.scripting.executeScript({ target: { tabId: activeTab.id }, files: ['src/readability.js'] });

    const flagsRaised = await chrome.scripting.executeScript({ target: { tabId: activeTab.id }, function: injectedFunction });
    const warningListDiv = document.createElement("div");
    warningListDiv.classList.add("warnings-wrapper")

    for (let [flagText, flagId, isRaised] of flagsRaised[0].result) {
        if (isRaised) {
            const icon = chrome.runtime.getURL(icons[flagId]);
            
            const image = document.createElement("img")
            image.src = icon;
            image.classList.add("warning-icon");
            
            const warningName = document.createElement("div");
            warningName.innerText = flagText;

            const warningContainer = document.createElement("div");
            warningContainer.classList.add("warning");

            warningContainer.appendChild(image);
            warningContainer.appendChild(warningName);
            
            warningListDiv.appendChild(warningContainer);
        }
    }

    const link = document.createElement("a")
    link.classList.add("link")
    link.textContent = "Precitajte si viacej o Hoaxoch"
    link.href = "https://www.omediach.com/hoaxy/15715-odhalit-falosne-spravy-vam-pomozu-tri-jednoduche-otazky"

    warningListDiv.appendChild(link)

    rootElement.appendChild(warningListDiv);
    rootElement.removeChild(document.getElementById('loading'))
}