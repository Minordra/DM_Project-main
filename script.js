/************************************************************
 *  script.js
 *  
 *  หน้าที่: 
 *    - ควบคุมการทำงานของหน้า index.html (อ่านข้อมูลจากฟอร์ม)
 *    - ประมวลผล Genetic Algorithm (GA) โดยเรียกใช้งานฟังก์ชันจาก GA_functoin.js
 *    - แสดงผลลัพธ์ในรูปแบบตารางที่จัดไว้ (Ranking, Elitism, Tournament)
 ************************************************************/
document.addEventListener("DOMContentLoaded", function () {
  const heartContainer = document.querySelector(".heart-container");

  function createHeart() {
      const heart = document.createElement("div");
      heart.classList.add("heart");
      heart.innerHTML = "❤️";

      // สุ่มตำแหน่งหัวใจในแนวแกน X (0 - 100% viewport width)
      heart.style.left = Math.random() * 120 + "vw";
      heart.style.top = "-5vh"; // เริ่มที่ด้านบนของจอ

      // สุ่มขนาดหัวใจ (ทำให้บางอันใหญ่บางอันเล็ก)
      heart.style.fontSize = Math.random() * 50 + 30 + 20 + "px"; // ขนาด 20px - 40px

      // สุ่มความโปร่งใส (บางอันจาง บางอันเข้ม)
      heart.style.opacity = Math.random() * 0.5 + 0.5; // 0.5 - 1

      // สุ่มระยะเวลา animation (ทำให้หัวใจตกลงมาด้วยความเร็วต่างกัน)
      heart.style.animationDuration = Math.random() * 3 + 2 + "s"; // 2s - 5s

      heartContainer.appendChild(heart);

      // ลบหัวใจเมื่ออนิเมชันจบเพื่อไม่ให้เกิดการโหลดหนัก
      setTimeout(() => {
          heart.remove();
      }, 5000);
  }

  // สร้างหัวใจใหม่ทุกๆ 500ms (0.5 วินาที)
  setInterval(createHeart, 500);
});


import {
  generateChromosomes,
  crossover,
  mutateOffspring,
  rankingSelection,
  elitismSelection,
  tournamentSelection,
  CalculateBestFitnes
} from './GA_functoin.js';

/**
 * เมื่อ DOM โหลดเสร็จ เริ่มต้นผูก Event ต่าง ๆ
 */
document.addEventListener('DOMContentLoaded', initApp);

/**
 * initApp()
 * - ผูกรายการ event กับ Form (submit) และปุ่ม clear
 */
function initApp() {
  const form = document.getElementById('myForm');
  const clearBtn = document.getElementById('clearBtn');

  form.addEventListener('submit', handleFormSubmit);
  clearBtn.addEventListener('click', handleClearOutput);
}

/**
 * handleFormSubmit(event)
 * - อ่านค่าจากฟอร์ม
 * - ประมวลผล GA ตามจำนวน generations
 * - แสดงผลลัพธ์
 */
