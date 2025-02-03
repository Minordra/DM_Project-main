// กำหนด random seed ให้คงที่
Math.seedrandom("loveMatchPredictorSeed");

// flag เพื่อตรวจสอบว่าโมเดลถูกฝึกแล้วหรือยัง
let isTrained = false;

// Global variables สำหรับ normalization parameters
// normalizationParams จะเก็บ min และ max สำหรับแต่ละ feature (index 0 ถึง 10)
let normalizationParams = null;

// -------------------------
// Activation Functions & Derivatives
// -------------------------
function sigmoid(x) {
  return 1 / (1 + Math.exp(-x));
}
function dSigmoid(x) {
  const s = sigmoid(x);
  return s * (1 - s);
}

function relu(x) {
  return Math.max(0, x);
}
function dRelu(x) {
  return x > 0 ? 1 : 0;
}

function threshold(x) {
  return x > 0.5 ? 1 : 0;
}
// ไม่มีอนุพันธ์สำหรับ threshold

function linear(x) {
  return x;
}
function dLinear(x) {
  return 1;
}

function tanh(x) {
  return Math.tanh(x);
}
function dTanh(x) {
  const t = Math.tanh(x);
  return 1 - t * t;
}

// สำหรับการพยากรณ์ (ไม่ต้องการอนุพันธ์)
function activate(x, funcName) {
  switch (funcName) {
    case 'sigmoid': return sigmoid(x);
    case 'relu': return relu(x);
    case 'threshold': return threshold(x);
    case 'linear': return linear(x);
    case 'tanh': return tanh(x);
    default: return x;
  }
}

// สำหรับอนุพันธ์ (ใช้ในการฝึก)
function activateDerivative(x, funcName) {
  switch (funcName) {
    case 'sigmoid': return dSigmoid(x);
    case 'relu': return dRelu(x);
    case 'linear': return dLinear(x);
    case 'tanh': return dTanh(x);
    default: return 0; // threshold ไม่รองรับ
  }
}

// -------------------------
// Global Variables สำหรับโมเดล
// -------------------------
let weights = {
  user_gender: Math.random(),
  user_age: Math.random(),
  user_race: Math.random(),
  partner_age: Math.random(),
  partner_race: Math.random(),
  partner_attr_rating: Math.random(),
  partner_sinc_rating: Math.random(),
  partner_intel_rating: Math.random(),
  partner_fun_rating: Math.random(),
  partner_amb_rating: Math.random(),
  partner_shared_rating: Math.random()
};

let bias = Math.random();

// Global mapping สำหรับเชื้อชาติ (ถ้า dataset มีค่าเป็น text)
let userRaceMapping = null;
let partnerRaceMapping = null;

// -------------------------
// Helper: ทำความสะอาดชื่อ header
// -------------------------
function cleanHeader(header) {
  header = header.trim();
  const idx = header.indexOf('(');
  if (idx !== -1) {
    header = header.substring(0, idx).trim();
  }
  return header;
}

// -------------------------
// ปรับปรุงข้อมูล CSV โดยทำความสะอาด key ของแต่ละแถว
// -------------------------
function cleanCSVData(data) {
  return data.map(row => {
    const newRow = {};
    for (let key in row) {
      if (!isNaN(key)) continue;
      const newKey = cleanHeader(key);
      newRow[newKey] = row[key];
    }
    return newRow;
  });
}

// -------------------------
// สร้าง Mapping เชื้อชาติจาก CSV (ถ้ามี)
 // -------------------------
function createRaceMapping(data) {
  const userRaceSet = new Set();
  const partnerRaceSet = new Set();
  data.forEach(row => {
    if (row.user_race) {
      userRaceSet.add(row.user_race.trim().toLowerCase());
    }
    if (row.partner_race) {
      partnerRaceSet.add(row.partner_race.trim().toLowerCase());
    }
  });
  userRaceMapping = {};
  partnerRaceMapping = {};
  let index = 0;
  userRaceSet.forEach(race => {
    userRaceMapping[race] = index++;
  });
  index = 0;
  partnerRaceSet.forEach(race => {
    partnerRaceMapping[race] = index++;
  });
  console.log("User Race Mapping:", userRaceMapping);
  console.log("Partner Race Mapping:", partnerRaceMapping);
}

