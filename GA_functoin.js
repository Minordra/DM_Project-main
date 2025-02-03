/************************************************************
 * GA_functoin.js
 * - รวมฟังก์ชันที่ใช้ในกระบวนการ Genetic Algorithm
 ************************************************************/

/**
 * ฟังก์ชันสุ่มยีน (ตัวอย่างค่า 1-9)
 */
function getRandomGene() {
    return Math.floor(Math.random() * 9) + 1;
  }
  
  /**
   * ฟังก์ชันคำนวณ Fitness
   * (ตัวอย่างนี้: เอาผลรวมตัวเลขในโครโมโซม)
   */
  function calculateFitness(chromosome) {
    return chromosome.reduce((sum, gene) => sum + gene, 0);
  }
  
  /**
   * 1) ฟังก์ชัน Generate Chromosomes
   * - สร้างโครโมโซมพร้อม Fitness 
   * - ถ้าใช้ Elitism อาจนำ bestOfElit มาผสมด้วยได้ ตามความต้องการ
   */
  export function generateChromosomes(populationSize, roundFit, method, bestOfElit = null) {
    let chromosomesWithFitness = [];
  
    // สร้างโครโมโซมตามจำนวน populationSize
    for (let i = 0; i < populationSize; i++) {
      // สุ่มยีนตาม roundFit (เช่น 6 ยีน)
      let chromosome = Array.from({ length: roundFit }, () => getRandomGene());
      // คำนวณ Fitness
      let fitness = calculateFitness(chromosome);
      chromosomesWithFitness.push({ chromosome, fitness });
    }
  
    // ตัวอย่าง: หากเป็น Elitism อาจเอา bestOfElit มารวมในประชากรรอบใหม่ด้วย (แล้วแต่ตรรกะของคุณ)
    // if (method === 'elitism' && bestOfElit && bestOfElit.chromosome) {
    //   chromosomesWithFitness.push(bestOfElit);
    // }
  
    return chromosomesWithFitness;
  }
  
  /**
   * 2) ฟังก์ชัน Crossover
   * - นำ parent1, parent2 มาผสมกัน
   * - คืน offspring1, offspring2 (มี structure { chromosome, fitness })
   */
  export function crossover(parent1, parent2) {
    if (parent1.length !== parent2.length) {
      console.error('Error: parents มีความยาวไม่เท่ากัน');
      return [
        { chromosome: parent1, fitness: calculateFitness(parent1) },
        { chromosome: parent2, fitness: calculateFitness(parent2) },
      ];
    }
  
    // กำหนดจุด crossover สุ่ม 1 จุด
    const crossoverPoint = Math.floor(Math.random() * parent1.length);
  
    // copy ค่าออกมาก่อน
    let offspring1 = [...parent1];
    let offspring2 = [...parent2];
  
    // แลกเปลี่ยนข้อมูลตั้งแต่ 0 ถึง crossoverPoint
    for (let i = 0; i < crossoverPoint; i++) {
      [offspring1[i], offspring2[i]] = [offspring2[i], offspring1[i]];
    }
  
    return [
      { chromosome: offspring1, fitness: calculateFitness(offspring1) },
      { chromosome: offspring2, fitness: calculateFitness(offspring2) }
    ];
  }
  
  /**
   * 3) ฟังก์ชัน Mutation
   * - สุ่มเปลี่ยนบางตำแหน่ง (ตัวอย่าง เปลี่ยน 1 จุด)
   */
  export function mutateOffspring(offspringChromosome) {
    let mutated = [...offspringChromosome];
  
    // สุ่ม 1 จุด
    const mutationIndex = Math.floor(Math.random() * mutated.length);
    mutated[mutationIndex] = getRandomGene();
  
    return { chromosome: mutated, fitness: calculateFitness(mutated) };
  }
  
  /**
   * 4) Ranking Selection
   * - เรียงลำดับจาก fitness สูง → ต่ำ
   * - ตัวอย่าง: เอา top 2 ตัว
   */
  export function rankingSelection(chromosomes, fitnessValues) {
    if (!chromosomes || !chromosomes.length) {
      console.error('Ranking: ไม่พบ chromosomes');
      return [];
    }
  
    let combined = chromosomes.map((chr, i) => ({
      chromosome: chr,
      fitness: fitnessValues[i]
    }));
  
    combined.sort((a, b) => b.fitness - a.fitness); // สูงไปต่ำ
  
    // เลือก 2 ตัวบน
    return combined.slice(0, 2);
  }
  
  /**
   * 5) Elitism Selection
   * - หาโครโมโซมที่ fitness สูงสุด 1 ตัว
   * - ถ้าอาร์เรย์ว่าง: คืนค่าพิเศษ (ไม่คืน null)
   */
  export function elitismSelection(chromosomesWithFitness) {
    if (!chromosomesWithFitness || chromosomesWithFitness.length === 0) {
      // แทนที่จะ return null, อาจคืนค่า default กัน error
      return {
        chromosome: [1,1,1], // โครโมโซมจำลอง
        fitness: 3
      };
    }
    let sorted = [...chromosomesWithFitness].sort((a, b) => b.fitness - a.fitness);
    return sorted[0]; // ตัวที่ fitness สูงสุด
  }
  
  /**
   * 6) Tournament Selection
   * - สุ่มผู้เข้าแข่ง tournamentSize คน
   * - เรียงลำดับตาม fitness แล้วเลือกคนเก่งสุด
   * - return { tournamentCandidates, remainingChromosomes, remainingFitnessValues }
   */
  export function tournamentSelection(chromosomes, fitnessValues, tournamentSize) {
    // สำเนา array ไว้ตัดออกภายหลัง
    let remainingChromosomes = [...chromosomes];
    let remainingFitnessValues = [...fitnessValues];
  
    if (remainingChromosomes.length < tournamentSize) {
      console.error('Tournament: ขนาดโครโมโซมน้อยกว่าที่ต้องการ');
      return {
        tournamentCandidates: [],
        remainingChromosomes,
        remainingFitnessValues
      };
    }
  
    let tournamentCandidates = [];
  
    for (let i = 0; i < tournamentSize; i++) {
      let index = Math.floor(Math.random() * remainingChromosomes.length);
      let candidate = {
        chromosome: remainingChromosomes[index],
        fitness: remainingFitnessValues[index]
      };
      tournamentCandidates.push(candidate);
  
      // นำออกจาก remaining
      remainingChromosomes.splice(index, 1);
      remainingFitnessValues.splice(index, 1);
    }
  
    // เรียงตาม fitness มากไปน้อย
    tournamentCandidates.sort((a, b) => b.fitness - a.fitness);
  
    return {
      tournamentCandidates,
      remainingChromosomes,
      remainingFitnessValues
    };
  }
  
  /**
   * 7) CalculateBestFitnes()
   * - คืนค่าที่มากที่สุดใน 4 ค่า (offspring1, offspring2, mutatedOffspring1, mutatedOffspring2)
   */
  export function CalculateBestFitnes(of1, of2, mo1, mo2) {
    return Math.max(of1, of2, mo1, mo2);
  }
  
  