function handleFormSubmit(event) {
  event.preventDefault(); // ป้องกันการรีเฟรชหน้า

  // ดึงค่าจาก input ในฟอร์ม
  const method = document.getElementById('method').value;
  const populationSize = parseInt(document.getElementById('RoundCro').value);
  const roundFit = 6; // หรือจะเพิ่มช่องให้ผู้ใช้กรอกเองก็ได้
  const generations = parseInt(document.getElementById('Round').value);
  const targetFitness = parseInt(document.getElementById('Benefit').value);

  // พื้นที่สำหรับแสดงผล
  const outputEl = document.getElementById('output');
  outputEl.innerHTML = ''; // เคลียร์ผลลัพธ์เก่าทิ้ง

  // ตรวจสอบความถูกต้องของตัวเลข
  if (
    isNaN(populationSize) ||
    isNaN(roundFit) ||
    isNaN(generations) ||
    isNaN(targetFitness)
  ) {
    alert('กรุณากรอกตัวเลขให้ถูกต้อง');
    return;
  }

  // =========================================================
  // รีเซ็ตตัวแปรหลักของ GA ทุกครั้ง
  // =========================================================
  let bestOfElit = [];          // เก็บโครโมโซมที่ดีที่สุด (ใช้ใน Elitism)
  let selectedParents = [];     // สำหรับ Ranking / Elitism
  let tournamentGroup1 = [];    // กลุ่มที่แข่งใน Tournament
  let tournamentGroup2 = [];

  // พ่อแม่และลูก
  let parent1, parent2;
  let offspring1, offspring2;
  let mutatedOffspring1, mutatedOffspring2;

  // ค่าที่เกี่ยวกับ Fitness
  let chromosomesWithFitness = [];
  let currentBestFitness = 0;   // Fitness สูงสุดในรอบปัจจุบัน
  let bestFitnessSoFar = 0;     // Fitness สูงสุดสะสม
  let bestRound = 0;            // รอบที่ได้ fitness สูงสุดสะสม

  // ตัวแปรสะสมผลการแสดง
  let resultHTML = '';

  // =========================================================
  // วนลูปรัน GA ตามจำนวน generations
  // =========================================================
  for (let i = 0; i < generations; i++) {
    // ถ้าได้ fitness >= targetFitness แล้วให้หยุด
    if (bestFitnessSoFar >= targetFitness) break;

    // (1) สร้างโครโมโซมรอบนี้
    chromosomesWithFitness = generateChromosomes(
      populationSize,  // ขนาดประชากร
      roundFit,        // จำนวนยีนใน 1 โครโมโซม
      method,          // วิธีที่ผู้ใช้เลือก (ranking, elitism, tournament)
      bestOfElit       // เผื่อใช้ใน Elitism
    );

    // แยก array chromosome กับ fitness
    const chromosomes = chromosomesWithFitness.map(item => item.chromosome);
    const fitnessValues = chromosomesWithFitness.map(item => item.fitness);

    // (2) เลือกพ่อแม่ตาม method
    if (method === 'ranking') {
      selectedParents = rankingSelection(chromosomes, fitnessValues);

    } else if (method === 'elitism') {
      // หา bestOfElit
      bestOfElit = elitismSelection(chromosomesWithFitness);
      // ตัดตัวที่ดีที่สุดออกจาก pool เหลือไว้ให้สุ่มเป็นพ่อแม่
      selectedParents = chromosomesWithFitness.filter(ch => ch !== bestOfElit);

    } else if (method === 'tournament') {
      // Tournament Selection
      const tournamentSize = Math.floor(chromosomes.length / 2);

      const group1Result = tournamentSelection(chromosomes, fitnessValues, tournamentSize);
      const group2Result = tournamentSelection(
        group1Result.remainingChromosomes,
        group1Result.remainingFitnessValues,
        tournamentSize
      );

      // เก็บผู้เข้าแข่งขันเพื่อไว้แสดงในตาราง
      tournamentGroup1 = group1Result.tournamentCandidates;
      tournamentGroup2 = group2Result.tournamentCandidates;

      // ผู้ชนะของแต่ละทัวร์นาเมนต์
      parent1 = group1Result.tournamentCandidates[0];
      parent2 = group2Result.tournamentCandidates[0];
    }

    // (3) กรณี Ranking หรือ Elitism -> สุ่มพ่อแม่จาก selectedParents
    if (method !== 'tournament') {
      if (selectedParents.length < 2) {
        console.warn('มีพ่อแม่ไม่เพียงพอในการสุ่ม (Elitism/Ranking)');
        break;
      }
      do {
        parent1 = randomPick(selectedParents);
        parent2 = randomPick(selectedParents);
      } while (parent1 === parent2);
    }

    // (4) ทำ Crossover
    [offspring1, offspring2] = crossover(parent1.chromosome, parent2.chromosome);

    // (5) ทำ Mutation
    mutatedOffspring1 = mutateOffspring(offspring1.chromosome);
    mutatedOffspring2 = mutateOffspring(offspring2.chromosome);

    // (6) เช็ค Fitness ที่ดีที่สุดในรอบนี้ (4 ตัว)
    currentBestFitness = CalculateBestFitnes(
      offspring1.fitness,
      offspring2.fitness,
      mutatedOffspring1.fitness,
      mutatedOffspring2.fitness
    );

    // ถ้าได้ค่า fitness ดีกว่า bestFitnessSoFar ให้บันทึก
    if (currentBestFitness > bestFitnessSoFar) {
      bestFitnessSoFar = currentBestFitness;
      bestRound = i + 1; // รอบ (นับจาก 1)
    }

    // (7) สร้าง HTML แสดงผลลัพธ์ของรอบนี้
    if (method === 'ranking') {
      resultHTML += displayRankingResults(
        i + 1,
        chromosomesWithFitness,
        selectedParents,
        parent1,
        parent2,
        offspring1,
        offspring2,
        mutatedOffspring1,
        mutatedOffspring2,
        currentBestFitness,
        bestFitnessSoFar,
        bestRound
      );
    } else if (method === 'elitism') {
      resultHTML += displayElitismResults(
        i + 1,
        chromosomesWithFitness,
        bestOfElit,
        parent1,
        parent2,
        offspring1,
        offspring2,
        mutatedOffspring1,
        mutatedOffspring2,
        currentBestFitness,
        bestFitnessSoFar,
        bestRound
      );
    } else if (method === 'tournament') {
      resultHTML += displayTournamentResults(
        i + 1,
        chromosomesWithFitness,
        parent1,
        parent2,
        offspring1,
        offspring2,
        mutatedOffspring1,
        mutatedOffspring2,
        currentBestFitness,
        tournamentGroup1,
        tournamentGroup2,
        bestFitnessSoFar,
        bestRound
      );
    }
  }

  // สิ้นสุดการรัน GA -> แสดงผลทั้งหมด
  outputEl.innerHTML = resultHTML;
}

