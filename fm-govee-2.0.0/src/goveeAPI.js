// this is more up-to-date than 'node-govee-led'
// put here because of management purposes
const axios = require('axios');

class GoveeLED {
	constructor(config) {
		this.apiKey = config.apiKey
		this.mac = config.mac
		this.sku = config.sku
		this.basePath = "https://openapi.api.govee.com/router/api/v1"
	}

	request(endpoint, reqData, method) {
		return new Promise( ( resolve, reject ) => {

			if (this.mac === "") return reject(new Error("No MAC Address provided."));
			if (this.sku === "") return reject(new Error("No Model provided."));
			let reqURL = this.basePath + endpoint;

			var data = JSON.stringify(reqData);

			var config = {
				method: method,
				url: reqURL,
				headers: { 
					'Govee-API-Key': this.apiKey, 
					'Content-Type': 'application/json'
				},
				data: data
			};
			axios(config)
			.then((response) => resolve(response.data))
			.catch((error) => reject(error));
		});
	}

	setPowerSwitch(state) {
		if (!Number.isInteger(state)) throw new Error("Power Switch State Provided is Not A Number");
		if (state < 0 || state > 1) throw new Error("Invalid Power Switch State, 0 For Off, 1 For On");
		var reqData = {
			"requestId": "uuid",
			"payload": {
				"sku": this.sku,
				"device": this.mac,
				"capability": {
					"type": "devices.capabilities.on_off",
					"instance": "powerSwitch",
					"value": state
				}
			}
		};

		var endpoint = '/device/control';
		return this.request(endpoint, reqData, "post");
	}

	setBrightness(brightnessLevel) {
		if (!Number.isInteger(brightnessLevel)) throw new Error("Brightness Level Provided is Not A Number");
		if (brightnessLevel < 1 || brightnessLevel > 100) throw new Error("Brightness Level Provided is Not From 1-100");
		var reqData = {
			"requestId": "1",
			"payload": {
				"sku": this.sku,
				"device": this.mac,
				"capability": {
					"type": "devices.capabilities.range",
					"instance": "brightness",
					"value": brightnessLevel
				}
			}
		};
		var endpoint = '/device/control';
		return this.request(endpoint, reqData, "post");
	}

	setSegmentBrightness(brightnessLevel, segment, res) {
		if (!Number.isInteger(brightnessLevel)) throw new Error("Brightness Level Provided is Not A Number");
		if (brightnessLevel < 0 || brightnessLevel > 100) throw new Error("Brightness Level Provided is Not From 1-100");
		var endpoint = '/device/control';
		let thisseg = [...segment];
		if (this.sku === "H60A1" && thisseg.length > 13) {
			let lastSeg = thisseg.splice(13);
			// do the last segment (main light) first
			var reqData1 = {
				"requestId": "1",
				"payload": {
					"sku": this.sku,
					"device": this.mac,
					"capability": {
						"type": "devices.capabilities.segment_color_setting",
						"instance": "segmentedBrightness",
						"value": {
							"segment": lastSeg,
							"brightness": brightnessLevel
						}
					}
				}
			};
			// now do the rest of the segments (ring)
			var reqData = {
				"requestId": "1",
				"payload": {
					"sku": this.sku,
					"device": this.mac,
					"capability": {
						"type": "devices.capabilities.segment_color_setting",
						"instance": "segmentedBrightness",
						"value": {
							"segment": thisseg,
							"brightness": brightnessLevel
						}
					}
				}
			};
			return this.request(endpoint, reqData, "post"), this.request(endpoint, reqData1, "post");
		}
		var reqData = {
			"requestId": "1",
			"payload": {
				"sku": this.sku,
				"device": this.mac,
				"capability": {
					"type": "devices.capabilities.segment_color_setting",
					"instance": "segmentedBrightness",
					"value": {
						"segment": segment,
						"brightness": brightnessLevel
					}
				}
			}
		};
		return this.request(endpoint, reqData, "post");
	}

	setGradientToggle(toggle) {
		if (toggle) {
			toggle = 1;
		} else {
			toggle = 0
		}
		var reqData = {
			"requestId": "uuid",
			"payload": {
				"sku": this.sku,
				"device": this.mac,
				"capability": {
					"type": "devices.capabilities.toggle",
					"instance": "gradientToggle",
					"value": toggle
				}
			}
		};
		var endpoint = '/device/control';
		return this.request(endpoint, reqData, "post");
	}
	
