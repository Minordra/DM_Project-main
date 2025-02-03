// ฟังก์ชันสุ่มค่าของยีน (1-9)
export function getRandomGene() {
    return Math.floor(Math.random() * 9) + 1;
}

// ฟังก์ชันสร้าง Chromosomes

// ฟังก์ชันสร้าง Chromosomes (Elitism + Random)
let cout=1;
export function generateChromosomes(RoundCro, RoundFit, method, bestofelit = null) {
    let chromosomesWithFitness = [];
    console.log(cout);
    if (method === "elitism") {
        if (cout == 1) {
            console.log("1");
            for (let i = 0; i < RoundCro; i++) {
                let chromosome = Array.from({ length: RoundFit }, getRandomGene);
                let totalFitness = chromosome.reduce((sum, gene) => sum + gene, 0);
                chromosomesWithFitness.push({ chromosome, fitness: totalFitness });
            }
        } else {
            console.log("2");
            if (bestofelit) {
                chromosomesWithFitness[0]=bestofelit;// ใช้ bestofelit
            }
            for (let i = 1; i < RoundCro; i++) {
                let chromosome = Array.from({ length: RoundFit }, getRandomGene);
                let totalFitness = chromosome.reduce((sum, gene) => sum + gene, 0);
                chromosomesWithFitness.push({ chromosome, fitness: totalFitness });
            }
        }
    } else {
        for (let i = 0; i < RoundCro; i++) {
            let chromosome = Array.from({ length: RoundFit }, getRandomGene);
            let totalFitness = chromosome.reduce((sum, gene) => sum + gene, 0);
            chromosomesWithFitness.push({ chromosome, fitness: totalFitness });
        }
    }
    cout++;
    console.log(chromosomesWithFitness);
    return chromosomesWithFitness;
}
// ฟังก์ชันคำนวณค่า Fitness
export function calculateFitness(chromosome) {
    return chromosome.reduce((sum, gene) => sum + gene, 0);
}

// ฟังก์ชันสำหรับ Crossover (สุ่มจุดแลกเปลี่ยน)
export function crossover(parent1, parent2) {
    let length = parent1.length;
    let swapPoints = new Set();

    let numSwaps = Math.floor(Math.random() * length) + 1;
    while (swapPoints.size < numSwaps) {
        swapPoints.add(Math.floor(Math.random() * length));
    }

    let offspring1 = [...parent1];
    let offspring2 = [...parent2];

    swapPoints.forEach(point => {
        [offspring1[point], offspring2[point]] = [offspring2[point], offspring1[point]];
    });

    let fitness_of1 = calculateFitness(offspring1);
    let fitness_of2 = calculateFitness(offspring2);
    let chro_fit_of1 = { chromosome: offspring1, fitness: fitness_of1 };
    let chro_fit_of2 = { chromosome: offspring2, fitness: fitness_of2 };
    return [chro_fit_of1, chro_fit_of2];
}

// ฟังก์ชันสำหรับ Mutation
export function mutateOffspring(offspring, mutationCount = 2) {
    let mutated = [...offspring];
    let mutationPoints = new Set();
    while (mutationPoints.size < mutationCount) {
        mutationPoints.add(Math.floor(Math.random() * offspring.length));
    }
    mutationPoints.forEach(point => {
        let oldValue = mutated[point];
        let newValue;
        do {
            newValue = getRandomGene();
        } while (newValue === oldValue);
        mutated[point] = newValue;
    });
    let fitness_ofmut = calculateFitness(mutated);
    let mutatedOffspring = { chromosome: mutated, fitness: fitness_ofmut };
    return mutatedOffspring;
}

// ฟังก์ชันเลือก Chromosome Ranking Selection
export function rankingSelection(chromosomes, fitnessValues) {
    if (!chromosomes || chromosomes.length === 0) {
        console.error("Error: Chromosomes array is empty.");
        return [];
    }
    let sorted = chromosomes.map((chromosome, i) => ({
        chromosome,
        fitness: fitnessValues[i]
    })).sort((a, b) => b.fitness - a.fitness);

    console.log("Ranking selection:", sorted);

    let selectionSize = Math.max(1, Math.floor(chromosomes.length / 2)); // ห้ามคืนค่าเป็น []  
    return sorted.slice(0, selectionSize);
}

// ฟังก์ชันเลือก Chromosome Elitism Selection
export function elitismSelection(chromosomesWithFitness) {
    if (!chromosomesWithFitness || chromosomesWithFitness.length === 0) {
        console.error("Error: No chromosomes available for elitism selection.");
        return null; // ป้องกันการคืนค่า undefined
    }
    let sorted = [...chromosomesWithFitness].sort((a, b) => b.fitness - a.fitness);
    console.log("Bestparent",sorted[0])
    return sorted[0]; // คืนค่าเฉพาะ best chromosome เท่านั้น
}
// ฟังก์ชันเลือก Chromosome Tournament Selection
export function tournamentSelection(chromosomes, fitnessValues, tournamentSize) {
    if (!chromosomes || chromosomes.length === 0 || tournamentSize > chromosomes.length) {
        console.error("Error: Not enough chromosomes for tournament selection.");
        return { tournamentCandidates: [], remainingChromosomes: [], remainingFitnessValues: [] };
    }

    let tournamentCandidates = [];
    let remainingChromosomes = [...chromosomes]; 
    let remainingFitnessValues = [...fitnessValues];

    for (let i = 0; i < tournamentSize; i++) {
        if (remainingChromosomes.length === 0) break;

        let IndexPoint = Math.floor(Math.random() * remainingChromosomes.length);
        tournamentCandidates.push({ 
            chromosome: remainingChromosomes[IndexPoint], 
            fitness: remainingFitnessValues[IndexPoint] 
        });

        // ลบค่าที่เลือกออกจากอาร์เรย์หลัก
        remainingChromosomes.splice(IndexPoint, 1);
        remainingFitnessValues.splice(IndexPoint, 1);
    }

    // ตรวจสอบว่ามีโครโมโซมที่เลือกได้หรือไม่
    if (tournamentCandidates.length === 0) {
        console.error("Error: No candidates were selected.");
        return { tournamentCandidates: [], remainingChromosomes, remainingFitnessValues };
    }

    // เรียงตาม fitness มากไปน้อย
    tournamentCandidates.sort((a, b) => b.fitness - a.fitness);
    console.log("Tournament Candidates:", tournamentCandidates);

    return { tournamentCandidates, remainingChromosomes, remainingFitnessValues };
}




export function CalculateBestFitnes(offspring1, offspring2, mutatedOffspring1, mutatedOffspring2) {
    console.log(offspring1, offspring2, mutatedOffspring1, mutatedOffspring2);
    let BestFitnes = 0;
    let BestFitnesCross = 0;
    let BestFitnesMuta = 0;
    if (offspring1 > offspring2) {
        BestFitnesCross = offspring1;
    }
    else {
        BestFitnesCross = offspring2;
    }
    if (mutatedOffspring1 > mutatedOffspring2) {
        BestFitnesMuta = mutatedOffspring1;
    } else {
        BestFitnesMuta = mutatedOffspring2;
    }
    if (BestFitnesCross > BestFitnesMuta) {
        BestFitnes = BestFitnesCross;
    } else {
        BestFitnes = BestFitnesMuta;
    }
    return BestFitnes;
}

