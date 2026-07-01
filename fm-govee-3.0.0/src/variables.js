export function initVariables() {
	let self = this;

	self.setVariableDefinitions({
		device: { name: 'MAC Address' },
		sku: { name: 'Model' },
		device_name: { name: 'Device Name' },

		online: { name: 'Online' },
		power: { name: 'Last Set Power State' },
		brightness: { name: 'Last Set Brightness' },
		color: { name: 'Last Set Color' },
		minkelvin: { name: 'Min Kelvin Temperature' },
		maxkelvin: { name: 'Max Kelvin Temperature' },
		maxsegments: { name: 'Max Number of Segments' },
		snapshot: { name: 'Current Snapshot' },
		dynamicscene: { name: 'Current Dynamic Scene' },
		diyscene: { name: 'Current DIY Scene' },

		api_calls_remaining: { name: 'API Calls Remaining' }
	})
}

export function checkVariables() {
	let self = this;

	try {
		let variableObj = {};

		variableObj.online = self.INFO.online;
		variableObj.power = self.INFO.power;
		variableObj.brightness = self.INFO.brightness;
		variableObj.color = self.INFO.color;
		variableObj.minkelvin = self.INFO.minkelvin;
		variableObj.maxkelvin = self.INFO.maxkelvin;
		variableObj.maxsegments = self.INFO.maxsegments;
		variableObj.snapshot = self.INFO.snapshot;
		variableObj.dynamicscene = self.INFO.dynamicscene;
		variableObj.diyscene = self.INFO.diyscene;

		variableObj.api_calls_remaining = self.INFO.api_calls_remaining

		self.setVariableValues(variableObj);
	}
	catch(error) {
		self.log('error', 'Error setting variables: ' + error);
	}
}
