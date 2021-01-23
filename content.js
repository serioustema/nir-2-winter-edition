let tabId;
let tabUrl;

chrome.runtime.sendMessage({action: "getTabId"}, function(res) {
    tabId = res.tabId;
});

chrome.runtime.sendMessage({action: "getTabUrl"}, function(res) {
    tabUrl = res.tabUrl;
});

function getRootUrl(url) {
    var hostname;
    if (url.indexOf("//") > -1) {
        hostname = url.split('/')[2];
    }
    else {
        hostname = url.split('/')[0];
    }
    hostname = hostname.split(':')[0];
    hostname = hostname.split('?')[0];

    return hostname;
}

function windowIsset () {
    if (document.querySelector(".c_slider") == null) {
        return false;
    } else {
        return true;
    }
}

function createWindow() {
    var el = document.createElement('div');

    el.style.background = "#343434";
    el.style.position = "fixed";
    el.style.right = "0%";
    el.style.top = "0%";
    el.style.marginTop = "50px";
    el.style.marginRight = "290px";


    chrome.storage.local.get('insiteCtrl', function(result) {
        if (result.insiteCtrl !== undefined) {
            if (result.insiteCtrl === true) {
                el.style.display = "block";
            } else {
                el.style.display = "none";
            }
        }
    });
    
    el.innerHTML = `
        <section id="booster_ext">
            <div class="booster_slider_ext">
                <input type="range" class="c_slider" min="0" max="500" step="10" value="100">
                <div class="labels">
                    <label>
                        0%
                    </label>
                    <label>
                        <span class="c_text-volume">Громкость</span>: <span class="c_current-volume"></span>%
                    </label>
                    <label>
                        500%
                    </label>
                </div>
            </div>
            <div class="drag"></div>
        </section>
    `;
    
    document.body.appendChild(el);

    var slider = document.querySelector(".c_slider");
    var currentVolume = document.querySelector(".c_current-volume");
    slider.addEventListener("input", () => {
        const { value } = slider;
        currentVolume.innerText = value;
        const url = getRootUrl(tabUrl);


        chrome.storage.local.get('scope', function(scopeResult) {
            chrome.storage.local.get('scopeValue', function(scopeValueResult) {
                if (scopeValueResult['scopeValue'] !== undefined) {
                    scopeValueCopy = scopeValueResult['scopeValue'];
                    if (scopeResult['scope'] == 2) {
                        scopeValueCopy['all'] = value;
                    } else {
                        scopeValueCopy[url] = value;
                    }
                    chrome.storage.local.set({'scopeValue': scopeValueCopy}, null);
                }
            });  
        })

        chrome.runtime.sendMessage({
            action: "set_volume",
            tabId: tabId,
            sliderValue: value,
            tabUrl: tabUrl
        });
    });
}

chrome.runtime.onMessage.addListener(
    function(request, sender, sendResponse) {
        if (request.action == "update_volume") {
            if (windowIsset() == false) {
                createWindow();
            }
            var slider = document.querySelector(".c_slider");
            var currentVolume = document.querySelector(".c_current-volume");
            currentVolume.innerText = request.value;
            slider.value = request.value;
        } else if (request.action == "update_volume_by_scope") {
            chrome.storage.local.get('scope', function(scopeResult) {
                chrome.storage.local.get('scopeValue', function(scopeValueResult) {
                    if (scopeValueResult['scopeValue'] !== undefined) {
                        if (scopeResult['scope'] == 2) {
                            chrome.runtime.sendMessage({
                                action: "set_volume",
                                tabId: tabId,
                                sliderValue: scopeValueResult['scopeValue']['all'],
                                tabUrl: tabUrl
                            });
                        } else if (scopeResult['scope'] == 1) {
                            url = getRootUrl(tabUrl);
                            chrome.runtime.sendMessage({
                                action: "set_volume",
                                tabId: tabId,
                                sliderValue: scopeValueResult['scopeValue'][url],
                                tabUrl: tabUrl
                            });
                        }
                    }
                });  
            })
        }
    });