/**
 * handleClearOutput()
 * - ล้างเนื้อหาใน output
 */
function handleClearOutput() {
  document.getElementById('output').innerHTML = '';
}

/**
 * randomPick(items)
 * - สุ่มหยิบ 1 ตัวจากอาร์เรย์ที่ส่งมา
 */
function randomPick(items) {
  const randIndex = Math.floor(Math.random() * items.length);
  return items[randIndex];
}

/* =========================================================
   ฟังก์ชันแสดงผลตามรูปแบบ Selection แต่ละแบบ
   - Ranking
   - Elitism
   - Tournament
   (สามารถปรับแต่ง UI เช่น เปลี่ยน <div class="alert"> หรือข้อความได้)
   ========================================================= */

/**
 * displayRankingResults()
 * - แสดงผลในแต่ละรอบของ Ranking
 */
function displayRankingResults(
  round,
  chromosomesWithFitness,
  selectedParents,
  parent1,
  parent2,
  offspring1,
  offspring2,
  mutatedOffspring1,
  mutatedOffspring2,
  currentBestFitness,
  bestFitnessSoFar,
  bestRound
) {
  return `
    <div class="alert alert-danger shadow mt-3 p-4">     
      <h4 class="text-center">🎯 Ranking Selection (รอบที่ ${round})</h4>
      ${generateTableRanking(
    chromosomesWithFitness,
    selectedParents,
    parent1,
    parent2,
    offspring1,
    offspring2,
    mutatedOffspring1,
    mutatedOffspring2,
    currentBestFitness,
    bestFitnessSoFar,
    bestRound
  )}
    </div>`;
}

/**
 * displayElitismResults()
 * - แสดงผลในแต่ละรอบของ Elitism
 */
function displayElitismResults(
  round,
  chromosomesWithFitness,
  bestOfElit,
  parent1,
  parent2,
  offspring1,
  offspring2,
  mutatedOffspring1,
  mutatedOffspring2,
  currentBestFitness,
  bestFitnessSoFar,
  bestRound
) {
  return `
    <div class="alert alert-warning shadow mt-3 p-4">
      <h4 class="text-center">🏆 Elitism Selection (รอบที่ ${round})</h4>
      ${generateTableElitism(
    chromosomesWithFitness,
    bestOfElit,
    parent1,
    parent2,
    offspring1,
    offspring2,
    mutatedOffspring1,
    mutatedOffspring2,
    currentBestFitness,
    bestFitnessSoFar,
    bestRound
  )}
    </div>`;
}

/**
 * displayTournamentResults()
 * - แสดงผลในแต่ละรอบของ Tournament
 */
function displayTournamentResults(
  round,
  chromosomesWithFitness,
  parent1,
  parent2,
  offspring1,
  offspring2,
  mutatedOffspring1,
  mutatedOffspring2,
  currentBestFitness,
  tournamentGroup1,
  tournamentGroup2,
  bestFitnessSoFar,
  bestRound
) {
  return `
    <div class="alert alert-success shadow mt-3 p-4">
      <h4 class="text-center">⚔️ Tournament Selection (รอบที่ ${round})</h4>
      ${generateTableTournament(
    chromosomesWithFitness,
    parent1,
    parent2,
    offspring1,
    offspring2,
    mutatedOffspring1,
    mutatedOffspring2,
    currentBestFitness,
    tournamentGroup1,
    tournamentGroup2,
    bestFitnessSoFar,
    bestRound
  )}
    </div>`;
}

/* =========================================================
   ฟังก์ชันสร้างตารางรายละเอียดแต่ละรูปแบบ
   (Ranking, Elitism, Tournament)
   ========================================================= */

