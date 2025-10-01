const { combineRgb } = require('@companion-module/base');

module.exports = {
	initFeedbacks: function () {
		let self = this;
		let feedbacks = {};

		const foregroundColor = combineRgb(255, 255, 255) // White
		const backgroundColorRed = combineRgb(255, 0, 0) // Red

		const  gradientPNG = 'iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAMAAACdt4HsAAAAAXNSR0IB2cksfwAAAAlwSFlzAAALEwAACxMBAJqcGAAAAX1QTFRFAAD+AAP7AAf3AAvzAA/vABPrABfnABvjAB/fACPbACfXACvTAC/PADPLADfHADvDAD+/AEO7AEe3AEuzAE+vAFOrAFenAFujAF+fAGObAGeXAGuTAG+PAHOLAHeHAHuDAH9/AIJ8AIZ4AIp0AI5wAJJsAJZoAJpkAJ5gAKJcAKZYAKpUAK5QALJMALZIALpEAL5AAMI8AMY4AMo0AM4wANIsANYoANokAN4gAOIcAOYYAOoUAO4QAPIMAPYIAPoEAwD7BwD3CwDzDwDvEwDrFwDnGwDjHwDfIwDbJwDXKwDTLwDPMwDLNwDHOwDDPwC/QwC7RwC3SwCzTwCvUwCrVwCnWwCjXwCfYwCbZwCXawCTbwCPcwCLdwCHewCDfwB/gwB7hwB3iwBzjwBvkwBrlwBnmwBjnwBfowBbpwBXqwBTrwBPswBLtwBHuwBDvwA/wwA7xwA3ywAzzwAv0wAr1wAn2wAj3wAf4wAb5wAX6wAT7wAP8wAL9wAH+wADn2Q8QQAAASBJREFUeJylzAVWQlEUBVD/zCwsBGwFpLHFllTH9md2WPaPF/e+swewo4WItBiTwRLIYRnksAJyWAU5FEAOayCHdZDDBshhE+SwBXIoghy2QQ4lkEMZ5FABOeyAHHazgXbYywXKYT8f6IYDQ6AaDk2BZjgyBorh2BzIhxNLIB6qtkA61KyBcKjbA9lw6ghEQ8MVSIamMxAMLXfgH9qewDt0fIFv6HoDz9DzB+6hLwicw5kkcA3nosAxXMgC+3ApDKzDlTSwDdfiwDLcyAPzcKsIjMNAE5iGO1VgGO51QX54UAa54VEbZIcndZAZnvVBengJCFLDa0iQHIZBQWIYhQX/wzgw+BsmocHvMA0OfoZZePA9vBHB1/DOBJ/DBxUgngOv5OiKJ52ngwAAAABJRU5ErkJggg=='

		feedbacks.powerState = {
			type: 'boolean',
			name: 'Last Power State',
			description: 'Indicate if Device is On or Off based on last known power state',
			defaultStyle: {
				color: foregroundColor,
				bgcolor: backgroundColorRed,
			},
			options: [
				{
					type: 'dropdown',
					label: 'Indicate in X State',
					id: 'option',
					default: 'on',
					choices: [
						{ id: 'off', label: 'Off' },
						{ id: 'on', label: 'On' },
					],
				},
			],
			callback: function (feedback) {
				if (self.INFO && self.INFO.power) {
					if (self.INFO.power === feedback.options.option) {
						return true;
					}
				}
				return false
			}
		},
		feedbacks.gradientState = {
			type: 'boolean',
			name: 'Gradient State',
			description: 'Indicate if the Gradient Toggle is On or Off',
			defaultStyle: {
				color: foregroundColor,
				bgcolor: backgroundColorRed,
				png64: gradientPNG,
			},
			options: [
				{
					type: 'dropdown',
					label: 'Indicate in X State',
					id: 'option',
					default: 'on',
					choices: [
						{ id: 'off', label: 'Off' },
						{ id: 'on', label: 'On' },
					],
				},
			],
			callback: function (feedback) {
				let opt = feedback.options.option === 'on' ? true : false
				if (self.INFO && self.INFO.gradienttoggle) {
					if (self.INFO.gradienttoggle === opt) {
						return true;
					}
				}
				return false
			}
		},
		// feedbacks.currentColor = {
		// 	type: 'boolean',
		// 	name: 'Last Power State',
		// 	description: 'Indicate if Device is On or Off based on last known power state',
		// 	defaultStyle: {
		// 		color: foregroundColor,
		// 		bgcolor: backgroundColorRed,
		// 	},
		// 	options: [
		// 		{
		// 			type: 'dropdown',
		// 			label: 'Indicate in X State',
		// 			id: 'option',
		// 			default: 'on',
		// 			choices: [
		// 				{ id: 'off', label: 'Off' },
		// 				{ id: 'on', label: 'On' },
		// 			],
		// 		},
		// 	],
		// 	callback: function (feedback) {
		// 		if (self.INFO && self.INFO.power) {
		// 			if (self.INFO.power === feedback.options.option) {
		// 				return true;
		// 			}
		// 		}
		// 		return false
		// 	}
		// }

		self.setFeedbackDefinitions(feedbacks);
	}
}
