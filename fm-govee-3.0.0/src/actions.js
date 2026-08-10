import { combineRgb, splitRgb } from '@companion-module/base';
import colorsys from 'colorsys';

import { processHTTPError, updateApiCalls } from './main.js'

export default function	initActions() {
	let actions = {};

	actions.power = {
		name: 'Power',
		options: [
			{
				type: 'checkbox',
				label: 'Text Input',
				id: 'use_textinput',
				tooltip: 'Toggle between the dropdown preset options, and custom text input.',
				default: false,
				disableAutoExpression: true
			},
			{
				type: 'dropdown',
				label: 'Power',
				id: 'power_dropdown',
				default: 'on',
				choices: [
					{ id: 'on', label: 'On' },
					{ id: 'off', label: 'Off' },
					{ id: 'toggle', label: 'Toggle' },
				],
				disableAutoExpression: true,
				isVisibleExpression: '$(options:use_textinput) != true'
			},
			{
				type: 'textinput',
				label: 'Power',
				id: 'power_text',
				default: 'on',
				tooltip: '(on = on, off = off, 1 = on, 0 = off, true = on, false = off)',
				useVariables: true,
				isVisibleExpression: '$(options:use_textinput) == true'
			}
		],
		callback: async (action) => {
			const rawPower = action.options.use_textinput ? action.options.power_text : action.options.power_dropdown

			let set = (() => {
				// Handle actual booleans
				if (rawPower === true) return 'on'
				if (rawPower === false) return 'off'

				// Handle actual numbers
				if (rawPower === 1) return 'on'
				if (rawPower === 0) return 'off'

				// Handle strings
				const str = String(rawPower).trim().toLowerCase()

				if (str === 'on') return 'on'
				if (str === 'off') return 'off'
				if (str === '1') return 'on'
				if (str === '0') return 'off'
				if (str === 'true') return 'on'
				if (str === 'false') return 'off'

				if (str === 'toggle') return 'toggle'
			})()

			if (set === 'toggle') {
				set = this.INFO.power === 'off' ? 'on' : 'off'
			}
			let setVal = set === 'on' ? 1 : 0
			this.GOVEE.setPowerSwitch(setVal).then((data) => {
				updateApiCalls('power');
				this.INFO.power = set;
				this.checkVariables();
				this.checkAllFeedbacks();
			}).catch((error) => {processHTTPError.call(this, error);});
			if (this.config.verbose) {
				this.log('debug', 'Setting power to ' + set);
			}
		}
	}
	actions.changeBrightness = {
		name: 'Change Brightness',
		options: [
			{
				type: 'textinput',
				label: 'Brightness',
				id: 'brightness',
				default: '100',
				useVariables: true,
				tooltip: '0-100, variables allowed'
			}
		],
		callback: async (action) => {
			const raw = action.options.brightness
			let brightness = Number(String(raw).trim())

			if (!Number.isFinite(brightness)) {
				this.log('warn', `Invalid brightness: ${raw}`)
				return
			}

			if (brightness < 1) {
				brightness = 0;
				this.GOVEE.setPowerSwitch(0).then((data) => {
					updateApiCalls('power');
					this.INFO.power = 'off';
					this.checkVariables();
					this.checkAllFeedbacks();
				}).catch((error) => {
					processHTTPError.call(this, error);
				});
			} else if (brightness > 100) {
				brightness = 100;
			} else {
				this.GOVEE.setBrightness(brightness).then((data) => {
					updateApiCalls('brightness');
					this.INFO.power = 'on';
					this.INFO.brightness = brightness;
					this.checkVariables();
					this.checkAllFeedbacks();
				}).catch((error) => {
					processHTTPError.call(this, error);
				});
			}
			if (this.config.verbose) {
				this.log('debug', 'Setting brightness to ' + brightness.toString() + '%');
			}
		}
	}

	actions.segmentBrightness = {
		name: 'Change Segment Brightness',
		options: [
			{
				type: 'textinput',
				label: `Segment: 0,1,..,${this.getVariableValue('maxsegments')}`,
				id: 'numofseg',
				default: '0,1,2',
				disableAutoExpression: true,
			},
			{
				type: 'textinput',
				label: 'Brightness',
				id: 'segbrightness',
				default: '100',
				useVariables: true,
				tooltip: '0-100, variables allowed'
			}
		],
		callback: async (action) => {
			const raw = action.options.segbrightness
			const brightness = Number(String(raw).trim())

			if (!Number.isFinite(brightness)) {
				this.log('warn', `Invalid brightness: ${raw}`)
				return
			}
			let segArray = action.options.numofseg.split(',').map(Number);
			if (!this.INFO.segments || Object.keys(this.INFO.segments).length < 1) {
				this.log('error', 'This device does not support segments.');
				return;
			}
			if (segArray.length > Object.keys(this.INFO.segments).length) {
				this.log('error', 'This device does not support that many segments.');
				return;
			}
			try {
				// Ensure this.INFO.segments exists
				if (!this.INFO.segments) {
					this.log('error', 'this.INFO.segments is undefined!');
					return;
				}
				// Convert segment keys to match input format (e.g., "segment 1" -> 1)
				let segmentKeys = Object.keys(this.INFO.segments).map(key => parseInt(key.replace('segment ', '')));
				this.GOVEE.setSegmentBrightness(brightness, segArray).then((data) => {
					if (this.GOVEE.sku === 'H60A1' && segArray.length > 13) {
						updateApiCalls('segmentbrightnessh60a1main');
						updateApiCalls('segmentbrightnessh60a1ring');
					} else {
						updateApiCalls('segmentbrightness');
					}
					this.INFO.power = 'on';
					this.INFO.snapshot = '';
					this.checkVariables();
					this.checkAllFeedbacks();
					for (let segId of segArray) {
						if (segmentKeys.includes(segId)) {
							this.INFO.segments[`segment ${segId}`].brightness = brightness;
						} else {
							this.log('warn', `Segment ${segId} not found in this.INFO.segments`);
						}
					}
				}).catch((error) => {
					processHTTPError.call(this, error);
				});
				if (this.config.verbose) {
					this.log('debug', `Setting brightness of segments ${JSON.stringify(segArray)} to ${brightness}%`);
				}
			} catch (error) {this.log('error', `Failed to update segments: ${error.message}`);}
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
		callback: async (action) => {
			if (!this.INFO.segments || Object.keys(this.INFO.segments).length < 1) {
				this.log('error', 'This device does not support segments.');
				return;
			}
			try {
				let set = action.options.gradienttoggle === 'on' ? true : false
				if (action.options.gradienttoggle === 'toggle') {
					set = this.INFO.gradienttoggle === false ? true : false
				}
				this.GOVEE.setGradientToggle(set).then((data) => {
					updateApiCalls('gradienttoggle');
					this.INFO.gradienttoggle = set;
					this.checkAllFeedbacks()
					this.checkVariables()
				}).catch((error) => {
					processHTTPError.call(this, error);
				});
				if (this.config.verbose) {
					this.log('debug', 'Setting gradient toggle to ' + set);
				}
			} catch (error) {this.log('error', 'Failed to update set gradient toggle');}
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
				],
				disableAutoExpression: true
			},
			{
				type: 'colorpicker',
				id: 'colorrgb',
				label: 'Pick a Color',
				default: combineRgb(255, 255, 255),
				isVisibleExpression: '$(options:colortype) == "rgb"', // Only show if RGB is selected
				disableAutoExpression: true
			},
			{
				type: 'number',
					id: 'colorkelvin',
					label: `Kelvin Temperature (${this.getVariableValue('minkelvin')} - ${this.getVariableValue('maxkelvin')})`,
					default: 3000,
					min: parseInt(this.getVariableValue('minkelvin')) || 2000, // Fallback if undefined
					max: parseInt(this.getVariableValue('maxkelvin')) || 6500, // Fallback if undefined
					isVisibleExpression: '$(options:colortype) == "kelvin"' // Only show if Kelvin is selected
				},
		],
		callback: async (action) => {
			if (action.options.colortype === 'rgb') {
				let color = splitRgb(action.options.colorrgb);
				try {
					let hex = colorsys.rgbToHex(color.r, color.g, color.b);
					this.GOVEE.setColor(hex).then((data) => {
						updateApiCalls('setcolorrgb');
						this.INFO.power = 'on';
						this.INFO.color = '(R:' + color.r + ', G:' + color.g + ', B:' + color.b + ')';
						this.INFO.snapshot = '';
						this.INFO.dynamicscene = '';
						this.INFO.diyscene = '';
						this.checkVariables();
						this.checkAllFeedbacks();
					}).catch((error) => {
						processHTTPError.call(this, error);
					});
					for (let key in this.INFO.segments) {
						this.INFO.segments[key].color = ''; // remove each segment's color
				}
				}
				catch(error) {
					//probably error converting to hex
					this.log('error', 'Error changing color: ' + error.toString());
				}
				if (this.config.verbose) {
					this.log('debug', 'Setting color to (R:' + color.r + ', G:' + color.g + ', B:' + color.b + ')');
				}
			} 
			else if (action.options.colortype === 'kelvin') {
				let kelvin = action.options.colorkelvin;
				if (!Number.isInteger(kelvin)) {this.log('error', 'Kelvin temperature not a number'); return;}
				if (kelvin < this.INFO.minkelvin || kelvin > this.INFO.maxkelvin) {this.log('error', 'Kelvin temperature not between '+this.INFO.minkelvin+'-'+this.INFO.maxkelvin); return;}
				try {
					this.GOVEE.setColorTemperature(kelvin).then((data) => {
						updateApiCalls('colortemperature');
						this.INFO.power = 'on';
						this.INFO.color = kelvin + "K";
						this.INFO.snapshot = '';
						this.INFO.dynamicscene = '';
						this.INFO.diyscene = '';
						this.checkVariables();
						this.checkAllFeedbacks();
					}).catch((error) => {
						processHTTPError.call(this, error);
					});
				}
				catch(error) {
					//probably something
					this.log('error', 'Error changing color: ' + error.toString());
				}
				if (this.config.verbose) {
					this.log('debug', 'Setting color temp to ' + kelvin + 'K');
				}
			}
		}
	}

	actions.segmentColor = {
		name: 'Change Segment Color',
		options: [
			{
				type: 'textinput',
				label: `Segment: 0,1,..,${this.GOVEE.sku === 'H60A1' ? this.getVariableValue('maxsegments')-1 : this.getVariableValue('maxsegments')}`,
				id: 'numofseg',
				default: '0,1,2',
				disableAutoExpression: true,
			},
			{
				type: 'colorpicker',
				id: 'segcolorrgb',
				label: 'Pick a Color',
				default: combineRgb(255, 255, 255),
				disableAutoExpression: true,
			},
		],
		callback: async (action) => {
			let segArray = action.options.numofseg.split(',').map(Number);
			if (!this.INFO.segments || Object.keys(this.INFO.segments).length < 1) {
				this.log('error', 'This device does not support segments.');
				return;
			}
			for (let segId of segArray) {
				if (segId === 13) {
					this.log('error', 'This device doesnt support changing the main light segment color. Try setting the device color then the other segments separately');
					return;
				} else if (segId > this.INFO.maxsegments){
					this.log('error', 'This device doesnt support that many segments: ' + segId);
					return;
				}
			}
			try {
				// Ensure this.INFO.segments exists and is an object
				if (!this.INFO.segments) {
					this.log('error', 'this.INFO.segments is undefined!');
					return;
				}
				// Convert segment keys to match input format (e.g., "segment 1" -> 1)
				let segmentKeys = Object.keys(this.INFO.segments).map(key => parseInt(key.replace('segment ', '')));
				let color = splitRgb(action.options.segcolorrgb);
				try {
					let hex = colorsys.rgbToHex(color.r, color.g, color.b);
					this.GOVEE.setSegmentColor(hex, segArray).then((data) => {
						updateApiCalls('segmentcolor');
						for (let segId of segArray) {
							if (segmentKeys.includes(segId)) {
								this.INFO.segments[`segment ${segId}`].color = '(R:' + color.r + ', G:' + color.g + ', B:' + color.b + ')';
							} else {
								this.log('warn', `Segment ${segId} not found in this.INFO.segments`);
							}
						}
						this.INFO.power = 'on';
						this.INFO.snapshot = '';
						this.checkVariables();
						this.checkAllFeedbacks();
					}).catch((error) => {
						processHTTPError.call(this, error);
					});
				}
				catch(error) {
					//probably error converting to hex
					this.log('error', 'Error changing color: ' + error.toString());
				}
				if (this.config.verbose) {
					this.log('debug', `Setting color of segments ${JSON.stringify(segArray)} to (R:` + color.r + ', G:' + color.g + ', B:' + color.b + ')');
				}
			} catch (error) {this.log('error', `Failed to update segments: ${error.message}`);}
		}
	}

	actions.snapshot = {
		name: 'Snapshot',
		options: [{
			type: 'dropdown',
			label: 'Snapshot',
			id: 'snapshot',
			default: 'select',
			choices: this.SNAPSHOTS
		}],
		callback: async (action) => {
			if (action.options.snapshot !== 'select') {
				// Find the matching snapshot object
				let selectedSnapshot = this.SNAPSHOTS.find(snap => snap.id == action.options.snapshot);
				if (selectedSnapshot) {
					// this.log('debug', `Snapshot Selected: ${selectedSnapshot.label} (ID: ${selectedSnapshot.id})`);
					this.GOVEE.setSnapshot(action.options.snapshot).then((data) => {
						updateApiCalls('setsnapshot');
						this.INFO.power = 'on';
						this.INFO.color = '';
						this.INFO.snapshot = selectedSnapshot.label;
						this.INFO.dynamicscene = '';
						this.INFO.diyscene = '';
						this.checkVariables();
						this.checkAllFeedbacks();
							this.log('debug', 'Setting snapshot to \'' + selectedSnapshot.label + '\'')
					}).catch((error) => {processHTTPError.call(this, error);});
				} else {
					this.log('error', `Snapshot with ID ${action.options.snapshot} not found`);
				}
			} else {
				this.log('warn', 'Please select an available snapshot');
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
			choices: this.DIY_SCENES
		}],
		callback: async (action) => {
			if (action.options.diyscene !== 'select') {
				// Find the matching diyscene object
				let selectedDIYScene = this.DIY_SCENES.find(diy => diy.id == action.options.diyscene);
				if (selectedDIYScene) {
					this.log('debug', `DIY Scene Selected: ${selectedDIYScene.label} (ID: ${selectedDIYScene.id})`);
					this.GOVEE.setDIYScene(selectedDIYScene.id);
					updateApiCalls('setdiyscene');
					this.INFO.power = 'on';
					this.INFO.color = '';
					this.INFO.snapshot = '';
					this.INFO.dynamicscene = '';
					this.INFO.diyscene = selectedDIYScene.label;
					this.checkVariables();
					this.checkAllFeedbacks();
				} else {
					this.log('error', `DIY Scene with ID ${action.options.diyscene} not found`);
				}
			} else {
				this.log('warn', 'Please select an available DIY Scene');
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
			choices: this.DYNAMIC_SCENES
		}],
		callback: async (action) => {
			if (action.options.dynamicscene !== 'select') {
				// Find the matching dynamicscene object
				let selectedDynamicScene = this.DYNAMIC_SCENES.find(dyn => dyn.id == action.options.dynamicscene);
				if (selectedDynamicScene) {
					this.log('debug', `Dynamic Scene Selected: ${selectedDynamicScene.label} (ID: ${selectedDynamicScene.id})`);
					this.GOVEE.setDynamicScene(action.options.dynamicscene);
					updateApiCalls('setdynamicscene');
					this.INFO.power = 'on';
					this.INFO.color = '';
					this.INFO.snapshot = '';
					this.INFO.dynamicscene = selectedDynamicScene.label;
					this.INFO.diyscene = '';
					this.checkVariables();
					this.checkAllFeedbacks();
				} else {
					this.log('error', `Dynamic Scene with ID ${action.options.dynamicscene} not found`);
				}
			} else {
				this.log('warn', 'Please select an available Dynamic Scene');
			}
		}
	}

	actions.refreshDevice = {
		name: 'Refresh Device',
		callback: async (action) => {
			if (this.GOVEE_DEVICES.length > 2) {
				if (this.goveeDevice) {
					this.log('debug', 'Refreshing Device');
					await this.GOVEE.getInformation();
				} else {
					this.log('error', 'Can\'t refresh device. Device not found');
				}
			} else {
				this.log('error', 'Can\'t refresh device. Make sure a device is selected');
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
			}
		],
		callback: async (action) => {
			// Ensure this.INFO is initialized
			if (!this.INFO) {
				this.log('error', 'INFO is not initialized yet!');
				return;
			}
			if (action.options.debugINFO !== '') {
				// Check if the key exists in this.INFO
				if (this.hasOwnProperty(action.options.debugINFO)) {
					this.log('debug', `INFO (${action.options.debugINFO}): ` + JSON.stringify(this[action.options.debugINFO], null, 2));
				} else {
					this.log('warn', `INFO: Key '${action.options.debugINFO}' not found`);
				}
			} else {
				// Log the entire this.INFO object
				this.log('debug', 'INFO: ' + JSON.stringify(this.INFO, null, 2));
			}
		}
	};

	this.setActionDefinitions(actions);
}