/**
 * generateTableRanking()
 */
function generateTableRanking(
  chromosomesWithFitness,
  selectedParents,
  parent1,
  parent2,
  offspring1,
  offspring2,
  mutatedOffspring1,
  mutatedOffspring2,
  currentBestFitness,
  bestFitnessSoFar,
  bestRound
) {
  return `
      <table class="table table-bordered">
        <tr>
          <td>👩‍❤️‍👨 จำนวนคู่รัก</td>
          <td>
            ${chromosomesWithFitness.length > 0
      ? chromosomesWithFitness
        .map(ch => {
          if (!ch || !ch.chromosome) return 'N/A';
          return `👩‍❤️‍👨 [ ${ch.chromosome.join(', ')} ] = Fitness: ${ch.fitness}`;
        })
        .join('<br>')
      : 'N/A'
    }
          </td>
        </tr>
        <tr>
          <td>💞 พ่อแม่ที่ถูกเลือก</td>
          <td>
            ${selectedParents.length > 0
      ? selectedParents
        .map(p => {
          if (!p || !p.chromosome) return 'N/A';
          return `👩‍❤️‍👨 [ ${p.chromosome.join(', ')} ] = Fitness: ${p.fitness}`;
        })
        .join('<br>')
      : 'N/A'
    }
          </td>
        </tr>
        <tr>
          <td>👨‍❤️‍👨 พ่อแม่ 1</td>
          <td>[ ${parent1.chromosome.join(', ')} ] = Fitness: ${parent1.fitness}</td>
        </tr>
        <tr>
          <td>👩‍❤️‍👩 พ่อแม่ 2</td>
          <td>[ ${parent2.chromosome.join(', ')} ] = Fitness: ${parent2.fitness}</td>
        </tr>
        <tr>
          <td>👶 ลูกหลัง Crossover</td>
          <td>
            [ ${offspring1.chromosome.join(', ')} ] = Fitness: ${offspring1.fitness}<br>
            [ ${offspring2.chromosome.join(', ')} ] = Fitness: ${offspring2.fitness}
          </td>
        </tr>
        <tr>
          <td>✨ ลูกหลัง Mutation</td>
          <td>
            [ ${mutatedOffspring1.chromosome.join(', ')} ] = Fitness: ${mutatedOffspring1.fitness}<br>
            [ ${mutatedOffspring2.chromosome.join(', ')} ] = Fitness: ${mutatedOffspring2.fitness}
          </td>
        </tr>
        <tr>
          <td>🏆 Fitness ที่ดีที่สุด (รอบนี้)</td>
          <td><strong>${currentBestFitness}</strong></td>
        </tr>
        <tr>
          <td>🔥 Fitness สูงสุดสะสม</td>
          <td><strong>${bestFitnessSoFar}</strong></td>
        </tr>
        <tr>
          <td>💯 รอบที่ดีที่สุด</td>
          <td><strong>${bestRound}</strong></td>
        </tr>
      </table>
    `;
}

/**
 * generateTableElitism()
 */
function generateTableElitism(
  chromosomesWithFitness,
  bestOfElit,
  parent1,
  parent2,
  offspring1,
  offspring2,
  mutatedOffspring1,
  mutatedOffspring2,
  currentBestFitness,
  bestFitnessSoFar,
  bestRound
) {
  return `
      <table class="table table-bordered">
        <tr>
          <td>👩‍❤️‍👨 จำนวนคู่รัก</td>
          <td>
            ${chromosomesWithFitness
      .map(ch => {
        if (!ch || !ch.chromosome) return 'N/A';
        return `👩‍❤️‍👨 [ ${ch.chromosome.join(', ')} ] = Fitness: ${ch.fitness}`;
      })
      .join('<br>')
    }
          </td>
        </tr>
        <tr>
          <td>🏆 คู่รักที่ดีที่สุด (Elitism)</td>
          <td>
            ${bestOfElit && bestOfElit.chromosome
      ? `👩‍❤️‍👨 [ ${bestOfElit.chromosome.join(', ')} ] = Fitness: ${bestOfElit.fitness}`
      : 'N/A'
    }
          </td>
        </tr>
        <tr>
          <td>👨‍❤️‍👨 พ่อแม่ 1</td>
          <td>[ ${parent1.chromosome.join(', ')} ] = Fitness: ${parent1.fitness}</td>
        </tr>
        <tr>
          <td>👩‍❤️‍👩 พ่อแม่ 2</td>
          <td>[ ${parent2.chromosome.join(', ')} ] = Fitness: ${parent2.fitness}</td>
        </tr>
        <tr>
          <td>👶 ลูกหลัง Crossover</td>
          <td>
            [ ${offspring1.chromosome.join(', ')} ] = Fitness: ${offspring1.fitness}<br>
            [ ${offspring2.chromosome.join(', ')} ] = Fitness: ${offspring2.fitness}
          </td>
        </tr>
        <tr>
          <td>✨ ลูกหลัง Mutation</td>
          <td>
            [ ${mutatedOffspring1.chromosome.join(', ')} ] = Fitness: ${mutatedOffspring1.fitness}<br>
            [ ${mutatedOffspring2.chromosome.join(', ')} ] = Fitness: ${mutatedOffspring2.fitness}
          </td>
        </tr>
        <tr>
          <td>🏆 Fitness ที่ดีที่สุด (รอบนี้)</td>
          <td><strong>${currentBestFitness}</strong></td>
        </tr>
        <tr>
          <td>🔥 Fitness สูงสุดสะสม</td>
          <td><strong>${bestFitnessSoFar}</strong></td>
        </tr>
        <tr>
          <td>💯 รอบที่ดีที่สุด</td>
          <td><strong>${bestRound}</strong></td>
        </tr>
      </table>
    `;
}

