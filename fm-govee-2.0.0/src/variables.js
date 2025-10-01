module.exports = {
	initVariables: function () {
		let self = this;

		let variables = [];

		variables.push({ variableId: 'device', name: 'MAC Address' })
		variables.push({ variableId: 'sku', name: 'Model' })
		variables.push({ variableId: 'device_name', name: 'Device Name' })
				
		variables.push({ variableId: 'power', name: 'Last Set Power State' })
		variables.push({ variableId: 'brightness', name: 'Last Set Brightness' })
		variables.push({ variableId: 'color', name: 'Last Set Color' })
		variables.push({ variableId: 'minkelvin', name: 'Min Kelvin Temperature' })
		variables.push({ variableId: 'maxkelvin', name: 'Max Kelvin Temperature' })
		variables.push({ variableId: 'maxsegments', name: 'Max Number of Segments' })
		variables.push({ variableId: 'snapshot', name: 'Current Snapshot' })
		variables.push({ variableId: 'dynamicscene', name: 'Current Dynamic Scene' })
		variables.push({ variableId: 'diyscene', name: 'Current DIY Scene' })

		//variables.push({ variableId: 'api_calls_remaining', name: 'API Calls Remaining' })

		self.setVariableDefinitions(variables);
	},

	checkVariables: function () {
		let self = this;

		try {
			let variableObj = {};

			variableObj.power = self.INFO.power;
			variableObj.brightness = self.INFO.brightness;
			variableObj.color = self.INFO.color;
			variableObj.minkelvin = self.INFO.minkelvin;
			variableObj.maxkelvin = self.INFO.maxkelvin;
			variableObj.maxsegments = self.INFO.maxsegments;
			variableObj.snapshot = self.INFO.snapshot;
			variableObj.dynamicscene = self.INFO.dynamicscene;
			variableObj.diyscene = self.INFO.diyscene;

			self.setVariableValues(variableObj);
		}
		catch(error) {
			self.log('error', 'Error setting variables: ' + error);
		}
	}
}
