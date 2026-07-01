import { InstanceBase, InstanceStatus } from '@companion-module/base';

import getConfigFields from './src/config.js';
import initActions from './src/actions.js';
import { initFeedbacks, checkAllFeedbacks } from './src/feedbacks.js';
import { initVariables, checkVariables } from './src/variables.js';
import initPresets from './src/presets.js';

import initConnection from './src/main.js';

export default class goveeInstance extends InstanceBase {
	constructor(internal) {
		super(internal);

		// Assign the methods from the listed files to this class
		Object.assign(this, {
			getConfigFields,
			initActions,
			checkAllFeedbacks,
			initFeedbacks,
			initVariables,
			checkVariables,
			initPresets,
			initConnection,
		});

		this.INTERVAL = null; //used to poll the device

		this.API_INTERVAL = null; //used to track how many API calls have been made in the last minute

		this.GOVEE = null;

		this.GOVEE_DEVICES = [
			{ id: 'select', label: 'No Devices Detected. Enter your API key, click "Save", wait a moment, and then return to this config to choose a device.' },
		];

		this.SNAPSHOTS = [
			{ id: 'select', label: '(Select a Snapshot)' }
		];

		this.DYNAMIC_SCENES = [
			{ id: 'select', label: '(Select a Scene)' }
		];

		this.DIY_SCENES = [
			{ id: 'select', label: '(Select a Scene)' }
		];

		this.INFO = {
			online: false,
			power: 'off',
			brightness: '',
			color: '',
			minkelvin: '',
			maxkelvin: '',
			maxsegments: '',
			segments: {},
			gradienttoggle: false,
			snapshot: '',
			dynamicscene: '',
			diyscene: '',
			api_calls_remaining: 400
		};

		this.API_CALLS = []; //used to store the last few API calls
	}

	async destroy() {
		if (this.INTERVAL) {
			clearInterval(this.INTERVAL);
			this.INTERVAL = null;
		}

		if (this.API_INTERVAL) {
			clearInterval(this.API_INTERVAL);
			this.API_INTERVAL = null;
		}
	}

	async init(config) {
		this.configUpdated(config)
	}

	async configUpdated(config) {
		this.config = config

		this.config.intervalAmmount = config.intervalAmmount < 500 ? 500 : config.intervalAmmount || 60000 // clamp interval input to 500->60000ms

		this.SNAPSHOTS = [
			{ id: 'select', label: '(Select a Snapshot)' }
		];

		this.DYNAMIC_SCENES = [
			{ id: 'select', label: '(Select a Scene)' }
		];

		this.DIY_SCENES = [
			{ id: 'select', label: '(Select a Scene)' }
		];

		if (this.config.verbose) {
			this.log('info', 'Verbose mode enabled. Log entries will contain detailed information.');
		}

		this.updateStatus(InstanceStatus.Connecting, '');

		if (this.config.api_key !== undefined && this.config.api_key !== '') {
			this.initConnection();

			this.initActions();
			this.initFeedbacks();
			this.initVariables();
			this.initPresets();
		
			this.checkFeedbacks(...this.feedbackIds);
			this.checkVariables();
		}
		else {
			this.log('warn', 'Please enter your Govee API key.')
			this.GOVEE_DEVICES = [
				{ id: 'select', label: 'No Devices Detected. Enter your API key, click "Save", wait a moment, and then return to this config to choose a device.' },
			]
		}
	}
}