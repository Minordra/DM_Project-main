/************************************************************
 * neural.js
 * - รวบรวม Activation Function (sigmoid, relu, threshold, linear, tanh)
 * - ฟังก์ชัน computeOutput สำหรับ single-layer
 ************************************************************/

export function sigmoid(x) {
    return 1 / (1 + Math.exp(-x));
  }
  
  export function relu(x) {
    return Math.max(0, x);
  }
  
  export function threshold(x) {
    return x >= 0 ? 1 : 0;
  }
  
  export function linear(x) {
    return x;
  }
  
  export function tanhFn(x) {
    return Math.tanh(x);
  }
  
  /**
   * computeOutput(inputs, weights, activationFunc)
   *  - สมมติสำหรับ 3 input + 3 weight (เป็นตัวอย่าง)
   *  - ถ้าคุณต้องการ input มากกว่า ก็ขยายตาม
   */
  export function computeOutput(inputs, weights, activationFunc) {
    if (inputs.length !== weights.length) {
      console.error('Error: จำนวน input และ weight ไม่เท่ากัน');
      return 0; 
    }
  
    let sum = 0;
    for (let i = 0; i < inputs.length; i++) {
      sum += inputs[i] * weights[i];
    }
    return activationFunc(sum);
  }
  