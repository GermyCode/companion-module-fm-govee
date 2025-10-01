const { combineRgb } = require('@companion-module/base');

module.exports = {
	initPresets: function () {
		let self = this;
		let presets = {};

		const  gradientPNG = 'iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAMAAACdt4HsAAAAAXNSR0IB2cksfwAAAAlwSFlzAAALEwAACxMBAJqcGAAAAX1QTFRFAAD+AAP7AAf3AAvzAA/vABPrABfnABvjAB/fACPbACfXACvTAC/PADPLADfHADvDAD+/AEO7AEe3AEuzAE+vAFOrAFenAFujAF+fAGObAGeXAGuTAG+PAHOLAHeHAHuDAH9/AIJ8AIZ4AIp0AI5wAJJsAJZoAJpkAJ5gAKJcAKZYAKpUAK5QALJMALZIALpEAL5AAMI8AMY4AMo0AM4wANIsANYoANokAN4gAOIcAOYYAOoUAO4QAPIMAPYIAPoEAwD7BwD3CwDzDwDvEwDrFwDnGwDjHwDfIwDbJwDXKwDTLwDPMwDLNwDHOwDDPwC/QwC7RwC3SwCzTwCvUwCrVwCnWwCjXwCfYwCbZwCXawCTbwCPcwCLdwCHewCDfwB/gwB7hwB3iwBzjwBvkwBrlwBnmwBjnwBfowBbpwBXqwBTrwBPswBLtwBHuwBDvwA/wwA7xwA3ywAzzwAv0wAr1wAn2wAj3wAf4wAb5wAX6wAT7wAP8wAL9wAH+wADn2Q8QQAAASBJREFUeJylzAVWQlEUBVD/zCwsBGwFpLHFllTH9md2WPaPF/e+swewo4WItBiTwRLIYRnksAJyWAU5FEAOayCHdZDDBshhE+SwBXIoghy2QQ4lkEMZ5FABOeyAHHazgXbYywXKYT8f6IYDQ6AaDk2BZjgyBorh2BzIhxNLIB6qtkA61KyBcKjbA9lw6ghEQ8MVSIamMxAMLXfgH9qewDt0fIFv6HoDz9DzB+6hLwicw5kkcA3nosAxXMgC+3ApDKzDlTSwDdfiwDLcyAPzcKsIjMNAE5iGO1VgGO51QX54UAa54VEbZIcndZAZnvVBengJCFLDa0iQHIZBQWIYhQX/wzgw+BsmocHvMA0OfoZZePA9vBHB1/DOBJ/DBxUgngOv5OiKJ52ngwAAAABJRU5ErkJggg=='

		// Define colors
		const white = combineRgb(255, 255, 255);
		const black = combineRgb(0, 0, 0);
		const red = combineRgb(255, 0, 0);
		const dark_red = combineRgb(128, 0, 0);
		const green = combineRgb(0, 255, 0);
		const dark_green = combineRgb(0, 128, 0);
		const blue = combineRgb(0, 0, 255);

		// ##############
		// #### Main ####
		// ##############

		presets.power_on = {
			type: 'button',
			category: 'Main',
			name: 'Turn On',
			style: {
				text: 'Turn On',
				size: '18',
				color: white,
				bgcolor: black,
			},
			steps: [
				{
					down: [
						{
							actionId: 'power',
							options: {
								power: 'on',
							},
						},
					],
					up: [],
				},
			],
			feedbacks: [
				{
					feedbackId: 'powerState',
					options: {
						option: 'on',
					},
					style: {
						bgcolor: red,
						color: white,
					},
				},
			]
		},
		presets.power_off = {
			type: 'button',
			category: 'Main',
			name: 'Turn Off',
			style: {
				text: 'Turn Off',
				size: '18',
				color: white,
				bgcolor: black,
			},
			steps: [
				{
					down: [
						{
							actionId: 'power',
							options: {
								power: 'off',
							},
						},
					],
					up: [],
				},
			],
			feedbacks: [
				{
					feedbackId: 'powerState',
					options: {
						option: 'off',
					},
					style: {
						bgcolor: red,
						color: white,
					},
				},
			]
		},
		presets.power_toggle = {
			type: 'button',
			category: 'Main',
			name: 'Toggle',
			style: {
				text: 'Toggle',
				size: '18',
				color: white,
				bgcolor: black,
			},
			steps: [
				{
					down: [
						{
							actionId: 'power',
							options: {
								power: 'toggle',
							},
						},
					],
					up: [],
				},
			],
			feedbacks: [
				{
					feedbackId: 'powerState',
					options: {
						option: 'on',
					},
					style: {
						bgcolor: red,
						color: white,
					},
				},
			]
		},

		presets.brightness_100 = {
			type: 'button',
			category: 'Main',
			name: 'Brightness_100',
			style: {
				text: 'Set to 100',
				size: '20',
				color: white,
				bgcolor: black,
			},
			steps: [
				{
					down: [
						{
							actionId: 'changeBrightness',
							options: {
								brightness: 100,
							},
						},
					],
					up: [],
				},
			],
			feedbacks: []
		},
		presets.brightness_50 = {
			type: 'button',
			category: 'Main',
			name: 'Brightness_50',
			style: {
				text: 'Set to 50',
				size: '20',
				color: white,
				bgcolor: black,
			},
			steps: [
				{
					down: [
						{
							actionId: 'changeBrightness',
							options: {
								brightness: 50,
							},
						},
					],
					up: [],
				},
			],
			feedbacks: []
		},
		presets.brightness_20 = {
			type: 'button',
			category: 'Main',
			name: 'Brightness_20',
			style: {
				text: 'Set to 20',
				size: '20',
				color: white,
				bgcolor: black,
			},
			steps: [
				{
					down: [
						{
							actionId: 'changeBrightness',
							options: {
								brightness: 20,
							},
						},
					],
					up: [],
				},
			],
			feedbacks: []
		},
		presets.brightness_0 = {
			type: 'button',
			category: 'Main',
			name: 'Brightness_0',
			style: {
				text: 'Set to 0',
				size: '20',
				color: white,
				bgcolor: black,
			},
			steps: [
				{
					down: [
						{
							actionId: 'changeBrightness',
							options: {
								brightness: 0,
							},
						},
					],
					up: [],
				},
			],
			feedbacks: []
		},

		presets.snapshot = {
			type: 'button',
			category: 'Main',
			name: 'snapshot',
			style: {
				text: 'Set Snapshot',
				size: '16',
				color: white,
				bgcolor: black,
			},
			steps: [
				{
					down: [
						{
							actionId: 'snapshot',
							options: {
								snapshot: 'select',
							},
						},
					],
					up: [],
				},
			],
			feedbacks: []
		},
		presets.dynamic_scene = {
			type: 'button',
			category: 'Main',
			name: 'dynamicScene',
			style: {
				text: 'Dynamic Scene',
				size: '16',
				color: white,
				bgcolor: black,
			},
			steps: [
				{
					down: [
						{
							actionId: 'dynamicScene',
							options: {
								dynamicscene: 'select',
							},
						},
					],
					up: [],
				},
			],
			feedbacks: []
		},
		presets.diy_scene = {
			type: 'button',
			category: 'Main',
			name: 'diyScene',
			style: {
				text: 'DIY Scene',
				size: '20',
				color: white,
				bgcolor: black,
			},
			steps: [
				{
					down: [
						{
							actionId: 'DIYScene',
							options: {
								diyscene: 'select',
							},
						},
					],
					up: [],
				},
			],
			feedbacks: []
		},

		presets.gradient_on = {
			type: 'button',
			category: 'Main',
			name: 'gradientOn',
			style: {
				text: 'Gradient On',
				size: '16',
				color: white,
				bgcolor: black,
			},
			steps: [
				{
					down: [
						{
							actionId: 'gradientToggle',
							options: {
								gradienttoggle: 'on',
							},
						},
					],
					up: [],
				},
			],
			feedbacks: [
				{
					feedbackId: 'gradientState',
					options: {
						option: 'on',
					},
					style: {
						bgcolor: black,
						color: white,
						png64: gradientPNG,
					},
				},
			]
		},
		presets.gradient_off = {
			type: 'button',
			category: 'Main',
			name: 'gradientOff',
			style: {
				text: 'Gradient Off',
				size: '16',
				color: white,
				bgcolor: black,
			},
			steps: [
				{
					down: [
						{
							actionId: 'gradientToggle',
							options: {
								gradienttoggle: 'off',
							},
						},
					],
					up: [],
				},
			],
			feedbacks: [
				{
					feedbackId: 'gradientState',
					options: {
						option: 'off',
					},
					style: {
						bgcolor: black,
						color: white,
						png64: gradientPNG,
					},
				},
			]
		},
		presets.gradient_toggle = {
			type: 'button',
			category: 'Main',
			name: 'gradientToggle',
			style: {
				text: 'Gradient Toggle',
				size: '16',
				color: white,
				bgcolor: black,
			},
			steps: [
				{
					down: [
						{
							actionId: 'gradientToggle',
							options: {
								gradienttoggle: 'toggle',
							},
						},
					],
					up: [],
				},
			],
			feedbacks: [
				{
					feedbackId: 'gradientState',
					options: {
						option: 'on',
					},
					style: {
						bgcolor: black,
						color: white,
						png64: gradientPNG,
					},
				},
			]
		},

		presets.color_red = {
			type: 'button',
			category: 'Main',
			name: 'colorRed',
			style: {
				text: '',
				size: '',
				color: white,
				bgcolor: red,
			},
			steps: [
				{
					down: [
						{
							actionId: 'changeColor',
							options: {
								colortype: 'rgb',
								colorrgb: red
							},
						},
					],
					up: [],
				},
			],
			feedbacks: []
		},
		presets.color_green = {
			type: 'button',
			category: 'Main',
			name: 'colorGreen',
			style: {
				text: '',
				size: '',
				color: white,
				bgcolor: green,
			},
			steps: [
				{
					down: [
						{
							actionId: 'changeColor',
							options: {
								colortype: 'rgb',
								colorrgb: green
							},
						},
					],
					up: [],
				},
			],
			feedbacks: []
		},
		presets.color_blue = {
			type: 'button',
			category: 'Main',
			name: 'colorBlue',
			style: {
				text: '',
				size: '',
				color: white,
				bgcolor: blue,
			},
			steps: [
				{
					down: [
						{
							actionId: 'changeColor',
							options: {
								colortype: 'rgb',
								colorrgb: blue
							},
						},
					],
					up: [],
				},
			],
			feedbacks: []
		},
		presets.color_white = {
			type: 'button',
			category: 'Main',
			name: 'colorWhite',
			style: {
				text: '',
				size: '',
				color: white,
				bgcolor: white,
			},
			steps: [
				{
					down: [
						{
							actionId: 'changeColor',
							options: {
								colortype: 'rgb',
								colorrgb: white
							},
						},
					],
					up: [],
				},
			],
			feedbacks: []
		},

		presets.color_2000K = {
			type: 'button',
			category: 'Main',
			name: 'color2000K',
			style: {
				text: '2000',
				size: '20',
				color: black,
				bgcolor: combineRgb(255, 137, 27),
			},
			steps: [
				{
					down: [
						{
							actionId: 'changeColor',
							options: {
								colortype: 'kelvin',
								colorkelvin: 2000
							},
						},
					],
					up: [],
				},
			],
			feedbacks: []
		},
		presets.color_3700K = {
			type: 'button',
			category: 'Main',
			name: 'color3700K',
			style: {
				text: '3700',
				size: '20',
				color: black,
				bgcolor: combineRgb(255, 201, 148),
			},
			steps: [
				{
					down: [
						{
							actionId: 'changeColor',
							options: {
								colortype: 'kelvin',
								colorkelvin: 3700
							},
						},
					],
					up: [],
				},
			],
			feedbacks: []
		},
		presets.color_5500K = {
			type: 'button',
			category: 'Main',
			name: 'color5500K',
			style: {
				text: '5500',
				size: '20',
				color: black,
				bgcolor: combineRgb(255, 236, 224),
			},
			steps: [
				{
					down: [
						{
							actionId: 'changeColor',
							options: {
								colortype: 'kelvin',
								colorkelvin: 5500
							},
						},
					],
					up: [],
				},
			],
			feedbacks: []
		},
		presets.color_7200K = {
			type: 'button',
			category: 'Main',
			name: 'color7200K',
			style: {
				text: '7200',
				size: '20',
				color: black,
				bgcolor: combineRgb(240, 241, 255),
			},
			steps: [
				{
					down: [
						{
							actionId: 'changeColor',
							options: {
								colortype: 'kelvin',
								colorkelvin: 7200
							},
						},
					],
					up: [],
				},
			],
			feedbacks: []
		},
		presets.color_9000K = {
			type: 'button',
			category: 'Main',
			name: 'color9000K',
			style: {
				text: '9000',
				size: '20',
				color: black,
				bgcolor: combineRgb(214, 225, 255),
			},
			steps: [
				{
					down: [
						{
							actionId: 'changeColor',
							options: {
								colortype: 'kelvin',
								colorkelvin: 9000
							},
						},
					],
					up: [],
				},
			],
			feedbacks: []
		},

		presets.segment_brightness = {
			type: 'button',
			category: 'Main',
			name: 'segmentBrightness',
			style: {
				text: 'Segment\\n[0,1,2]\\nto 100',
				size: '16',
				color: white,
				bgcolor: black,
			},
			steps: [
				{
					down: [
						{
							actionId: 'segmentBrightness',
							options: {
								numofseg: '0,1,2',
								segbrightness: 100
							},
						},
					],
					up: [],
				},
			],
			feedbacks: []
		},
		presets.segment_color_red = {
			type: 'button',
			category: 'Main',
			name: 'segmentColorRed',
			style: {
				text: 'Segment\\n[0,1,2]\\nto red',
				size: '16',
				color: white,
				bgcolor: dark_red,
			},
			steps: [
				{
					down: [
						{
							actionId: 'segmentColor',
							options: {
								numofseg: '0,1,2',
								segcolorrgb: red
							},
						},
					],
					up: [],
				},
			],
			feedbacks: []
		},
		presets.segment_color_green = {
			type: 'button',
			category: 'Main',
			name: 'segmentColorGreen',
			style: {
				text: 'Segment\\n[3,4,5]\\nto green',
				size: '16',
				color: white,
				bgcolor: dark_green,
			},
			steps: [
				{
					down: [
						{
							actionId: 'segmentColor',
							options: {
								numofseg: '3,4,5',
								segcolorrgb: green
							},
						},
					],
					up: [],
				},
			],
			feedbacks: []
		},

		// ###############
		// #### Other ####
		// ###############

		presets.refreshDevice = {
			type: 'button',
			category: 'Other',
			name: 'refreshDevice',
			style: {
				text: 'Refresh Device',
				size: '18',
				color: white,
				bgcolor: black,
			},
			steps: [
				{
					down: [
						{
							actionId: 'refreshDevice',
							options: {},
						},
					],
					up: [],
				},
			],
			feedbacks: []
		},


		self.setPresetDefinitions(presets);
	}
};