// -------------------------
// คำนวณ Normalization Parameters จาก Training Data
// -------------------------
function computeNormalizationParams(trainingData) {
  // สมมุติว่า input vector มี 11 features
  const numFeatures = 11;
  const mins = Array(numFeatures).fill(Infinity);
  const maxs = Array(numFeatures).fill(-Infinity);

  trainingData.forEach(row => {
    const inputs = extractRawInput(row); // ดึง input vector แบบ raw (ไม่ normalize)
    for (let i = 0; i < numFeatures; i++) {
      if (inputs[i] < mins[i]) mins[i] = inputs[i];
      if (inputs[i] > maxs[i]) maxs[i] = inputs[i];
    }
  });
  normalizationParams = { mins, maxs };
  console.log("Normalization Params:", normalizationParams);
}

// -------------------------
// ดึง Input Vector แบบ Raw (ไม่ normalize)
// -------------------------
function extractRawInput(row) {
  const inputs = [];
  inputs.push(parseFloat(row.user_gender));
  inputs.push(parseFloat(row.user_age));
  let uRace = 0;
  if (userRaceMapping && row.user_race) {
    let key = row.user_race.trim().toLowerCase();
    uRace = (userRaceMapping[key] !== undefined) ? userRaceMapping[key] : 0;
  }
  inputs.push(uRace);
  inputs.push(parseFloat(row.partner_age));
  let pRace = 0;
  if (partnerRaceMapping && row.partner_race) {
    let key = row.partner_race.trim().toLowerCase();
    pRace = (partnerRaceMapping[key] !== undefined) ? partnerRaceMapping[key] : 0;
  }
  inputs.push(pRace);
  inputs.push(parseFloat(row.partner_attr_rating));
  inputs.push(parseFloat(row.partner_sinc_rating));
  inputs.push(parseFloat(row.partner_intel_rating));
  inputs.push(parseFloat(row.partner_fun_rating));
  inputs.push(parseFloat(row.partner_amb_rating));
  inputs.push(parseFloat(row.partner_shared_rating));
  return inputs;
}

// -------------------------
// แปลง Input Vector ให้เป็น Normalized Vector
// -------------------------
function normalizeInput(inputs) {
  const normalized = [];
  for (let i = 0; i < inputs.length; i++) {
    const min = normalizationParams.mins[i];
    const max = normalizationParams.maxs[i];
    // ป้องกันหารด้วย 0 หาก max==min
    if (max - min === 0) {
      normalized.push(0.5);
    } else {
      normalized.push((inputs[i] - min) / (max - min));
    }
  }
  return normalized;
}

// -------------------------
// แปลงข้อมูล input จาก row ให้เป็น normalized vector ของตัวเลข
// -------------------------
function extractInput(row) {
  const rawInputs = extractRawInput(row);
  if (!normalizationParams) {
    // หากยังไม่มี normalization parameters ให้คืนค่า raw
    return rawInputs;
  }
  return normalizeInput(rawInputs);
}

// -------------------------
// Feedforward: คำนวณ weighted sum และ activation
// -------------------------
function feedforward(inputs, activationFuncName) {
  let sum = bias;
  let i = 0;
  for (let key in weights) {
    sum += weights[key] * inputs[i];
    i++;
  }
  return { preActivation: sum, output: activate(sum, activationFuncName) };
}

