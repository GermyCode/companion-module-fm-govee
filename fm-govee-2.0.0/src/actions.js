const { combineRgb, splitRgb } = require('@companion-module/base');

const colorsys = require('colorsys');

module.exports = {
	initActions: function () {
		let self = this;
		let actions = {};

		actions.power = {
			name: 'Power',
			options: [
				{
					type: 'dropdown',
					label: 'Power',
					id: 'power',
					default: 'on',
					choices: [
						{ id: 'on', label: 'On' },
						{ id: 'off', label: 'Off' },
						{ id: 'toggle', label: 'Toggle' },
					]
				}
			],
			callback: async function (action) {
				let set = action.options.power
				if (set === 'toggle') {
					set = self.INFO.power === 'off' ? 'on' : 'off'
				}
				let setVal = set === 'on' ? 1 : 0
				self.GOVEE.setPowerSwitch(setVal).then((data) => {
					self.updateApiCalls('power');
					self.INFO.power = set;
					self.checkVariables();
					self.checkFeedbacks();
				}).catch((error) => {self.processError(error);});
				if (self.config.verbose) {
					self.log('debug', 'Setting power to ' + set);
				}
			}
		}
		actions.changeBrightness = {
			name: 'Change Brightness',
			options: [
				{
					type: 'number',
					label: 'Brightness',
					id: 'brightness',
					default: 100,
					min: 0,
					max: 100,
					required: true,
					range: false,
				}
			],
			callback: async function (action) {
				let brightness = action.options.brightness
				if (brightness < 1) {
					brightness = 0;
					self.GOVEE.setPowerSwitch(0).then((data) => {
						self.updateApiCalls('power');
						self.INFO.power = 'off';
						self.checkVariables();
						self.checkFeedbacks();
					}).catch((error) => {
						self.processError(error);
					});
				} else if (brightness > 100) {
					brightness = 100;
				} else {
					self.GOVEE.setBrightness(brightness).then((data) => {
						self.updateApiCalls('brightness');
						self.INFO.power = 'on';
						self.INFO.brightness = brightness;
						self.checkVariables();
						self.checkFeedbacks();
					}).catch((error) => {
						self.processError(error);
					});
				}
				if (self.config.verbose) {
					self.log('debug', 'Setting brightness to ' + brightness.toString() + '%');
				}
			}
		}

		actions.segmentBrightness = {
			name: 'Change Segment Brightness',
			options: [
				{
					type: 'textinput',
					label: `Segment: 0,1,..,${self.getVariableValue('maxsegments')}`,
					id: 'numofseg',
					default: '0,1,2',
					required: true,
				},
				{
					type: 'number',
					label: 'Brightness',
					id: 'segbrightness',
					default: '',
					min: 0,
					max: 100,
					required: true,
				},
			],
			callback: async function (action) {
				let segArray = action.options.numofseg.split(',').map(Number);
				if (!self.INFO.segments || Object.keys(self.INFO.segments).length < 1) {
					self.log('error', 'This device does not support segments.');
					return;
				}
				if (segArray.length > Object.keys(self.INFO.segments).length) {
					self.log('error', 'This device does not support that many segments.');
					return;
				}
				try {
					// Ensure self.INFO.segments exists
					if (!self.INFO.segments) {
						self.log('error', 'self.INFO.segments is undefined!');
						return;
					}
					// Convert segment keys to match input format (e.g., "segment 1" -> 1)
					let segmentKeys = Object.keys(self.INFO.segments).map(key => parseInt(key.replace('segment ', '')));
					self.GOVEE.setSegmentBrightness(action.options.segbrightness, segArray).then((data) => {
						if (self.GOVEE.sku === 'H60A1' && segArray.length > 13) {
							self.updateApiCalls('segmentbrightnessh60a1main');
							self.updateApiCalls('segmentbrightnessh60a1ring');
						} else {
							self.updateApiCalls('segmentbrightness');
						}
						self.INFO.power = 'on';
						self.INFO.snapshot = '';
						self.checkVariables();
						self.checkFeedbacks();
						for (let segId of segArray) {
							if (segmentKeys.includes(segId)) {
								self.INFO.segments[`segment ${segId}`].brightness = action.options.segbrightness;
							} else {
								self.log('warn', `Segment ${segId} not found in self.INFO.segments`);
							}
						}
					}).catch((error) => {
						self.processError(error);
					});
					if (self.config.verbose) {
						self.log('debug', `Setting brightness of segments ${JSON.stringify(segArray)} to ${action.options.segbrightness}%`);
					}
				} catch (error) {self.log('error', `Failed to update segments: ${error.message}`);}
			}
		}

		actions.gradientToggle = {
			name: 'Segment Gradient',
			options: [{
				type: 'dropdown',
				label: 'Gradient',
				id: 'gradienttoggle',
				default: 'off',
				choices: [
					{ id: 'on', label: 'On' },
					{ id: 'off', label: 'Off' },
					{ id: 'toggle', label: 'Toggle' },
				]
			}],
			callback: async function (action) {
				if (!self.INFO.segments || Object.keys(self.INFO.segments).length < 1) {
					self.log('error', 'This device does not support segments.');
					return;
				}
				try {
					let set = action.options.gradienttoggle === 'on' ? true : false
					if (action.options.gradienttoggle === 'toggle') {
						set = self.INFO.gradienttoggle === false ? true : false
					}
					self.GOVEE.setGradientToggle(set).then((data) => {
						self.updateApiCalls('gradienttoggle');
						self.INFO.gradienttoggle = set;
						self.checkFeedbacks()
						self.checkVariables()
					}).catch((error) => {
						self.processError(error);
					});
					if (self.config.verbose) {
						self.log('debug', 'Setting gradient toggle to ' + set);
					}
				} catch (error) {self.log('error', 'Failed to update set gradient toggle');}
			}
		}

		actions.changeColor = {
			name: 'Change Color',
			options: [
				{
					type: 'dropdown',
					label: 'Select Color Mode',
					id: 'colortype',
					default: 'rgb',
					choices: [
						{ id: 'rgb', label: 'RGB Color' },
						{ id: 'kelvin', label: 'Kelvin Temperature' }
					]
				},
				{
					type: 'colorpicker',
					id: 'colorrgb',
					label: 'Pick a Color',
					default: combineRgb(255, 255, 255),
					required: true,
					isVisible: (options) => options.colortype === 'rgb' // Only show if RGB is selected
				},
				{
					type: 'number',
						id: 'colorkelvin',
						label: `Kelvin Temperature (${self.getVariableValue('minkelvin')} - ${self.getVariableValue('maxkelvin')})`,
						default: 3000,
						min: parseInt(self.getVariableValue('minkelvin')) || 2000, // Fallback if undefined
						max: parseInt(self.getVariableValue('maxkelvin')) || 6500, // Fallback if undefined
						required: true,
						isVisible: (options) => options.colortype === 'kelvin' // Only show if Kelvin is selected
					},
			],
			callback: async function (action) {
				if (actions.changeColor.options.colortype === 'kelvin') {
					actions.changeColor.options.colorkelvin.label = 'Kelvin Temperature (' + self.INFO.minkelvin + '-' + self.INFO.maxkelvin + ')';
				}
				let option = action.options;
				if (option.colortype === 'rgb') {
					let color = splitRgb(action.options.colorrgb);
					try {
						let hex = colorsys.rgbToHex(color.r, color.g, color.b);
						self.GOVEE.setColor(hex).then((data) => {
							self.updateApiCalls('setcolorrgb');
							self.INFO.power = 'on';
							self.INFO.color = '(R:' + color.r + ', G:' + color.g + ', B:' + color.b + ')';
							self.INFO.snapshot = '';
							self.INFO.dynamicscene = '';
							self.INFO.diyscene = '';
							self.checkVariables();
							self.checkFeedbacks();
						}).catch((error) => {
							self.processError(error);
						});
						for (let key in self.INFO.segments) {
							self.INFO.segments[key].color = ''; // remove each segment's color
					}
					}
					catch(error) {
						//probably error converting to hex
						self.log('error', 'Error changing color: ' + error.toString());
					}
					if (self.config.verbose) {
						self.log('debug', 'Setting color to (R:' + color.r + ', G:' + color.g + ', B:' + color.b + ')');
					}
				} 
				else if (option.colortype === 'kelvin') {
					let kelvin = action.options.colorkelvin;
					if (!Number.isInteger(kelvin)) {self.log('error', 'Kelvin temperature not a number'); return;}
					if (kelvin < self.INFO.minkelvin || kelvin > self.INFO.maxkelvin) {self.log('error', 'Kelvin temperature not between '+self.INFO.minkelvin+'-'+self.INFO.maxkelvin); return;}
					try {
						self.GOVEE.setColorTemperature(kelvin, self.INFO).then((data) => {
							self.updateApiCalls('colortemperature');
							self.INFO.power = 'on';
							self.INFO.color = kelvin + "K";
							self.INFO.snapshot = '';
							self.INFO.dynamicscene = '';
							self.INFO.diyscene = '';
							self.checkVariables();
							self.checkFeedbacks();
						}).catch((error) => {
							self.processError(error);
						});
					}
					catch(error) {
						//probably something
						self.log('error', 'Error changing color: ' + error.toString());
					}
					if (self.config.verbose) {
						self.log('debug', 'Setting color temp to ' + kelvin + 'K');
					}
				}
			}
		}

		actions.segmentColor = {
			name: 'Change Segment Color',
			options: [
				{
					type: 'textinput',
					label: `Segment: 0,1,..,${self.GOVEE.sku === 'H60A1' ? self.getVariableValue('maxsegments')-1 : self.getVariableValue('maxsegments')}`,
					id: 'numofseg',
					default: '0,1,2',
					required: true,
				},
				{
					type: 'colorpicker',
					id: 'segcolorrgb',
					label: 'Pick a Color',
					default: combineRgb(255, 255, 255),
					required: true,
				},
			],
			callback: async function (action) {
				let segArray = action.options.numofseg.split(',').map(Number);
				if (!self.INFO.segments || Object.keys(self.INFO.segments).length < 1) {
					self.log('error', 'This device does not support segments.');
					return;
				}
				for (let segId of segArray) {
					if (segId === 13) {
						self.log('error', 'This device doesnt support changing the main light segment color. Try setting the device color then the other segments separately');
						return;
					} else if (segId > self.INFO.maxsegments){
						self.log('error', 'This device doesnt support that many segments: ' + segId);
						return;
					}
				}
				try {
					// Ensure self.INFO.segments exists and is an object
					if (!self.INFO.segments) {
						self.log('error', 'self.INFO.segments is undefined!');
						return;
					}
					// Convert segment keys to match input format (e.g., "segment 1" -> 1)
					let segmentKeys = Object.keys(self.INFO.segments).map(key => parseInt(key.replace('segment ', '')));
					let color = splitRgb(action.options.segcolorrgb);
					try {
						let hex = colorsys.rgbToHex(color.r, color.g, color.b);
						self.GOVEE.setSegmentColor(hex, segArray).then((data) => {
							self.updateApiCalls('segmentcolor');
							for (let segId of segArray) {
								if (segmentKeys.includes(segId)) {
									self.INFO.segments[`segment ${segId}`].color = '(R:' + color.r + ', G:' + color.g + ', B:' + color.b + ')';
								} else {
									self.log('warn', `Segment ${segId} not found in self.INFO.segments`);
								}
							}
							self.INFO.power = 'on';
							self.INFO.snapshot = '';
							self.checkVariables();
							self.checkFeedbacks();
						}).catch((error) => {
							self.processError(error);
						});
					}
					catch(error) {
						//probably error converting to hex
						self.log('error', 'Error changing color: ' + error.toString());
					}
					if (self.config.verbose) {
						self.log('debug', `Setting color of segments ${JSON.stringify(segArray)} to (R:` + color.r + ', G:' + color.g + ', B:' + color.b + ')');
					}
				} catch (error) {self.log('error', `Failed to update segments: ${error.message}`);}
			}
		}

		actions.snapshot = {
			name: 'Snapshot',
			options: [{
				type: 'dropdown',
				label: 'Snapshot',
				id: 'snapshot',
				default: 'select',
				choices: self.SNAPSHOTS
			}],
			callback: async function (action) {
				if (action.options.snapshot !== 'select') {
					// Find the matching snapshot object
					let selectedSnapshot = self.SNAPSHOTS.find(snap => snap.id == action.options.snapshot);
					if (selectedSnapshot) {
						// self.log('debug', `Snapshot Selected: ${selectedSnapshot.label} (ID: ${selectedSnapshot.id})`);
						self.GOVEE.setSnapshot(action.options.snapshot).then((data) => {
							self.updateApiCalls('setsnapshot');
							self.INFO.power = 'on';
							self.INFO.color = '';
							self.INFO.snapshot = selectedSnapshot.label;
							self.INFO.dynamicscene = '';
							self.INFO.diyscene = '';
							self.checkVariables();
							self.checkFeedbacks();
							 self.log('debug', 'Setting snapshot to \'' + selectedSnapshot.label + '\'')
						}).catch((error) => {self.processError(error);});
					} else {
						self.log('error', `Snapshot with ID ${action.options.snapshot} not found`);
					}
				} else {
					self.log('warn', 'Please select an available snapshot');
				}
			}
		};


		actions.DIYScene = {
			name: 'DIY Scene',
			options: [{
				type: 'dropdown',
				label: 'Scene',
				id: 'diyscene',
				default: 'select',
				choices: self.DIY_SCENES
			}],
			callback: async function (action) {
				if (action.options.diyscene !== 'select') {
					// Find the matching diyscene object
					let selectedDIYScene = self.DIY_SCENES.find(diy => diy.id == action.options.diyscene);
					if (selectedDIYScene) {
						self.log('debug', `DIY Scene Selected: ${selectedDIYScene.label} (ID: ${selectedDIYScene.id})`);
						self.GOVEE.setDIYScene(selectedDIYScene.id);
						self.updateApiCalls('setdiyscene');
						self.INFO.power = 'on';
						self.INFO.color = '';
						self.INFO.snapshot = '';
						self.INFO.dynamicscene = '';
						self.INFO.diyscene = selectedDIYScene.label;
						self.checkVariables();
						self.checkFeedbacks();
					} else {
						self.log('error', `DIY Scene with ID ${action.options.diyscene} not found`);
					}
				} else {
					self.log('warn', 'Please select an available DIY Scene');
				}
			}
		}

		actions.dynamicScene = {
			name: 'Dynamic Scene',
			options: [{
				type: 'dropdown',
				label: 'Scene',
				id: 'dynamicscene',
				default: 'select',
				choices: self.DYNAMIC_SCENES
			}],
			callback: async function (action) {
				if (action.options.dynamicscene !== 'select') {
					// Find the matching dynamicscene object
					let selectedDynamicScene = self.DYNAMIC_SCENES.find(dyn => dyn.id == action.options.dynamicscene);
					if (selectedDynamicScene) {
						self.log('debug', `Dynamic Scene Selected: ${selectedDynamicScene.label} (ID: ${selectedDynamicScene.id})`);
						self.GOVEE.setDynamicScene(action.options.dynamicscene);
						self.updateApiCalls('setdynamicscene');
						self.INFO.power = 'on';
						self.INFO.color = '';
						self.INFO.snapshot = '';
						self.INFO.dynamicscene = selectedDynamicScene.label;
						self.INFO.diyscene = '';
						self.checkVariables();
						self.checkFeedbacks();
					} else {
						self.log('error', `Dynamic Scene with ID ${action.options.dynamicscene} not found`);
					}
				} else {
					self.log('warn', 'Please select an available Dynamic Scene');
				}
			}
		}

		actions.refreshDevice = {
			name: 'Refresh Device',
			callback: async function (action) {
				if (self.GOVEE_DEVICES.length > 2) {
					let goveeDevice = self.GOVEE_DEVICES.find(device => device.id === self.GOVEE.mac);
					if (goveeDevice) {
						self.log('debug', 'Refreshing Device');
						self.GOVEE.getInformation(self.GOVEE.mac);
					} else {
						self.log('error', 'Can\'t refresh device. Device not found');
					}
				} else {
					self.log('error', 'Can\'t refresh device. Make sure a device is selected');
				}
			}
		}

		actions.getDebugInfo = {
			name: 'Get debug',
			options: [
				{
					type: 'textinput',
					label: 'Debug Key',
					id: 'debugINFO',
					default: 'INFO',
					required: false
				}
			],
			callback: async function (action) {
				// Ensure self.INFO is initialized
				if (!self.INFO) {
					self.log('error', 'INFO is not initialized yet!');
					return;
				}
				if (action.options.debugINFO !== '') {
					// Check if the key exists in self.INFO
					if (self.hasOwnProperty(action.options.debugINFO)) {
						self.log('debug', `INFO (${action.options.debugINFO}): ` + JSON.stringify(self[action.options.debugINFO], null, 2));
					} else {
						self.log('warn', `INFO: Key '${action.options.debugINFO}' not found`);
					}
				} else {
					// Log the entire self.INFO object
					self.log('debug', 'INFO: ' + JSON.stringify(self.INFO, null, 2));
				}
			}
		};
		self.setActionDefinitions(actions);
	}
}