	setColor(hexCode) {
		var regex = /^#([0-9A-F]{3}){1,2}$/i;
		if (!regex.test(hexCode)) throw new Error("Invalid Hex Color Code");
		
		function hex2rgb(hex) {
			var shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
			hex = hex.replace(shorthandRegex, function(m, r, g, b) {
				return r + r + g + g + b + b;
			});

			var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
			return result ? {
				r: parseInt(result[1], 16),
				g: parseInt(result[2], 16),
				b: parseInt(result[3], 16)
			} : null;
		}
		
		var RGBconv = hex2rgb(hexCode);
		var APIconv = ((RGBconv.r & 0xFF) << 16) | ((RGBconv.g & 0xFF) << 8) | ((RGBconv.b & 0xFF) << 0);
		var reqData = {
			"requestId": "uuid",
			"payload": {
				"sku": this.sku,
				"device": this.mac,
				"capability": {
					"type": "devices.capabilities.color_setting",
					"instance": "colorRgb",
					"value": APIconv
				}
			}
		};
		var endpoint = '/device/control';
		return (this.request(endpoint, reqData, "post"));
	}

	setColorTemperature(temperatureLevel) {
		var reqData = {
			"requestId": "uuid",
			"payload": {
				"sku": this.sku,
				"device": this.mac,
				"capability": {
					"type": "devices.capabilities.color_setting",
					"instance": "colorTemperatureK",
					"value": temperatureLevel
				}
			}
		};
		var endpoint = '/device/control';
		return this.request(endpoint, reqData, "post");
	}
	
	setSegmentColor(hexCode, segment) {
		var regex = /^#([0-9A-F]{3}){1,2}$/i;
		if (!regex.test(hexCode)) throw new Error("Invalid Hex Color Code");
		
		function hex2rgb(hex) {
			var shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
			hex = hex.replace(shorthandRegex, function(m, r, g, b) {
				return r + r + g + g + b + b;
			});

			var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
			return result ? {
				r: parseInt(result[1], 16),
				g: parseInt(result[2], 16),
				b: parseInt(result[3], 16)
			} : null;
		}

		var RGBconv = hex2rgb(hexCode);
		var APIconv = ((RGBconv.r & 0xFF) << 16) | ((RGBconv.g & 0xFF) << 8) | ((RGBconv.b & 0xFF) << 0);

		var reqData = {
			"requestId": "1",
			"payload": {
				"sku": this.sku,
				"device": this.mac,
				"capability": {
					"type": "devices.capabilities.segment_color_setting",
					"instance": "segmentedColorRgb",
					"value": {
						"segment": segment,
						"rgb": APIconv
					}
				}
			}
		};
		var endpoint = '/device/control';
		return this.request(endpoint, reqData, "post");
	}

	setSnapshot(snapshot) {
		var reqData = {
			"requestId": "1",
			"payload": {
				"sku": this.sku,
				"device": this.mac,
				"capability": {
					"type": "devices.capabilities.dynamic_scene",
					"instance": "snapshot",
					"value": snapshot
				}
			}
		};
		var endpoint = '/device/control';
		return this.request(endpoint, reqData, "post");
	}

	getDynamicScenes() {
		var reqData = {
			"requestId": "uuid",
			"payload": {
				"sku": this.sku,
				"device": this.mac,
			}
		};
		var endpoint = '/device/scenes';
		return this.request(endpoint, reqData, "post");
	}

	setDynamicScene(scene) {
		var reqData = {
			"requestId": "1",
			"payload": {
				"sku": this.sku,
				"device": this.mac,
				"capability": {
					"type": "devices.capabilities.dynamic_scene",
					"instance": "lightScene",
					"value": scene
				}
			}
		};
		var endpoint = '/device/control';
		return this.request(endpoint, reqData, "post");
	}

	getDIYScenes() {
		var reqData = {
			"requestId": "uuid",
			"payload": {
				"sku": this.sku,
				"device": this.mac,
			}
		};
		var endpoint = '/device/diy-scenes';
		return this.request(endpoint, reqData, "post");
	}

	setDIYScene(scene) {
		var reqData = {
			"requestId": "1",
			"payload": {
				"sku": this.sku,
				"device": this.mac,
				"capability": {
					"type": "devices.capabilities.dynamic_scene",
					"instance": "diyScene",
					"value": scene
				}
			}
		};
		var endpoint = '/device/control';
		return this.request(endpoint, reqData, "post");
	}

	async getDevices() {
		return new Promise( ( resolve, reject ) => {

			var reqData = {};
			var endpoint = `/user/devices`;
			let reqURL = this.basePath + endpoint;

			var data = JSON.stringify(reqData);

			var config = {
				method: "get",
				url: reqURL,
				headers: { 
					'Govee-API-Key': this.apiKey, 
					'Content-Type': 'application/json'
				},
				data: data
			}

			axios(config)
				.then((response) => {resolve(response.data.data)})
				.catch((error) => reject(error));
		})
	}

	getState() {
		var reqData = {
			"requestId": "uuid",
			"payload": {
				"sku": this.sku,
				"device": this.mac
			}
		};
		var endpoint = `/device/state`;
		return this.request(endpoint, reqData, "post");
	}
};

module.exports = GoveeLED;