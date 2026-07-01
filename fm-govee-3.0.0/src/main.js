import { InstanceStatus, splitRgb }  from '@companion-module/base';

//const Govee = require('node-govee-led'); // old govee_api
import GoveeLED from './goveeAPI.js'; // this newer govee_api

export default function initConnection() {
	if (this.config.verbose) {
		this.log('debug', 'Initializing Connection...')
	}

	this.GOVEE = new GoveeLED({apiKey: this.config.api_key, mac: '', sku: ''}); // Loads overall info for setup
	getGoveeDevices.call(this).then(async(devices) => {
		if (devices.length <= 1) { // meaning theres no devices besides the default 'select' entry
			this.log('error', 'No devices detected. Make sure the device is powered on, connected to internet, and in the supported devices list (located in the help)');
		}

		this.goveeDevice = devices.find(device => device.id === this.config.govee_device);

		if (!this.goveeDevice) { // doesnt exist
			this.log('error', 'Invalid Govee Device Selected. Select an available device from the list');
			return
		}

		if (this.goveeDevice.id === 'select') {
			if (this.config.verbose) {
				this.log('warn', 'Select an available device from the list...')
				return
			}
		}

		this.log('debug', `Connecting to ${this.goveeDevice.label}`)

		this.updateStatus(InstanceStatus.Ok, 'Connection Successful');
		this.GOVEE = new GoveeLED({apiKey: this.config.api_key, mac: this.goveeDevice.id, sku: this.goveeDevice.sku}); // LOADS specific info for that device
		this.GOVEE.getInformation = getInformation.bind(this); // used in the refersh action
		await getInformation.call(this); // GETS information for that device
		setupInterval.call(this);

		if (this.config.verbose) {
			this.log('debug', 'Setup Finished!')
		}
	}).catch((error) => processHTTPError.call(this, error))
}

function setupInterval() {
	stopInterval.call(this);

	if (this.config.intervalEnabled == true) {
		this.INTERVAL = setInterval(fetchState.bind(this), this.config.intervalAmmount); // default every minute
		this.log('debug', 'Starting Update Interval.');
	}
}

function stopInterval() {
	if (this.INTERVAL !== null) {
		if (this.config.verbose) {
			this.log('debug', 'Stopping Update Interval.');
		}
		clearInterval(this.INTERVAL);
		this.INTERVAL = null;
	}
}

function getGoveeDevices() {
	return new Promise((resolve, reject) => {
		if (this.config.verbose) {
			this.log('debug', 'Getting Devices...');
		}

		this.GOVEE.getDevices().then((data) => {
			updateApiCalls('getdevices');
			buildDeviceList.call(this, data);
			if (this.config.verbose) {
				this.log('debug', `Devices Fetched: ${this.GOVEE_DEVICES.length-1}`);
			}

			//might need to do a check here to see if the device they had selected is still in the list, if not, change it back to 'select'
			if (this.config.govee_device !== 'select') {
				let goveeDevice = this.GOVEE_DEVICES.find(device => device.id === this.config.govee_device);
				if (!goveeDevice) {
					// doesnt exits in the list, and they have it selected
					if (this.config.verbose) {
						this.log('debug', 'Selected device doesnt exits in the list any more. Reverting to default');
					}
					this.config.govee_device = 'select';
					this.getConfigFields();
					this.configUpdated(this.config); // refresh the config to show the device list
					this.updateStatus(InstanceStatus.Connecting, 'Devices Auto-Detected. Please select a device.');
				}
			}
			resolve(this.GOVEE_DEVICES); // Return the device list
		}).catch((error) => reject(error));
	});
}

function buildDeviceList(data) {
	if (this.config.verbose) {
		this.log('debug', 'Building Device List...');
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
		this.GOVEE_DEVICES = devices;
		
		if (this.config.verbose) {
			let temp_device_list = []
			for (let i = 0; i < devices.length; i++) {
				temp_device_list[i] = devices[i].label + "\n"
			}
			this.log("debug", temp_device_list)
		}
	}
}
	
