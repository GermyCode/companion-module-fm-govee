// this is more up-to-date than 'node-govee-led'
// put here because of management purposes
const axios = require('axios');

class GoveeLED {
  constructor(config) {
    this.apiKey = config.apiKey
    this.mac = config.mac
    this.sku = config.sku
    this.basePath = "https://openapi.api.govee.com/router/api/v1"
  }

  request(endpoint, reqData, method) {
    return new Promise( ( resolve, reject ) => {

      if (this.mac === "") return reject(new Error("No MAC Address provided."));
      if (this.sku === "") return reject(new Error("No Model provided."));
      let reqURL = this.basePath + endpoint;

      var data = JSON.stringify(reqData);

      var config = {
        method: method,
        url: reqURL,
        headers: { 
          'Govee-API-Key': this.apiKey, 
          'Content-Type': 'application/json'
        },
        data: data
      };
      axios(config)
      .then(function (response) {
        resolve(response.data);
      })
      .catch(function (error) {
        reject(error);
      });
    });
  }

  setColor(hexCode) {
    var regex = /^#([0-9A-F]{3}){1,2}$/i;
    if (!regex.test(hexCode)) throw new Error("Invalid Hex Color Code");
    
    function hex2rgb(hex) {
      var shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
      hex = hex.replace(shorthandRegex, function(m, r, g, b) {
        return r + r + g + g + b + b;
      });

      var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
      } : null;
    }
    
    var RGBconv = hex2rgb(hexCode);
    var APIconv = ((RGBconv.r & 0xFF) << 16) | ((RGBconv.g & 0xFF) << 8) | ((RGBconv.b & 0xFF) << 0);
    var reqData = {
      "requestId": "uuid",
      "payload": {
        "sku": this.sku,
        "device": this.mac,
        "capability": {
          "type": "devices.capabilities.color_setting",
          "instance": "colorRgb",
          "value": APIconv
        }
      }
    };
    var endpoint = '/device/control';
    return (this.request(endpoint, reqData, "post"));
  }

  setColorTemperature(temperatureLevel, info) {
    if (!Number.isInteger(temperatureLevel)) throw new Error("Temperature Level Provided is Not A Number");
    if (temperatureLevel > info.maxkelvin) throw new Error("Temperature Level Provided is Not From " + info.minkelvin + "-" + info.maxkelvin);
    if (temperatureLevel < info.minkelvin) throw new Error("Temperature Level Provided is Not From " + info.minkelvin + "-" + info.maxkelvin);
    var reqData = {
      "requestId": "uuid",
      "payload": {
        "sku": this.sku,
        "device": this.mac,
        "capability": {
          "type": "devices.capabilities.color_setting",
          "instance": "colorTemperatureK",
          "value": temperatureLevel
        }
      }
    };
    var endpoint = '/device/control';
    return this.request(endpoint, reqData, "post");
  }
  
  setSegmentColor(hexCode, segment) {
    var regex = /^#([0-9A-F]{3}){1,2}$/i;
    if (!regex.test(hexCode)) throw new Error("Invalid Hex Color Code");
    
    function hex2rgb(hex) {
      var shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
      hex = hex.replace(shorthandRegex, function(m, r, g, b) {
        return r + r + g + g + b + b;
      });

      var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
      } : null;
    }

    var RGBconv = hex2rgb(hexCode);
    var APIconv = ((RGBconv.r & 0xFF) << 16) | ((RGBconv.g & 0xFF) << 8) | ((RGBconv.b & 0xFF) << 0);
    var reqData = {
      "requestId": "1",
      "payload": {
        "sku": this.sku,
        "device": this.mac,
          "capability": {
          "type": "devices.capabilities.segment_color_setting",
          "instance": "segmentedColorRgb",
          "value": {
            "segment": segment,
            "rgb": APIconv
          }
        }
      }
    };
    var endpoint = '/device/control';
    return this.request(endpoint, reqData, "post");
  }

  setBrightness(brightnessLevel) {
    if (!Number.isInteger(brightnessLevel)) throw new Error("Brightness Level Provided is Not A Number");
    if (brightnessLevel > 100) throw new Error("Brightness Level Provided is Not From 0-100");
    if (brightnessLevel < 0) throw new Error("Brightness Level Provided is Not From 0-100");
    var reqData = {
      "requestId": "1",
      "payload": {
        "sku": this.sku,
        "device": this.mac,
          "capability": {
          "type": "devices.capabilities.range",
          "instance": "brightness",
          "value": brightnessLevel
        }
      }
    };
    var endpoint = '/device/control';
    return this.request(endpoint, reqData, "post");
  }

  setSegmentBrightness(brightnessLevel, segment) {
    if (!Number.isInteger(brightnessLevel)) throw new Error("Brightness Level Provided is Not A Number");
    if (brightnessLevel > 100) throw new Error("Brightness Level Provided is Not From 0-100");
    if (brightnessLevel < 0) throw new Error("Brightness Level Provided is Not From 0-100");
    var reqData = {
      "requestId": "1",
      "payload": {
        "sku": this.sku,
        "device": this.mac,
          "capability": {
          "type": "devices.capabilities.segment_color_setting",
          "instance": "segmentedBrightness",
          "value": {
            "segment": segment,
            "brightness": brightnessLevel
          }
        }
      }
    };
    var endpoint = '/device/control';
    return this.request(endpoint, reqData, "post");
  }

  turnOn() {
    var reqData = {
      "requestId": "uuid",
      "payload": {
        "sku": this.sku,
        "device": this.mac,
        "capability": {
          "type": "devices.capabilities.on_off",
          "instance": "powerSwitch",
          "value": 1
        }
      }
    };

    var endpoint = '/device/control';
    return this.request(endpoint, reqData, "post");
  }

  turnOff() {
    var reqData = {
      "requestId": "uuid",
      "payload": {
        "sku": this.sku,
        "device": this.mac,
        "capability": {
          "type": "devices.capabilities.on_off",
          "instance": "powerSwitch",
          "value": 0
        }
      }
    };
    var endpoint = '/device/control';
    return this.request(endpoint, reqData, "post");
  }

  getState() {
    var reqData = {
      "requestId": "uuid",
      "payload": {
        "sku": this.sku,
        "device": this.mac
      }
    };
    var endpoint = `/device/state`;
    return this.request(endpoint, reqData, "post");
  }

  async getDevices() {
    var reqData = {};
    var endpoint = `/user/devices`;
    let reqURL = this.basePath + endpoint;

    var data = JSON.stringify(reqData);

    var config = {
      method: "get",
      url: reqURL,
      headers: { 
        'Govee-API-Key': this.apiKey, 
        'Content-Type': 'application/json'
      },
      data: data
    };

    let resData;

    await axios(config)
    .then(async function (response) {
      resData = response.data.data;
    })
    .catch(function (error) {
      throw new Error(error);
    });

    return resData;
  }

};

module.exports = GoveeLED;