// -------------------------
// ฟังก์ชันฝึกโมเดล (Training) โดยใช้ Gradient Descent
// -------------------------
function trainModel(trainingData, epochs, learningRate, activationFuncName) {
  const logElement = document.getElementById('trainLog');
  logElement.innerHTML = '';

  // คำนวณ normalization parameters จาก training data
  computeNormalizationParams(trainingData);

  for (let epoch = 0; epoch < epochs; epoch++) {
    let totalLoss = 0;
    // Shuffle training data
    trainingData = trainingData.sort(() => Math.random() - 0.5);
    trainingData.forEach(row => {
      const inputs = extractInput(row);
      const target = parseFloat(row.match_result);
      const { preActivation, output } = feedforward(inputs, activationFuncName);
      const error = output - target;
      totalLoss += error * error;
      const gradActivation = activateDerivative(preActivation, activationFuncName);
      const delta = error * gradActivation;
      let i = 0;
      for (let key in weights) {
        weights[key] -= learningRate * delta * inputs[i];
        i++;
      }
      bias -= learningRate * delta;
    });
    if ((epoch + 1) % Math.floor(epochs / 10) === 0) {
      const avgLoss = totalLoss / trainingData.length;
      logElement.innerHTML += `Epoch ${epoch + 1}: Loss = ${avgLoss.toFixed(4)}<br>`;
    }
  }
  logElement.innerHTML += `<br>Training Completed.`;
  isTrained = true;
  displayWeights();
}

// ฟังก์ชันแสดงค่า weights และ bias ในตาราง
function displayWeights() {
  const tbody = document.getElementById('weightsTableBody');
  tbody.innerHTML = '';
  for (let key in weights) {
    const tr = document.createElement('tr');
    const tdKey = document.createElement('td');
    tdKey.innerText = key;
    const tdValue = document.createElement('td');
    tdValue.innerText = weights[key].toFixed(4);
    tr.appendChild(tdKey);
    tr.appendChild(tdValue);
    tbody.appendChild(tr);
  }
  document.getElementById('biasValue').innerText = bias.toFixed(4);
}

// -------------------------
// ฟังก์ชันพยากรณ์ (Prediction) สำหรับข้อมูลที่กรอกในฟอร์ม
// -------------------------
function predictMatch(formData) {
  if (!isTrained) {
    alert("โปรดฝึกโมเดลก่อนทำการพยากรณ์");
    return null;
  }
  const row = {
    user_gender: formData.get('user_gender'),
    user_age: formData.get('user_age'),
    user_race: formData.get('user_race'),
    partner_age: formData.get('partner_age'),
    partner_race: formData.get('partner_race'),
    partner_attr_rating: formData.get('partner_attr_rating'),
    partner_sinc_rating: formData.get('partner_sinc_rating'),
    partner_intel_rating: formData.get('partner_intel_rating'),
    partner_fun_rating: formData.get('partner_fun_rating'),
    partner_amb_rating: formData.get('partner_amb_rating'),
    partner_shared_rating: formData.get('partner_shared_rating')
  };
  const inputs = extractInput(row);
  const activationFuncName = formData.get('activation');
  const { output } = feedforward(inputs, activationFuncName);
  return output;
}

// -------------------------
// Event: Predict Form Submission
// -------------------------
document.getElementById('predictForm').addEventListener('submit', function(e) {
  e.preventDefault();
  const formData = new FormData(e.target);
  const prediction = predictMatch(formData);
  if (prediction === null) return;
  const resultText = prediction > 0.5 
    ? `คู่รักเข้ากันได้! คะแนน: ${prediction.toFixed(3)}`
    : `คู่รักไม่เข้ากัน. คะแนน: ${prediction.toFixed(3)}`;
  document.getElementById('result').innerText = resultText;
});

// -------------------------
// Event: Train Model Button
// -------------------------
document.getElementById('trainModel').addEventListener('click', function() {
  const datasetFile = document.getElementById('dataset').files[0];
  if (!datasetFile) {
    alert("กรุณาอัพโหลด Dataset CSV ก่อนทำการฝึกโมเดล");
    return;
  }
  const reader = new FileReader();
  reader.onload = function(event) {
    const csvText = event.target.result;
    const results = Papa.parse(csvText, { header: true, skipEmptyLines: true });
    const cleanedData = cleanCSVData(results.data);
    createRaceMapping(cleanedData);
    const epochs = parseInt(document.getElementById('epochs').value);
    const learningRate = parseFloat(document.getElementById('learningRate').value);
    const activationFuncName = document.getElementById('trainActivation').value;
    if (activationFuncName === 'threshold') {
      alert("ไม่สามารถฝึกด้วย activation function 'threshold' ได้ กรุณาเลือก activation อื่น");
      return;
    }
    trainModel(cleanedData, epochs, learningRate, activationFuncName);
  };
  reader.readAsText(datasetFile);
});
