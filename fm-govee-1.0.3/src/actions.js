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
          label: 'Kelvin Temperature (2200-6500)',
          default: 4000,
          min: 2200,
          max: 6500,
          required: true,
          isVisible: (options) => options.colortype === 'kelvin' // Only show if Kelvin is selected
        }
      ],
      callback: async function (action) {
        let option = action.options;
        if (option.colortype === 'rgb') {
          let color = splitRgb(action.options.colorrgb);
          try {
            let hex = colorsys.rgbToHex(color.r, color.g, color.b);
            self.GOVEE.setColor(hex).then((data) => {
              self.INFO.power = 'on';
              self.INFO.color = '(' + color.r + ', ' + color.g + ', ' + color.b + ')';
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
            self.log('info', 'Setting color to (' + color.r + ', ' + color.g + ', ' + color.b + ')');
          }
        } 
        else if (option.colortype === 'kelvin') {
          let kelvin = action.options.colorkelvin;
          try {
            self.GOVEE.setColorTemperature(kelvin).then((data) => {
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
/*
    actions.segments = {
      name: 'Change Segment',
      options: [
        {
					type: 'number',
					label: 'Number of segments',
					id: 'numofseg',
					default: 0,
          min: 0,
					required: true,
				},
        {
					type: 'number',
					label: 'Brightness(empty->don\'t change)',
					id: 'segbrightness',
					default: '',
          min: 0,
          max: 100,
					required: false,
				},
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
          label: 'Kelvin Temperature\n(2200-6500)',
          default: 4000,
          min: 2200,
          max: 6500,
          step: 100,
          required: true,
          isVisible: (options) => options.colortype === 'kelvin' // Only show if Kelvin is selected
        }
      ],
      callback: async function (action) {
        let option = action.options;
        if (option.colortype === 'rgb') {
          let color = splitRgb(action.options.colorrgb);
          try {
            let hex = colorsys.rgbToHex(color.r, color.g, color.b);
            self.GOVEE.setColor(hex).then((data) => {
              self.INFO.power = 'on';
              self.INFO.color = '(' + color.r + ', ' + color.g + ', ' + color.b + ')';
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
            self.log('info', 'Setting color to (' + color.r + ', ' + color.g + ', ' + color.b + ')');
          }
        } 
        else if (option.colortype === 'kelvin') {
          let kelvin = action.options.colorkelvin;
          try {
            self.GOVEE.setColorTemperature(kelvin).then((data) => {
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
*/



    




		/*actions.changeBrightnessAndColor = {
			name: 'Change Brightness and Color',
			options: [
				{
					type: 'number',
					label: 'Brightness',
					description: 'Enter a value between 1 - 100',
					id: 'brightness',
					default: 100,
					min: 1,
					max: 100,
					required: true,
					range: false,
				},
				{
					type: 'colorpicker',
					label: 'Color',
					id: 'color',
					default: combineRgb(255, 255, 255),
					required: true,
				}
			],
			callback: async function (action) {
				let brightness = action.options.brightness;
				if (self.INFO.brightness !== brightness) {
					if (self.config.verbose) {
						self.log('info', 'Setting brightness to ' + brightness);
					}
					self.GOVEE.setBrightness(action.options.brightness).then((data) => {
						self.updateApiCalls('brightness');
						self.INFO.power = 'on';
						self.INFO.brightness = action.options.brightness;
						self.checkVariables();
						self.checkFeedbacks();
					}).catch((error) => {
						self.processError(error);
					});
				}

				let color = splitRgb(action.options.color);
				try {
					let hex = colorsys.rgbToHex(color.r, color.g, color.b);
					if (self.INFO.color !== hex) {
						if (self.config.verbose) {
							self.log('info', 'Setting color to ' + hex);
						}
						self.GOVEE.setColor(hex).then((data) => {
							self.updateApiCalls('color');
							self.INFO.power = 'on';
							self.INFO.color = hex;
							self.checkVariables();
							self.checkFeedbacks();
						}).catch((error) => {
							self.processError(error);
						});
					}
				}
				catch(error) {
					//probably error converting to hex
					self.log('error', 'Error changing color: ' + error.toString());
				}
			}
		}*/

		self.setActionDefinitions(actions);
	}
}