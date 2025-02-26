const { InstanceStatus } = require('@companion-module/base')

//const Govee = require('node-govee-led');
const Govee = require('./goveeAPI');

module.exports = {
	initConnection: function () {
		let self = this;

		if (self.config.api_key !== '') {
			if (self.config.govee_device === 'select') {
				if (self.GOVEE_DEVICES[0].id == 'select' && self.GOVEE_DEVICES.length < 3) { //the list hasn't been loaded yet if there's only 2 entries
					//just get the list of available devices and update the config with the list so they can choose one
					self.GOVEE = new Govee({apiKey: self.config.api_key, mac: '', sku: ''});
          self.GOVEE.getInformation = self.getInformation.bind(self);
					self.getGoveeDevices();
				}
			}
			else if (self.config.govee_device === 'manual') {
				//they selected manual, so load it the manual way
				if (self.config.device_mac !== '' && self.config.sku !== '') {
					self.GOVEE = new Govee({apiKey: self.config.api_key, mac: self.config.device_mac, sku: self.config.sku});
          self.GOVEE.getInformation = self.getInformation.bind(self);
					self.getInformation(self.config.device_mac); //get information once on startup
					self.setupInterval();
				}
			}
			else {
				//they selected a device, so load it
				self.GOVEE = new Govee({apiKey: self.config.api_key, mac: '', sku: ''});
        self.getGoveeDevices().then(function(devices) {
          if (devices.length > 2) {
            let goveeDevice = devices.find(device => device.id === self.config.govee_device);
            if (goveeDevice) {
              self.updateStatus(InstanceStatus.Ok, 'Connected to ' + goveeDevice.label);
              self.GOVEE = new Govee({apiKey: self.config.api_key, mac: goveeDevice.id, sku: goveeDevice.sku});
              self.GOVEE.getInformation = self.getInformation.bind(self);
              self.getInformation(goveeDevice.id); //get information once on startup
              self.setupInterval();
            }
            else {
              self.log('error', 'Invalid Govee Device Selected.');
            }
          } else {
            self.log('error', 'No devices detected. Check the API key');
          }
        }).catch(function(error) { console.log(error); });
      }
    }
    else {
      self.log('error', 'No API Key Specified.');
    }
  },
	
	setupInterval: function() {
		let self = this;
	
		self.stopInterval();
	
		if (self.config.intervalEnabled == true) {
			self.INTERVAL = setInterval(self.getState.bind(self), 60000); //every minute
			self.log('info', 'Starting Update Interval.');
		}
	},
	
	stopInterval: function() {
		let self = this;
	
		if (self.INTERVAL !== null) {
			self.log('info', 'Stopping Update Interval.');
			clearInterval(self.INTERVAL);
			self.INTERVAL = null;
		}
	},

	getGoveeDevices: function () {
		let self = this;
    return new Promise((resolve, reject) => {
      self.log('info', 'Fetching Govee Devices...');

      self.GOVEE.getDevices().then(function(data) {
        self.updateApiCalls('getdevices');
        self.buildDeviceList.bind(self)(data);
        self.log('info', `Devices Fetched: ${self.GOVEE_DEVICES.length}`);

        //might need to do a check here to see if the device they had selected is still in the list, if not, change it back to 'select'
        if (self.config.govee_device !== 'select' && self.config.govee_device !== 'manual') {
          let goveeDevice = self.GOVEE_DEVICES.find(device => device.id === self.config.govee_device);
          if (!goveeDevice) {
            self.config.govee_device = 'select';
            self.getConfigFields();
            self.configUpdated(self.config);
            self.updateStatus(InstanceStatus.Connecting, 'Devices Auto-Detected. Please select a device.');
          }
          else {
            self.GOVEE = new Govee({apiKey: self.config.api_key, mac: goveeDevice.id, sku: goveeDevice.sku});
            self.updateStatus(InstanceStatus.Ok);
          }
        }
        resolve(self.GOVEE_DEVICES); // Return the devices
      }).catch((error) => {
        self.log('error', 'Error fetching devices: ' + error);
        reject(error);
      });
    });
	},

	buildDeviceList: function (data) {
		let self = this;
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

			let manualDeviceObj = {};
			manualDeviceObj.id = 'manual';
			manualDeviceObj.label = '(Manually Specify Device MAC Address and Model)';
			devices.push(manualDeviceObj);

			self.GOVEE_DEVICES = devices;
		}
	},
	
	getInformation: async function (mac) {
		//Get all information from Device
		let self = this;
    self.GOVEE.getDevices().then(function(data) {
      self.updateApiCalls('getdevices');
      self.buildDeviceList(data);

      //loop through govee devices, find ours, and grab its data
      let goveeDevice = self.GOVEE_DEVICES.find(device => device.id === mac);
      if (goveeDevice) {
        // do getState() stuff here to update variables
        //
        //
        //
        //
        // Loop through capabilities to find colorTemperatureK
        for (let capabilities of goveeDevice.capabilities) {
          if (capabilities.instance === "colorTemperatureK") {
            goveeDevice.minkelvin = capabilities.parameters.range.min;
            goveeDevice.maxkelvin = capabilities.parameters.range.max;
          }
          // getting the max segments
          else if (capabilities.type === "devices.capabilities.segment_color_setting") {
            for (let field of capabilities.parameters.fields) {
              if (field.fieldName === "segment" && field.size) {
                goveeDevice.maxsegments = field.size.max - 1;
              }
            }
          }
        }

        let segments = goveeDevice.maxsegments;
        // thing with the H60A1 where it has more segments than the api allows
        // also it shows 12 segments instead of 13, 13 being the main light
        if (self.GOVEE.sku === "H60A1") {
          segments += 1;
        }

        self.INFO.maxsegments = segments;
        self.INFO.minkelvin = goveeDevice.minkelvin;
        self.INFO.maxkelvin = goveeDevice.maxkelvin;

        let variableObj = {
          'device': goveeDevice.device,
          'sku': goveeDevice.sku,
          'device_name': goveeDevice.deviceName,
          'minkelvin': goveeDevice.minkelvin ?? 2000,
          'maxkelvin': goveeDevice.maxkelvin ?? 6500,
          'maxsegments': segments ?? 0
        };
        self.setVariableValues(variableObj);
        for (let i = 0; i < segments + 1; i++) {
          self.INFO.segments['segment ' + i] = {
            brightness: '',
            color: ''
          };
        }
        // do snapshot stuff here
        // Loop through capabilities to find snapshots
        for (let capabilities of goveeDevice.capabilities) {
          if (capabilities.instance === "snapshot") {
            if (capabilities.parameters.options.length > 0) {
              self.SNAPSHOTS = self.buildSnapDIYList(capabilities);
            }
          }
          // getting the max segments
          else if (capabilities.type === "devices.capabilities.segment_color_setting") {
            for (let field of capabilities.parameters.fields) {
              if (field.fieldName === "segment" && field.size) {
                goveeDevice.maxsegments = field.size.max - 1;
              }
            }
          }
        }
        self.initActions();
      }
      else {
        self.log('error', `Invalid Govee Device Selected: ${mac}`);
      }
    }).catch(function(error) {self.processError(error);});

    // do things with the diy scenes
    self.GOVEE.getDIYScenes().then(function(data) {
      self.updateApiCalls('getdiyscenes');
      //loop through govee devices, find ours, and grab its data
      let goveeDevice = self.GOVEE_DEVICES.find(device => device.id === mac);
      if (goveeDevice) {
        for (let capabilities of data.payload.capabilities) {
          if (capabilities.parameters.options.length === "diyScene") {
            if (capabilities.length > 0) {
              self.DIY_SCENES = self.buildSnapDIYList(capabilities);
            }
          }
        }
      }
      else {
        self.log('error', `Invalid Govee Device Selected: ${mac}`);
      }
    }).catch(function(error) {self.processError(error);});

    // do things with the dynamic scenes
    self.GOVEE.getDynamicScenes().then(function(data) {
      self.updateApiCalls('getdynamicscenes');
      //loop through govee devices, find ours, and grab its data
      let goveeDevice = self.GOVEE_DEVICES.find(device => device.id === mac);
      if (goveeDevice) {
        for (let capabilities of data.payload.capabilities) {
          if (capabilities.instance === "lightScene") {
            if (capabilities.parameters.options.length > 0) {
              self.DYNAMIC_SCENES = self.buildDynamicSceneList(capabilities);
            }
          }
        }
      }
      else {
        self.log('error', `Invalid Govee Device Selected: ${mac}`);
      }
    }).catch(function(error) {self.processError(error);});
	},

	buildSnapDIYList: function (data) {
		let self = this;
		let scenes = [];
    // Ensure data exists and contains the expected structure
    if (data.parameters && data.parameters.options.length > 0) {
      // Add default "Select a Scene" option
			scenes.push({ id: 'select', label: '(Select a Scene)' });
			for (let i = 0; i < data.parameters.options.length; i++) {
				let sceneObj = { ...data.parameters.options[i] };
        let sceneObj2 = {};
        sceneObj2.id = sceneObj.value
        sceneObj2.label = sceneObj.name
				scenes.push(sceneObj2);
			}
		}
    return scenes;
	},

	buildDynamicSceneList: function (data) {
    let self = this;
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

	getState: function () {
		let self = this;

		console.log('get state ran')

		self.GOVEE.getState().then(function(data) {
			self.updateApiCalls('getstate');
			console.log(data);
		}).catch(function(error) {
			self.processError(error);
		});
	},

	processError: function(err) {
		let self = this;

		if (err.status == 400) {  //bad request
			if (err.response && err.response.body) {
				//convert response.res.text to json and get error message
				try {
					let error = err.response.body;
					if (error && error.message) {
						if (error.message == 'Device Not Found') {
							self.log('error', 'Device Not Found. Are you sure this is the correct MAC address?');
						}
						else {
							self.log('error', 'Unknown error: ' + error.message);
						}
					}
				}
				catch(e) {
					self.log('error', 'Error parsing error response: ' + e);
				}
			}
			else {
				self.log('error', 'Unknown error occured.');
			}
		}
		else if (err.status == 429) { //Too many requests
			self.log('error', 'Too many requests. Please wait a few seconds and try again.');
		}
		else {
			self.log('error', 'Unknown error occurred.');
			console.log(err);
		}
	},

	updateApiCalls: function(command) {
		let self = this;

		//store the api call in the array

		/*let apiCallObj = {
			'command': command,
			'datetime': new Date().getTime()
		};*/

		//self.API_CALLS.push(apiCallObj);

		//self.checkApiCalls();
	},

	checkApiCalls: function() {
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

		//update API calls remaining variable
		self.INFO.api_calls_remaining = self.INFO.api_calls_remaining - self.API_CALLS.length;
		if (self.INFO.api_calls_remaining < 0) {
			self.INFO.api_calls_remaining = 0;
		}

		self.setVariableValues({'api_calls_remaining': self.INFO.api_calls_remaining});

		self.API_INTERVAL = setTimeout(this.checkApiCalls.bind(self), 10000); //check it again in 10 seconds
	}
}