/**
 * generateTableTournament()
 */
function generateTableTournament(
  chromosomesWithFitness,
  parent1,
  parent2,
  offspring1,
  offspring2,
  mutatedOffspring1,
  mutatedOffspring2,
  currentBestFitness,
  tournamentGroup1,
  tournamentGroup2,
  bestFitnessSoFar,
  bestRound
) {
  return `
      <table class="table table-bordered">
        <tr>
          <td>👩‍❤️‍👨 จำนวนคู่รัก</td>
          <td>
            ${chromosomesWithFitness
      .map(ch => {
        if (!ch || !ch.chromosome) return 'N/A';
        return `👩‍❤️‍👨 [ ${ch.chromosome.join(', ')} ] = Fitness: ${ch.fitness}`;
      })
      .join('<br>')
    }
          </td>
        </tr>
        <tr>
          <td>⚔️ ผู้เข้าแข่งขันใน Tournament1</td>
          <td>
            ${tournamentGroup1
      .map(p => {
        if (!p || !p.chromosome) return 'N/A';
        return `👩‍❤️‍👨 [ ${p.chromosome.join(', ')} ] = Fitness: ${p.fitness}`;
      })
      .join('<br>')
    }
          </td>
        </tr>
        <tr>
          <td>⚔️ ผู้เข้าแข่งขันใน Tournament2</td>
          <td>
            ${tournamentGroup2
      .map(p => {
        if (!p || !p.chromosome) return 'N/A';
        return `👩‍❤️‍👨 [ ${p.chromosome.join(', ')} ] = Fitness: ${p.fitness}`;
      })
      .join('<br>')
    }
          </td>
        </tr>
        <tr>
          <td>👨‍❤️‍👨 พ่อแม่ 1</td>
          <td>[ ${parent1.chromosome.join(', ')} ] = Fitness: ${parent1.fitness}</td>
        </tr>
        <tr>
          <td>👩‍❤️‍👩 พ่อแม่ 2</td>
          <td>[ ${parent2.chromosome.join(', ')} ] = Fitness: ${parent2.fitness}</td>
        </tr>
        <tr>
          <td>👶 ลูกหลัง Crossover</td>
          <td>
            [ ${offspring1.chromosome.join(', ')} ] = Fitness: ${offspring1.fitness}<br>
            [ ${offspring2.chromosome.join(', ')} ] = Fitness: ${offspring2.fitness}
          </td>
        </tr>
        <tr>
          <td>✨ ลูกหลัง Mutation</td>
          <td>
            [ ${mutatedOffspring1.chromosome.join(', ')} ] = Fitness: ${mutatedOffspring1.fitness}<br>
            [ ${mutatedOffspring2.chromosome.join(', ')} ] = Fitness: ${mutatedOffspring2.fitness}
          </td>
        </tr>
        <tr>
          <td>🏆 Fitness ที่ดีที่สุด (รอบนี้)</td>
          <td><strong>${currentBestFitness}</strong></td>
        </tr>
        <tr>
          <td>🔥 Fitness สูงสุดสะสม</td>
          <td><strong>${bestFitnessSoFar}</strong></td>
        </tr>
        <tr>
          <td>💯 รอบที่ดีที่สุด</td>
          <td><strong>${bestRound}</strong></td>
        </tr>
      </table>
    `;
}