async function getInformation() {
	// Get all information from Device
	fetchState.call(this)

	if (this.config.verbose) {
		this.log('debug', 'Getting information...')
	}

	// Loop through capabilities to find kelvin info and maxsegments
	let minkelvin
	let maxkelvin
	let maxsegments
	for (let capability of this.goveeDevice.capabilities) {
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
	if (this.goveeDevice.sku === "H60A1") {
		maxsegments += 1;
	}

	this.INFO.maxsegments = maxsegments;
	this.INFO.minkelvin = minkelvin;
	this.INFO.maxkelvin = maxkelvin;

	// store to variables
	let variableObj = {
		'device_mac': this.goveeDevice.device,
		'sku': this.goveeDevice.sku,
		'device_name': this.goveeDevice.deviceName,
		'minkelvin': minkelvin ?? 2000,
		'maxkelvin': maxkelvin ?? 6500,
		'maxsegments': maxsegments ?? 0
	};
	this.setVariableValues(variableObj);

	// setting default values to segments so we can change it later
	for (let i = 0; i < maxsegments + 1; i++) {
		this.INFO.segments['segment ' + i] = {
			brightness: '',
			color: ''
		};
	}

	// Loop through capabilities to find snapshots
	for (let capability of this.goveeDevice.capabilities) {
		if (capability.instance === "snapshot") {
			if (capability.parameters.options.length > 0) { // atleast 1 snapshot needed
				this.SNAPSHOTS = buildSnapDIYList(capability);
			}
		}
	}

	// get the diy scenes
	// have to do it here since its a different api endpoint
	this.GOVEE.getDIYScenes().then((data) => {
		updateApiCalls('getdiyscenes');
		// loop through govee devices, find ours, and grab its data
		for (let capabilities of data.payload.capabilities) {
			if (Object.keys(capabilities).length > 0) {
				this.DIY_SCENES = buildSnapDIYList.call(this, capabilities);
			}
		}
	}).catch((error) => processHTTPError.call(this, error));

	// get the dynamic scenes
	// also have to do it here since its a different api endpoint
	await this.GOVEE.getDynamicScenes().then((data) => {
		updateApiCalls('getdynamicscenes');
		//loop through govee devices, find ours, and grab its data
		for (let capabilities of data.payload.capabilities) {
			if (capabilities.instance === "lightScene") {
				if (capabilities.parameters.options.length > 0) {
					this.DYNAMIC_SCENES = buildDynamicSceneList(capabilities);
				}
			}
		}
	}).catch((error) => {processHTTPError.call(this, error);});

	// reinitialize the actions with the updated info
	this.initActions();
}

function buildSnapDIYList(data) {
	let scenes = [];
	// Ensure data exists and contains the expected structure
	if (data.parameters?.options.length > 0) { // needs atleast 1 scene
		// Add default "Select a Scene" option
		scenes.push({ id: 'select', label: '(Select a Scene)' });
		// loop through all scenes adding them to the list
		for (let scene of data.parameters.options) {
			scenes.push({ id: scene.value, label: scene.name });
		}
	}
	return scenes;
}

function buildDynamicSceneList(data) {
	let scenes = [];
	// Ensure data exists and contains the expected structure
	if (data.parameters && data.parameters.options.length > 0) {
		// Add default "Select a Scene" option
		scenes.push({ id: 'select', label: '(Select a Scene)' });
		for (let i = 0; i < data.parameters.options.length; i++) {
			let scene = data.parameters.options[i]; 
			let sceneObj = {
				id: scene.value.id,
				paramId: scene.value.paramId,
				label: scene.name,
			};
			scenes.push(sceneObj);
		}
		// Sort scenes alphabetically by label (ignoring the default option)
		scenes = [scenes[0], ...scenes.slice(1).sort((a, b) => a.label.localeCompare(b.label))];
	}
	return scenes;
}

function fetchState() {
	let self = this;

	if (self.config.verbose) {
		self.log('debug', 'Getting current state...')
	}

	// get the states and do things with it
	self.GOVEE.getState().then((data) => {
		updateApiCalls('getstate');
		for (let capability of data.payload.capabilities) {
			let tokens = capability.type.split('.'); // devices.capabilities.online -> ['devices', 'capabilities', 'online']
			let type = tokens[2]
			let instance = capability.instance
			let value = capability.state.value
			switch (instance) {
				case 'online':
					self.INFO.online = value
					continue;
				case 'powerSwitch':
					self.INFO.power = value === 1 ? 'on' : 'off'
					continue;
				case 'gradientToggle': // gradienttoggle
					self.INFO.gradienttoggle = Boolean(value)
					continue;
				case 'brightness': // brightness
					self.INFO.brightness = value
					continue;
				case 'segmentedBrightness':
					// no need to do stuff because the api doesnt show anything with it
					continue;
				case 'segmentedColorRgb':
					// no need to do stuff because the api doesnt show anything with it
					continue;
				case 'colorRgb':
					// do stuff | TODO
					continue;
				case 'colorTemperatureK':
					// do stuff | TODO
					continue;
				case 'lightScene':
					// do stuff | TODO
					continue;
				case 'musicMode':
					// do stuff | TODO
					continue;
				case 'diyScene':
					// do stuff | TODO
					continue;
				case 'snapshot':
					// do stuff | TODO
					continue;
				case 'mainLightToggle':
					// do stuff | TODO
					continue;
				case 'backgroundLightToggle':
					// do stuff | TODO
					continue;
				default:
					self.log('warn', `State: Capability ${instance}, Missed`)
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
			self.checkAllFeedbacks();
			self.checkVariables();
		}
	}).catch((error) => {processHTTPError.call(this, error);});
}

export function processHTTPError(error) {
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
			self.log('error', `unhandled error: ${error?.message ?? error}`)

			if (error?.stack) {
				self.log('error', error.stack)
			}
			break
	}
}

export function updateApiCalls(command) {
	// let self = this;

	// //update API calls remaining variable
	// self.INFO.api_calls_remaining--;
	// if (self.INFO.api_calls_remaining < 0) {
	// 	self.INFO.api_calls_remaining = 0;
	// }

	// //store the api call in the array

	// let apiCallObj = {
	// 	'command': command,
	// 	'datetime': new Date().getTime()
	// };

	// self.API_CALLS.push(apiCallObj);

	// checkApiCalls();
}

// function checkApiCalls() {
// 	let self = this;

// 	//first clear the timeout
// 	clearTimeout(self.API_INTERVAL);

// 	//check each element in the array to see if it is older than one minute, and remove it if so
// 	let now = new Date().getTime();

// 	for (let i = 0; i < self.API_CALLS.length; i++) {
// 		if (now - self.API_CALLS[i].datetime > 60000) {
// 			self.API_CALLS.splice(i, 1); //this one happened more than a minute ago, remove it
// 			self.INFO.api_calls_remaining++;
// 		}
// 	}

// 	self.setVariableValues({'api_calls_remaining': self.INFO.api_calls_remaining});

// 	self.API_INTERVAL = setTimeout(this.checkApiCalls.bind(self), 10000); //check it again every 10 seconds until theres none left
// }