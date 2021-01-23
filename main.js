$(function(){
    $.switcher();
});

$('#slider-volume').slider({
	orientation: "vertical",
	range: "min",
	min: 0,
	max: 500,
	value: 100,
	slide: function(event, ui ) {
		refreshSlider(ui.value);
	}

});

const currentVolume = document.querySelector("#current-volume");
const insite_controller = document.querySelector("#insite-controller");

function refreshSlider(val) {
	url = getRootUrl(tabUrl);
	const value = Math.round(+val);
	currentVolume.innerText = Math.round(+value) + "%";

	$(".line").each(function() {
		if (parseInt($(this).css("top")) > parseInt($(".ui-slider-handle").css("top")) + 45) {
			if ( $(this).hasClass("sm-line") ) {
				$(this).css("border", "2px solid #9970DD");
			} else {
				$(this).css("border", "3px solid #9970DD");
			}
		} else {
			if ( $(this).hasClass("sm-line") ) {
				$(this).css("border", "2px solid rgb(146, 146, 146)");
			} else {
				$(this).css("border", "3px solid rgb(146, 146, 146)");
			}
		}
	});

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

	chrome.storage.local.get('insiteCtrl', function(result) {
		if (result.insiteCtrl !== undefined) {
			if (result.insiteCtrl === true) {
				chrome.runtime.sendMessage({
					action: "set_volume",
					tabId: tabId,
					sliderValue: value,
					tabUrl: tabUrl
				});
			}
		} else {
			chrome.runtime.sendMessage({
				action: "set_volume",
				tabId: tabId,
				sliderValue: value,
				tabUrl: tabUrl
			});
		}
	});
}

setTimeout(function() {
	$(".line").each(function() {
		if (parseInt($(this).css("top")) > parseInt($(".ui-slider-handle").css("top")) + 45) {
			if ( $(this).hasClass("sm-line") ) {
				$(this).css("border", "2px solid #9970DD");
			} else {
				$(this).css("border", "3px solid #9970DD");
			}
		} else {
			if ( $(this).hasClass("sm-line") ) {
				$(this).css("border", "2px solid rgb(146, 146, 146)");
			} else {
				$(this).css("border", "3px solid rgb(146, 146, 146)");
			}
		}
	});
}, 10)

chrome.storage.local.get('insiteCtrl', function(result) {
	if (result.insiteCtrl !== undefined) {
		if (result.insiteCtrl === true) {
			insite_controller.checked = true;
			$(".slider-container, .check, h1, span, #volume-div, .line, #footer").css("filter", "grayscale(0%)");
			$(".settings").css("background", "#9970DD");
			$("#status-form").css("filter", "contrast(1)");
			$('#slider-volume').slider("enable");
		} else {
			insite_controller.checked = false;
			$(".slider-container, .check, h1, span, #volume-div, .line, #footer").css("filter", "grayscale(100%)");
			$(".settings").css("background", "#A7A7A7");
			$("#status-form").css("filter", "contrast(0.6)");
			$('#slider-volume').slider("disable");
		}
	} else {
		chrome.storage.local.set({'insiteCtrl': true}, null);
		insite_controller.checked = true;
	}
});

