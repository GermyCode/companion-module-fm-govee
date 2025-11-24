# FM Govee Lights

This is an updated module of [Repository](https://github.com/bitfocus/companion-module-govee-lights). As it has been outdated with a newer API

This module controls most, if not all, H series Govee lights. [Supported Product Models](https://developer.govee.com/docs/support-product-model)

## To Get Started

In order to control the lights over the network (i.e. with Companion), first you will need to apply for an API key. This can be done through the Govee Home App → Profile → Settings → Apply for API Key.

You will also need to add and configure them via the Govee Home App as well. AKA add them to your profile and connect them to the internet.

Once you have your API key and the device configured, enter the API key into the module config, click "Save", exit the config and repoen the config to refresh the device list. The module will auto-detect the Govee devices added to your profile.

Verbose mode - Can be enabled for more detaled logs, for debug and troubleshooting

Update Interval - Periodically get information from the device at the specified interval

*Note:* The Govee API has rate-limits. Up to 10000 commands can be sent per day. If you attempt to do more than this, you will get an error.

For snapshots and scenes, you have to make them in the govee app first then they will show up here to use.

### Actions

* Turn device on, off, toggle
* Change device brightness
* Change device color, RGB and kelvin temperatures (if supported)

-- Segments --

* Change segment brightness
* Change segment color, RGB (kelvin is not supproted by segments as far as I know)
* Gradient toggle to make a gradient between segments

-- Scenes --

* Change Snapshots
* Change scenes, dynamic and DIY

-- Other --

* Refresh device to get new snapshots or scenes, or just to refresh device info
* Get debug info, for debugging purposes, use only if you know what you are doing

### Segment Control

* To specify what segments you want to change, use this formatting: 0,1,2. They dont need to be consecutive. To change specific segments 0,1,6,10 or just 3 to change one segment

### Variables

* Device mac
* Device model
* Device user defined name
* Last set power state
* Last set brightness level
* Last set color
* Min and Max kelvin color temperatures
* Max number of segments
* Current snapshot
* Current dynamic and DIY scenes

### Feedbacks

* Last set power state
* Segment gradient toggle state

### Presets

* General premade buttons to help with the initial page setup, or just to learn about the features

## Updates

## V2.1.1

* Removed the manual mac address input, because if the api can't find the device, then manually inputting the mac wouldn't do anything as the API doesn't recognize it
* Improved verbose logs to actually show what the module is doing

## V2.1.0

* Added segment controls
* Added Snapshot, Dynamic and DIY scene recall

## V1.1.1

* Initial update with newer API and added 'basic' features
