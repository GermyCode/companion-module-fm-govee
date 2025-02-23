const { combineRgb, splitRgb } = require('@companion-module/base');

const colorsys = require('colorsys');
const GoveeLED = require('./goveeAPI');

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
				if (action.options.power === 'on') {
					self.GOVEE.turnOn().then((data) => {
						self.updateApiCalls('power');
						self.INFO.power = 'on';
						self.checkVariables();
						self.checkFeedbacks();
					}).catch((error) => {
						self.processError(error);
					});
					if (self.config.verbose) {
						self.log('info', 'Setting power to on');
					}
				}
				else if (action.options.power === 'off') {
					self.GOVEE.turnOff().then((data) => {
						self.updateApiCalls('power');
						self.INFO.power = 'off';
						self.checkVariables();
						self.checkFeedbacks();
					}).catch((error) => {
						self.processError(error);
					});
					if (self.config.verbose) {
						self.log('info', 'Setting power to off');
					}
				}
				else if (action.options.power === 'toggle') {
					if (self.INFO.power === 'on') {
						self.GOVEE.turnOff().then((data) => {
							self.updateApiCalls('power');
							self.INFO.power = 'off';
							self.checkVariables();
							self.checkFeedbacks();
						}).catch((error) => {
							self.processError(error);
						});
						if (self.config.verbose) {
							self.log('info', 'Setting power to off');
						}
					}
					else {
						if (self.config.verbose) {
						}
						self.GOVEE.turnOn().then((data) => {
							self.updateApiCalls('power');
							self.INFO.power = 'on';
							self.checkVariables();
							self.checkFeedbacks();
						}).catch((error) => {
							self.processError(error);
						});
						if (self.config.verbose) {
							self.log('info', 'Setting power to on');
						}
					}
				}
			}
		};

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
				self.GOVEE.setBrightness(action.options.brightness).then((data) => {
					self.INFO.power = 'on';
					self.INFO.brightness = action.options.brightness;
					self.checkVariables();
					self.checkFeedbacks();
				}).catch((error) => {
					self.processError(error);
				});
				if (self.config.verbose) {
					self.log('info', 'Setting brightness to ' + action.options.brightness.toString() + '%');
				}
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
              self.INFO.power = 'on';
              self.INFO.color = '(R:' + color.r + ', G:' + color.g + ', B:' + color.b + ')';
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
            self.log('info', 'Setting color to (R:' + color.r + ', G:' + color.g + ', B:' + color.b + ')');
          }
        } 
        else if (option.colortype === 'kelvin') {
          let kelvin = action.options.colorkelvin;
          try {
            self.GOVEE.setColorTemperature(kelvin, self.INFO).then((data) => {
              self.INFO.power = 'on';
              self.INFO.color = kelvin + "K";
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
            self.log('info', 'Setting color temp to ' + kelvin + 'K');
          }
        }
      }
    }

    actions.segmentBrightness = {
      name: 'Change Segment Brightness',
      options: [
        {
					type: 'textinput',
					label: `Segment: max 0,1,..,${self.getVariableValue('maxsegments')}`,
					id: 'numofseg',
					default: '1',
					required: true,
          isVisible: () => self.INFO.segments && Object.keys(self.INFO.segments).length > 0
				},
        {
					type: 'number',
					label: 'Brightness',
					id: 'segbrightness',
					default: '',
          min: 0,
          max: 100,
					required: true,
          isVisible: () => self.INFO.segments && Object.keys(self.INFO.segments).length > 0
				},
      ],
      callback: async function (action) {
        if (!self.INFO.segments || Object.keys(self.INFO.segments).length < 1) {
          self.log('error', 'This device does not support segments.');
          return;
        }
        try {
          let segArray = action.options.numofseg.split(',').map(Number);
          // Ensure self.INFO.segments exists
          if (!self.INFO.segments) {
            self.log('error', 'self.INFO.segments is undefined!');
            return;
          }
          // Convert segment keys to match input format (e.g., "segment 1" -> 1)
          let segmentKeys = Object.keys(self.INFO.segments).map(key => parseInt(key.replace('segment ', '')));
          self.GOVEE.setSegmentBrightness(action.options.segbrightness, segArray).then((data) => {
            // self.INFO.power = 'on';
            // self.checkVariables();
            // self.checkFeedbacks();
            for (let segId of segArray) {
              if (segmentKeys.includes(segId)) {
                self.INFO.segments[`segment ${segId}`].brightness = action.options.segbrightness;
              } else {
                self.log('warn', `Segment ${segId+1} not found in self.INFO.segments`);
              }
            }
          }).catch((error) => {
            self.processError(error);
          });
          if (self.config.verbose) {
            self.log('info', `Setting brightness of segments ${JSON.stringify(segArray)} to ${action.options.segbrightness}%`);
          }
        } catch (error) {self.log('error', `Failed to update segments: ${error.message}`);}
      }
    }

    actions.segmentColor = {
      name: 'Change Segment Color',
      options: [
        {
					type: 'textinput',
					label: `Segment: max 0,1,..,${self.getVariableValue('maxsegments')}`,
					id: 'numofseg',
					default: '1,2,3',
					required: true,
          isVisible: () => !!self.INFO.segments && Object.keys(self.INFO.segments).length > 0
				},
        {
          type: 'colorpicker',
          id: 'segcolorrgb',
          label: 'Pick a Color',
          default: combineRgb(255, 255, 255),
          required: true,
          isVisible: () => !!self.INFO.segments && Object.keys(self.INFO.segments).length > 0
        },
      ],
      callback: async function (action) {
        if (!self.INFO.segments || Object.keys(self.INFO.segments).length < 1) {
          self.log('error', 'This device does not support segments.');
          return;
        }
        try {
          // Ensure self.INFO.segments exists and is an object
          if (!self.INFO.segments) {
            self.log('error', 'self.INFO.segments is undefined!');
            return;
          }
          let segArray = action.options.numofseg.split(',').map(Number);
          // Convert segment keys to match input format (e.g., "segment 1" -> 1)
          let segmentKeys = Object.keys(self.INFO.segments).map(key => parseInt(key.replace('segment ', '')));
          let color = splitRgb(action.options.segcolorrgb);
          try {
            self.log('info', segArray);
            let hex = colorsys.rgbToHex(color.r, color.g, color.b);
            self.GOVEE.setSegmentColor(hex, segArray).then((data) => {
              for (let segId of segArray) {
                if (segmentKeys.includes(segId)) {
                  self.INFO.segments[`segment ${segId}`].color = '(R:' + color.r + ', G:' + color.g + ', B:' + color.b + ')';
                } else {
                  self.log('warn', `Segment ${segId} not found in self.INFO.segments`);
                }
              }
              // self.INFO.power = 'on';
              // self.checkVariables();
              // self.checkFeedbacks();
            }).catch((error) => {
              self.processError(error);
            });
          }
          catch(error) {
            //probably error converting to hex
            self.log('error', 'Error changing color: ' + error.toString());
          }
          if (self.config.verbose) {
            self.log('info', `Setting color of segments ${JSON.stringify(segArray)} to (R:` + color.r + ', G:' + color.g + ', B:' + color.b + ')');
          }
        } catch (error) {self.log('error', `Failed to update segments: ${error.message}`);}
      }
    }

    actions.getINFO = {
      name: 'Get INFO',
      options: [
        {
          type: 'textinput',
          label: 'Debug Key',
          id: 'debugINFO',
          default: '',
          required: false
        }
      ],
      callback: async function (action) {
        // Ensure self.INFO is initialized
        if (!self.INFO) {
          self.log('error', 'self.INFO is not initialized yet!');
          return;
        }
        if (action.options.debugINFO !== '') {
          // Check if the key exists in self.INFO
          if (self.INFO.hasOwnProperty(action.options.debugINFO)) {
            self.log('info', `INFO (${action.options.debugINFO}): ` + JSON.stringify(self.INFO[action.options.debugINFO], null, 2));
          } else {
            self.log('warn', `INFO: Key '${action.options.debugINFO}' not found in self.INFO`);
          }
        } else {
          // Log the entire self.INFO object
          self.log('info', 'INFO: ' + JSON.stringify(self.INFO, null, 2));
        }
      }
    };
		self.setActionDefinitions(actions);
	}
}