insite_controller.addEventListener('click', function(event) {
	if (event.target.checked === true) {
		chrome.storage.local.set({'insiteCtrl': true}, null);
		chrome.runtime.sendMessage({
            action: "enable_site_ctrl"
		});
		$(".slider-container, .check, h1, span, #volume-div, .line, #footer").css("filter", "grayscale(0%)");
		$("#status-form").css("filter", "contrast(1)");
		$(".settings").css("background", "#9970DD");
		$('#slider-volume').slider("enable");
	} else {
		chrome.storage.local.set({'insiteCtrl': false}, null);
		chrome.runtime.sendMessage({
            action: "disable_site_ctrl"
		});
		$(".slider-container, .check, h1, span, #volume-div, .line, #footer").css("filter", "grayscale(100%)");
		$(".settings").css("background", "#A7A7A7");
		$("#status-form").css("filter", "contrast(0.6)");

		chrome.tabs.query({
			active: true,
			currentWindow: true,
		}, tabs => {
			tabId = tabs[0].id;
			tabUrl = tabs[0].url;

			chrome.runtime.sendMessage({
				action: "set_volume",
				tabId: tabId,
				sliderValue: "100",
				tabUrl: tabUrl
			});
			$('#slider-volume').slider('value', "100");
			refreshSlider("100");
			$('#slider-volume').slider("disable");
		});
	}
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

$("#volume-low").on("click", function() {
	chrome.storage.local.get('insiteCtrl', function(result) {
		if (result.insiteCtrl !== undefined) {
			if (result.insiteCtrl === true) {
				$('#slider-volume').slider('value', Math.round(+Math.max(0, Number($("#slider-volume").slider("value")) - 10)));
				refreshSlider(Math.round(+Math.max(0, Number($("#slider-volume").slider("value")) - 10)));
			}
		} else {
			$('#slider-volume').slider('value', Math.round(Math.max(0, Number($("#slider-volume").slider("value")) - 10)));
			refreshSlider(Math.round(+Math.max(0, Number($("#slider-volume").slider("value")) - 10)));
		}
	});
});

$("#volume-high").on("click", function() {
	chrome.storage.local.get('insiteCtrl', function(result) {
		if (result.insiteCtrl !== undefined) {
			if (result.insiteCtrl === true) {
				$('#slider-volume').slider('value', Math.round(Math.max(0, Number($("#slider-volume").slider("value")) + 10)));
				refreshSlider(+Math.round(Math.max(0, Number($("#slider-volume").slider("value")) + 10)));
			}
		} else {
			$('#slider-volume').slider('value', Math.round(Math.max(0, Number($("#slider-volume").slider("value")) - 10)));
			refreshSlider(+Math.round(Math.max(0, Number($("#slider-volume").slider("value")) + 10)));
		}
	});
});


let tabId;
let tabUrl;
chrome.tabs.query({
	active: true,
	currentWindow: true,
}, tabs => {
	tabId = tabs[0].id;
	tabUrl = tabs[0].url;

	if(chrome.runtime.lastError){return;}

	currentVolume.innerText = Math.round(+$("#slider-volume").slider("value")) + "%";
	url = getRootUrl(tabUrl);

	$("#status-form").change(function(e) {
		if (e.target.value === "curTab") {
			chrome.storage.local.set({'scope': 0}, null);
			chrome.storage.local.get('scopeAlways', function(scopeAlwaysResult) {
				if (scopeAlwaysResult['scopeAlways'] !== undefined) {
					if (scopeAlwaysResult['scopeAlways'].includes(url)) {
						updatedScope = scopeAlwaysResult['scopeAlways'].filter(function(item) {
							return item !== url
						});
						chrome.storage.local.set({'scopeAlways': updatedScope}, null);
					}
				} else {
					chrome.storage.local.set({'scopeAlways': []}, null);
				}
			});
		} else if (e.target.value === "curUrl") {
			chrome.storage.local.set({'scope': 1}, null);

			chrome.storage.local.get('scopeAlways', function(scopeAlwaysResult) {
				if (scopeAlwaysResult['scopeAlways'] !== undefined) {
					if (!scopeAlwaysResult['scopeAlways'].includes(url)) {
						updatedScope = scopeAlwaysResult['scopeAlways'];
						updatedScope.push(url);
						chrome.storage.local.set({'scopeAlways': updatedScope}, null);
					}
					chrome.storage.local.get('scopeValue', function(scopeValueResult) {
						if (scopeValueResult['scopeValue'] !== undefined) {
							scopeValueCopy = scopeValueResult['scopeValue'];
							scopeValueCopy[url] = Math.round(+$("#slider-volume").slider("value"));
							chrome.storage.local.set({'scopeValue': scopeValueCopy}, null);
						} else {
							chrome.storage.local.set({'scopeValue': {[url]: Math.round($("#slider-volume").slider("value"))}}, null);
						}
					});
				} else {
					chrome.storage.local.set({'scopeAlways': [url]}, null);
					chrome.storage.local.get('scopeValue', function(scopeValueResult) {
						if (scopeValueResult['scopeValue'] !== undefined) {
							scopeValueCopy = scopeValueResult['scopeValue'];
							scopeValueCopy[url] = Math.round($("#slider-volume").slider("value"));
							chrome.storage.local.set({'scopeValue': scopeValueCopy}, null);
						} else {
							chrome.storage.local.set({'scopeValue': {[url]: Math.round($("#slider-volume").slider("value"))}}, null);
						}
					});
				}
			});
		} else if (e.target.value === "allUrl") {
			chrome.storage.local.set({'scope': 2}, null);
			chrome.storage.local.set({'scopeValue': {'all': Math.round($("#slider-volume").slider("value"))}}, null);
			chrome.storage.local.set({'scopeAlways': []}, null);
		}
	});
	chrome.storage.local.get('scope', function(scopeResult) {
		if (scopeResult['scope'] !== undefined) {
			if (scopeResult['scope'] === 0) {
				chrome.storage.local.get('scopeAlways', function(scopeAlwaysResult) {
					if (scopeAlwaysResult['scopeAlways'] !== undefined) {
						if (scopeAlwaysResult['scopeAlways'].includes(url)) {
							$("#curUrl").prop("checked", true);
						} else {
							$("#curTab").prop("checked", true);
						}
					} else {
						$("#curTab").prop("checked", true);
					}
				});
			} else if (scopeResult['scope'] === 1) {
				chrome.storage.local.get('scopeAlways', function(scopeAlwaysResult) {
					if (scopeAlwaysResult['scopeAlways'] !== undefined) {
						if (scopeAlwaysResult['scopeAlways'].includes(url)) {
							$("#curUrl").prop("checked", true);
						} else {
							$("#curTab").prop("checked", true);
						}
					} else {
						$("#curUrl").prop("checked", true);
					}
				});
			} else if (scopeResult['scope'] === 2) {
				$("#allUrl").prop("checked", true);
			}
		}
	});
	chrome.storage.local.get([url], function(result) {
		chrome.storage.local.get('scope', function(scopeResult) {
			chrome.storage.local.get('scopeValue', function(scopeValueResult) {
				let scope = 0;
				let scopeValue = "";
				if (scopeResult['scope'] !== undefined) {
					scope = scopeResult['scope'];
					if (scopeValueResult['scopeValue'][url] !== undefined) {
						scopeValue = scopeValueResult['scopeValue'][url];
					}
				}

				if (result[url] !== undefined && scope !== 0 || scope === 2) {
					let gain = 100;
					if (scope == 1) {
						chrome.storage.local.get('scopeAlways', function(scopeAlwaysResult) {
							if (scopeAlwaysResult['scopeAlways'] !== undefined) {
								if (!scopeAlwaysResult['scopeAlways'].includes(url)) {
									if (result[url] !== undefined) {
										gain = result[url];
									}
				
									if (Number(gain) !== 100) {
										$('#slider-volume').slider('value', Math.round(+gain));
										refreshSlider(Math.round(+gain));
									}
								} else {
									chrome.storage.local.get('scopeValue', function(scopeValueResult) {
										gain = Number(scopeValueResult['scopeValue'][url]);
										if (Number(gain) !== 100) {
											$('#slider-volume').slider('value', Math.round(+gain));
											refreshSlider(Math.round(+gain));
										}
									})
								}
							} else {
								if (result[url] !== undefined) {
									gain = result[url];
								}
			
								if (Number(gain) !== 100) {
									$('#slider-volume').slider('value', Math.round(+gain));
									refreshSlider(Math.round(+gain));
								}
							}
						});
					} else {
						if (scope === 2) {
							gain = Number(scopeValueResult['scopeValue']['all']);
						} else if (result[url] !== undefined) {
							gain = result[url];
						}
	
						if (Number(gain) !== 100) {
							$('#slider-volume').slider('value', Math.round(+gain));
							refreshSlider(Math.round(+gain));
						}
					}
				} else {
					chrome.runtime.sendMessage({
						action: "get_gain",
						tabId: tabId,
						tabUrl: tabUrl
					}, response => {
						if (response.gainValue !== null) {
							const gain = response.gainValue * 100 || 0;
							$('#slider-volume').slider('value', Math.round(+gain));
							refreshSlider(gain);
						}
					});
				}
			});
		});
	});

	chrome.tabs.query({
		audible: true
	}, tabs => {
		tabs.sort((a, b) => b.id - a.id),
		$("#cur-tab-header").text(tabs.length > 0 ? "Текущее аудио в этом окне" : "Отсутствуют окна с аудио")
		tabs.forEach(tab => {
			const link = document.createElement("h1");
			link.innerText = tab.title;
			$(".urls").append(link);
		});
	});
});