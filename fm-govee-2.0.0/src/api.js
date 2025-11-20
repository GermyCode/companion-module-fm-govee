const { InstanceStatus, splitRgb } = require('@companion-module/base')

//const Govee = require('node-govee-led');
const Govee = require('./goveeAPI');

module.exports = {
	initConnection() {
		let self = this;
		if (self.config.verbose) {
			self.log('debug', 'Initializing Connection...')
		}

		self.GOVEE = new Govee({apiKey: self.config.api_key, mac: '', sku: ''}); // LOADS overall info for setup
		self.getGoveeDevices().then(async(devices) => {
			if (devices.length <= 1) { // meaning theres no devices besides the default 'select' entry
				self.log('error', 'No devices detected. Make sure the device is powered on, connected to internet, and in the supported devices list');
			}

			self.goveeDevice = devices.find(device => device.id === self.config.govee_device);

			if (!self.goveeDevice) { // doesnt exist
				self.log('error', 'Invalid Govee Device Selected. Select an available device from the list');
				return
			}

			if (self.goveeDevice.id === 'select') {
				if (self.config.verbose) {
					self.log('warn', 'Select an available device from the list...')
					return
				}
			}

			if (self.config.verbose) {
				self.log('debug', `Connecting to... mac: '${self.goveeDevice.id}' | sku: '${self.goveeDevice.sku}'`)
			}

			self.updateStatus(InstanceStatus.Ok, 'Connection Successful');
			self.GOVEE = new Govee({apiKey: self.config.api_key, mac: self.goveeDevice.id, sku: self.goveeDevice.sku}); // LOADS specific info for that device
			self.GOVEE.getInformation = self.getInformation.bind(self); // used in the refersh action
			await self.getInformation(); // GETS information for that device
			self.setupInterval();

			if (self.config.verbose) {
				self.log('debug', 'Setup Finished!')
			}
		}).catch((error) => self.processHTTPError(error))
	},
	
	setupInterval() {
		let self = this;
	
		self.stopInterval();
	
		if (self.config.intervalEnabled == true) {
			self.INTERVAL = setInterval(self.getState.bind(self), self.config.intervalAmmount); // default every minute
			if (self.config.verbose) {
				self.log('debug', 'Starting Update Interval.');
			}
		}
	},

	stopInterval() {
		let self = this;
	
		if (self.INTERVAL !== null) {
			if (self.config.verbose) {
				self.log('debug', 'Stopping Update Interval.');
			}
			clearInterval(self.INTERVAL);
			self.INTERVAL = null;
		}
	},

	getGoveeDevices() {
		let self = this;
		return new Promise((resolve, reject) => {
			if (self.config.verbose) {
				self.log('debug', 'Getting Devices...');
			}

			self.GOVEE.getDevices().then((data) => {
				self.updateApiCalls('getdevices');
				self.buildDeviceList.bind(self)(data);
				if (self.config.verbose) {
					self.log('debug', `Devices Fetched: ${self.GOVEE_DEVICES.length}`);
				}

				//might need to do a check here to see if the device they had selected is still in the list, if not, change it back to 'select'
				if (self.config.govee_device !== 'select') {
					let goveeDevice = self.GOVEE_DEVICES.find(device => device.id === self.config.govee_device);
					if (!goveeDevice) {
						// doesnt exits in the list, and they have it selected
						if (self.config.verbose) {
							self.log('debug', 'Selected device doesnt exits in the list any more. Reverting to default');
						}
						self.config.govee_device = 'select';
						self.getConfigFields();
						self.configUpdated(self.config); // refresh the config to show the device list
						self.updateStatus(InstanceStatus.Connecting, 'Devices Auto-Detected. Please select a device.');
					}
				}
				resolve(self.GOVEE_DEVICES); // Return the device list
			}).catch((error) => reject(error));
		});
	},

	buildDeviceList(data) {
		let self = this;
		if (self.config.verbose) {
			self.log('debug', 'Building Device List...');
		}
		if (data.length > 0) {
			let devices = [];

			let selectDeviceObj = {};
			selectDeviceObj.id = 'select';
			selectDeviceObj.label = '(Select a Device)';
			devices.push(selectDeviceObj);

			for (let i = 0; i < data.length; i++) {
				let deviceObj = { ...data[i] };
				deviceObj.id = data[i].device;
				deviceObj.label = `${data[i].deviceName} (${data[i].sku})`;
				deviceObj.sku = data[i].sku;

				devices.push(deviceObj);
			}
			self.GOVEE_DEVICES = devices;
		}
	},
	
	async getInformation() {
		// Get all information from Device
		let self = this;

		let device = self.goveeDevice

		// do getState() stuff here to update variables
		self.getState()

		if (this.config.verbose) {
			self.log('debug', 'Getting information...')
		}

		// Loop through capabilities to find kelvin info and maxsegments
		let minkelvin
		let maxkelvin
		let maxsegments
		for (let capability of device.capabilities) {
			// getting kelvin info
			if (capability.instance === "colorTemperatureK") {
				minkelvin = capability.parameters.range.min;
				maxkelvin = capability.parameters.range.max;
			}
			// getting the maxsegments
			else if (capability.type === "devices.capabilities.segment_color_setting") {
				for (let field of capability.parameters.fields) {
					if (field.fieldName === "segment" && field.elementRange) {
						maxsegments = field.elementRange.max;
					}
				}
			}
		}

		// thing with the H60A1 where it has more segments than the api allows
		// also it shows 12 segments instead of 13, 13 being the main light
		if (device.sku === "H60A1") {
			maxsegments += 1;
		}

		self.INFO.maxsegments = maxsegments;
		self.INFO.minkelvin = minkelvin;
		self.INFO.maxkelvin = maxkelvin;

		// store to variables
		let variableObj = {
			'device_mac': device.device,
			'sku': device.sku,
			'device_name': device.deviceName,
			'minkelvin': minkelvin ?? 2000,
			'maxkelvin': maxkelvin ?? 6500,
			'maxsegments': maxsegments ?? 0
		};
		self.setVariableValues(variableObj);

		// setting default values to segments so we can change it later
		for (let i = 0; i < maxsegments + 1; i++) {
			self.INFO.segments['segment ' + i] = {
				brightness: '',
				color: ''
			};
		}

		// Loop through capabilities to find snapshots
		for (let capability of device.capabilities) {
			if (capability.instance === "snapshot") {
				if (capability.parameters.options.length > 0) { // atleast 1 snapshot needed
					self.SNAPSHOTS = self.buildSnapDIYList(capability);
				}
			}
		}

		// reinitialize the actions with the updated info
		self.initActions();

		// get the diy scenes
		// have to do it here since its a different api endpoint
		self.GOVEE.getDIYScenes().then((data) => {
			self.updateApiCalls('getdiyscenes');
			// loop through govee devices, find ours, and grab its data
			for (let capabilities of data.payload.capabilities) {
				if (Object.keys(capabilities).length > 0) {
					self.DIY_SCENES = self.buildSnapDIYList(capabilities);
				}
			}
		}).catch((error) => self.processHTTPError(error));

		// get the dynamic scenes
		// also have to do it here since its a different api endpoint
		self.GOVEE.getDynamicScenes().then((data) => {
			self.updateApiCalls('getdynamicscenes');
			//loop through govee devices, find ours, and grab its data
			for (let capabilities of data.payload.capabilities) {
				if (capabilities.instance === "lightScene") {
					if (capabilities.parameters.options.length > 0) {
						self.DYNAMIC_SCENES = self.buildDynamicSceneList(capabilities);
					}
				}
			}
		}).catch((error) => {self.processHTTPError(error);});
	},

	buildSnapDIYList(data) {
		let scenes = [];
		// Ensure data exists and contains the expected structure
		if (data.parameters?.options.length > 0) { // needs atleast 1 scene
			// Add default "Select a Scene" option
			scenes.push({ id: 'select', label: '(Select a Scene)' });
			// loop through all scenes adding them to the list
			for (const scene of data.parameters.options) {
				let sceneObj = { ...scene };
				scenes.push([{ id: sceneObj.value }, { label: sceneObj.name }]);
			}
		}
		return scenes;
	},

	buildDynamicSceneList(data) {
		let scenes = [];
		// Ensure data exists and contains the expected structure
		if (data.parameters && data.parameters.options.length > 0) {
			// Add default "Select a Scene" option
			scenes.push({ id: 'select', label: '(Select a Scene)' });
			for (let i = 0; i < data.parameters.options.length; i++) {
				let scene = data.parameters.options[i]; 
				let sceneObj = {
					id: scene.value.id, 
					label: scene.name,
				};
				scenes.push(sceneObj);
			}
			// Sort scenes alphabetically by label (ignoring the default option)
			scenes = [scenes[0], ...scenes.slice(1).sort((a, b) => a.label.localeCompare(b.label))];
		}
		return scenes;
	},

	getState() {
		let self = this;

		if (this.config.verbose) {
			self.log('debug', 'Getting current state...')
		}

		// get the states and do things with it
		self.GOVEE.getState().then((data) => {
			self.updateApiCalls('getstate');
			for (let capability of data.payload.capabilities) {
				let tokens = capability.type.split('.'); // devices.capabilities.online -> ['devices', 'capabilities', 'online']
				let type = tokens[2]
				let instance = capability.instance
				let value = capability.state.value
				switch (type) {
					case 'online':
						self.INFO.online = value
						continue;
					case 'on_off':
						self.INFO.power = value === 1 ? 'on' : 'off'
						continue;
					case 'toggle': // gradienttoggle
						self.INFO.gradienttoggle = Boolean(value)
						continue;
					case 'range': // brightness
						self.INFO.brightness = value
						continue;
					case 'music_setting':
						// do stuff | TODO
						continue;
					default:
						if (type === 'segment_color_setting') {
							if (instance === 'segmentedBrightness'){
								// do stuff | TODO
								continue;
							}
							if (instance === 'segmentedColorRgb'){
								// do stuff | TODO
								continue;
							}
						}
						if (type === 'color_setting') {
							if (instance === 'colorRgb'){
								if (value > 0) {
									let color = splitRgb(value);
									self.INFO.color = '(R:' + color.r + ', G:' + color.g + ', B:' + color.b + ')';
								}
								continue;
							}
							if (instance === 'colorTemperatureK'){
								// do stuff
								if (value > 0) {
									self.INFO.color = value + "K";
								}
								continue;
							}
						}
						if (type === 'dynamic_scene') {
							if (instance === 'lightScene'){
								// do stuff | TODO
								continue;
							}
							if (instance === 'diyScene'){
								// do stuff | TODO
								continue;
							}
							if (instance === 'snapshot'){
								// do stuff | TODO
								continue;
							}
						}
						continue;
				}
			}
			// log the states
			if (self.config.verbose) {
				let list = JSON.stringify(self.INFO).split(',')
				let list2 = []
				let seg = false
				for (let i of list) {
					if (i.startsWith('\"segments')) { // "segments":{"segment 0":{"brightness":""
						let j = i.split(':')
						list2 += `${j[0]}:\n		${j[1]}:${j[2]}:${j[3]}`
						seg = true
					} else if (i.startsWith('\"segment ')) { // "segment 1":{"brightness":""
						list2 += '		' + i
					} else if (i.startsWith('\"color')) { // "color":""}
						if (seg) {
							list2 += `,${i}\n`
						}
					} else if (i.startsWith('\"api')) {
						continue;
					} else {
						list2 += i + '\n'
					}
				}
				self.log('debug', 'device info:\n' + list2)
				self.checkFeedbacks();
				self.checkVariables();
			}
		}).catch((error) => {self.processHTTPError(error);});
	},

	processHTTPError(error) {
		let self = this;

		switch (error.status) {
			case 400: // bad request
				if (error.response && error.response.body) {
					//convert response.res.text to json and get error message
					try {
						let error = error.response.body;
						if (error && error.message) {
							if (error.message == 'Device Not Found') {
								self.log('error', 'Device Not Found. Are you sure this is the correct MAC address?');
							}
							else {
								self.log('error', 'Unknown 400 error: ' + error.message);
							}
						}
					}
					catch(e) {
						self.log('error', 'Error parsing error response: ' + e);
					}
					break
				}
			case 401: // Unknown API Key
				self.log('error', 'Unknown API Key, Double check your API Key.');
				this.GOVEE_DEVICES = [
					{ id: 'select', label: 'No Devices Detected. Enter your API key, click "Save", wait a moment, and then return to this config to choose a device.' },
				]
				break
			case 429: //Too many requests
				self.log('error', 'Too many requests. Please wait a few seconds and try again.');
				break
			default:
				self.log('error', 'unhandled error: ' + error);
				break
		}
	},

	updateApiCalls(command) {
		let self = this;

		//update API calls remaining variable
		self.INFO.api_calls_remaining--;
		if (self.INFO.api_calls_remaining < 0) {
			self.INFO.api_calls_remaining = 0;
		}

		//store the api call in the array

		let apiCallObj = {
			'command': command,
			'datetime': new Date().getTime()
		};

		self.API_CALLS.push(apiCallObj);

		self.checkApiCalls();
	},

	checkApiCalls() {
		let self = this;

		//first clear the timeout
		clearTimeout(self.API_INTERVAL);

		//check each element in the array to see if it is older than one minute, and remove it if so
		let now = new Date().getTime();

		for (let i = 0; i < self.API_CALLS.length; i++) {
			if (now - self.API_CALLS[i].datetime > 60000) {
				self.API_CALLS.splice(i, 1); //this one happened more than a minute ago, remove it
				self.INFO.api_calls_remaining++;
			}
		}

		self.setVariableValues({'api_calls_remaining': self.INFO.api_calls_remaining});

		self.API_INTERVAL = setTimeout(this.checkApiCalls.bind(self), 10000); //check it again every 10 seconds until theres none left
	}
}