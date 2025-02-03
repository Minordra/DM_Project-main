import {
    generateChromosomes,
    crossover,
    mutateOffspring,
    rankingSelection,
    elitismSelection,
    tournamentSelection,
    CalculateBestFitnes
} from './GA_functoin.js';

document.addEventListener("DOMContentLoaded", function () {
    document.getElementById("myForm").addEventListener("submit", function (event) {
        event.preventDefault();

        const method = document.getElementById("method").value;
        const RoundCro = parseInt(document.getElementById("RoundCro").value);
        const RoundFit = 6;
        let round = parseInt(document.getElementById("Round").value);
        const Benefit = parseInt(document.getElementById("Benefit").value);

        let outputElement = document.getElementById("output");
        outputElement.innerHTML = ""; // เคลียร์ผลลัพธ์เก่าก่อนเริ่มใหม่

        if (isNaN(RoundCro) || isNaN(RoundFit)) {
            alert("กรุณากรอกตัวเลขให้ถูกต้อง");
            return;
        }

        let resultHTML = "";
        let selectedParents = [];
        let bestofelit = [];
        let parent1, parent2;
        let offspring1, offspring2;
        let mutatedOffspring1, mutatedOffspring2;
        let chromosomesWithFitness = [];
        let BestFitnes = 0;
        let group1, group2;
        let Tornament1, Tornament2;
        let BestFitnesofround = 0;
        let Bestround = 0;


        for (let i = 0; i < round; i++) {
            if (BestFitnes >= Benefit) break;

            chromosomesWithFitness = generateChromosomes(RoundCro, RoundFit, method, bestofelit);
            let chromosomes = chromosomesWithFitness.map(item => item.chromosome);
            let fitnessValues = chromosomesWithFitness.map(item => item.fitness);

            if (method === "ranking") {
                selectedParents = rankingSelection(chromosomes, fitnessValues);
            } else if (method === "elitism") {
                bestofelit = elitismSelection(chromosomesWithFitness);
                selectedParents = chromosomesWithFitness.filter(ch => ch !== bestofelit);
            } else if (method === "tournament") {
                let tournamentSize = Math.floor(chromosomes.length / 2);
                let group1Result = tournamentSelection(chromosomes, fitnessValues, tournamentSize);
                let group2Result = tournamentSelection(group1Result.remainingChromosomes, group1Result.remainingFitnessValues, tournamentSize);
                Tornament1= group1Result.tournamentCandidates;
                Tornament2= group2Result.tournamentCandidates;
                parent1 = group1Result.tournamentCandidates[0];
                parent2 = group2Result.tournamentCandidates[0];
            }

            if (method !== "tournament") {
                do {
                    parent1 = selectedParents[Math.floor(Math.random() * selectedParents.length)];
                    parent2 = selectedParents[Math.floor(Math.random() * selectedParents.length)];
                } while (parent1 === parent2);
            }

            [offspring1, offspring2] = crossover(parent1.chromosome, parent2.chromosome);
            mutatedOffspring1 = mutateOffspring(offspring1.chromosome);
            mutatedOffspring2 = mutateOffspring(offspring2.chromosome);
            BestFitnes = CalculateBestFitnes(offspring1.fitness, offspring2.fitness, mutatedOffspring1.fitness, mutatedOffspring2.fitness);
            if (BestFitnesofround < BestFitnes){
                BestFitnesofround = BestFitnes ;
                Bestround = i+1 ;
            }

            if (method === "ranking") {
                resultHTML += displayRankingResults(i + 1, chromosomesWithFitness, selectedParents, parent1, parent2, offspring1, offspring2, mutatedOffspring1, mutatedOffspring2, BestFitnes,BestFitnesofround,Bestround);
            } else if (method === "elitism") {
                console.log(mutatedOffspring1,mutatedOffspring2);
                resultHTML += displayElitismResults(i + 1, chromosomesWithFitness,bestofelit, parent1, parent2, offspring1, offspring2, mutatedOffspring1, mutatedOffspring2, BestFitnes,BestFitnesofround,Bestround );
               
            } else if (method === "tournament") {
                resultHTML += displayTournamentResults(i + 1, chromosomesWithFitness, parent1, parent2, offspring1, offspring2, mutatedOffspring1, mutatedOffspring2, BestFitnes,Tornament1,Tornament2,BestFitnesofround,Bestround );
            }
        }

        outputElement.innerHTML = resultHTML;

        document.getElementById("clearBtn").addEventListener("click", function () {
            document.getElementById("output").innerHTML = "";
        });
    });
});
// ✅ ฟังก์ชันแสดงผลสำหรับ Ranking Selection
function displayRankingResults(round, chromosomesWithFitness, selectedParents, parent1, parent2, offspring1, offspring2, mutatedOffspring1, mutatedOffspring2, BestFitnes ,BestFitnesofround,Bestround ) {
    return `<div class="alert alert-danger shadow mt-3 p-4">     
        <h4 class="text-center">🎯 Ranking Selection (รอบที่ ${round})</h4>
        ${generateTableRanking(chromosomesWithFitness, selectedParents, parent1, parent2, offspring1, offspring2, mutatedOffspring1, mutatedOffspring2, BestFitnes ,BestFitnesofround,Bestround )}
    </div>`;
}

// ✅ ฟังก์ชันแสดงผลสำหรับ Elitism Selection
function displayElitismResults(round,chromosomesWithFitness, bestofelit, parent1, parent2, offspring1, offspring2, mutatedOffspring1, mutatedOffspring2, BestFitnes,BestFitnesofround,Bestround ) {
    return `<div class="alert alert-warning shadow mt-3 p-4">
        <h4 class="text-center">🏆 Elitism Selection (รอบที่ ${round})</h4>
        ${generateofelit(chromosomesWithFitness, [bestofelit], parent1, parent2, offspring1, offspring2, mutatedOffspring1, mutatedOffspring2, BestFitnes, BestFitnesofround,Bestround )}
    </div>`;
}

// ✅ ฟังก์ชันแสดงผลสำหรับ Tournament Selection
function displayTournamentResults(round, chromosomesWithFitness, parent1, parent2, offspring1, offspring2, mutatedOffspring1, mutatedOffspring2, BestFitnes,Tornament1,Tornament2,BestFitnesofround,Bestround ) {
    return `<div class="alert alert-success shadow mt-3 p-4">
        <h4 class="text-center">⚔️ Tournament Selection (รอบที่ ${round})</h4>
        ${generateofTournament(chromosomesWithFitness, parent1, parent2, offspring1, offspring2, mutatedOffspring1, mutatedOffspring2, BestFitnes,method,Tornament1,Tornament2,BestFitnesofround,Bestround )}
    </div>`;
}

// ✅ ฟังก์ชันสร้างตารางแสดงผลลัพธ์
 function generateTableRanking(chromosomesWithFitness, selectedParents, parent1, parent2, offspring1, offspring2, mutatedOffspring1, mutatedOffspring2, BestFitnes,BestFitnesofround,Bestround ){
    return `<table class="table table-bordered">
        <tr><td>👩‍❤️‍👨 จำนวนคู่รัก</td><td>
            ${chromosomesWithFitness.length > 0 ? chromosomesWithFitness.map(ch => 
                `👩‍❤️‍👨 คู่รัก: ${Array.isArray(ch.chromosome) ? ch.chromosome.join(', ') : 'N/A'} | Fitness: ${ch.fitness ?? 'N/A'}` 
            ).join('<br> ') : 'N/A'}
        </td></tr>
        ${chromosomesWithFitness != null ? `
            <tr><td>💞 พ่อแม่ที่ถูกเลือก</td><td>
                ${selectedParents.length > 0 ? 
                    selectedParents.map(p => 
                        `👩‍❤️‍👨 คู่รัก: ${Array.isArray(p.chromosome) ? p.chromosome.join(', ') : 'N/A'} | Fitness: ${p.fitness ?? 'N/A'}` 
                    ).join('<br> ') : 'N/A'}
            </td></tr>` 
        : ''}

        <tr><td>👨‍❤️‍👨 พ่อแม่ 1</td><td>${Array.isArray(parent1?.chromosome) ? parent1.chromosome.join(', ') : 'N/A'} | Fitness: ${parent1?.fitness ?? 'N/A'}</td></tr>
        <tr><td>👩‍❤️‍👩 พ่อแม่ 2</td><td>${Array.isArray(parent2?.chromosome) ? parent2.chromosome.join(', ') : 'N/A'} | Fitness: ${parent2?.fitness ?? 'N/A'}</td></tr>
        <tr><td>👶 ลูกหลังจาก Crossover</td><td>
            ${Array.isArray(offspring1?.chromosome) ? offspring1.chromosome.join(', ') : 'N/A'} | Fitness: ${offspring1?.fitness ?? 'N/A'} <br> 
            ${Array.isArray(offspring2?.chromosome) ? offspring2.chromosome.join(', ') : 'N/A'} | Fitness: ${offspring2?.fitness ?? 'N/A'}
        </td></tr>
        <tr><td>✨ ลูกหลังจาก Mutation</td><td>
            ${Array.isArray(mutatedOffspring1?.chromosome) ? mutatedOffspring1.chromosome.join(', ') : 'N/A'} | Fitness: ${mutatedOffspring1?.fitness ?? 'N/A'} <br> 
            ${Array.isArray(mutatedOffspring2?.chromosome) ? mutatedOffspring2.chromosome.join(', ') : 'N/A'} | Fitness: ${mutatedOffspring2?.fitness ?? 'N/A'}
        </td></tr>
        <tr><td>🏆 ค่า Fitness ที่ดีที่สุด</td><td><strong>${BestFitnes ?? 'N/A'}</strong></td></tr>
        <tr><td>🔥 Fitness สูงสุดในรอบนี้</td><td><strong>${BestFitnesofround}</strong></td></tr>
        <tr><td>💯 รอบที่ดีที่สุด</td><td><strong>${Bestround}</strong></td></tr>
    </table>`;
}

function generateofelit(chromosomesWithFitness, selectedParents, parent1, parent2, offspring1, offspring2, mutatedOffspring1, mutatedOffspring2, BestFitnes,BestFitnesofround,Bestround) {
    return `<table class="table table-bordered">
        <tr><td>Chromosomes</td><td>${chromosomesWithFitness.map(ch => `Chromosome: ${ch.chromosome.join(', ')} | Fitness: ${ch.fitness}`).join('<br> ')}</td></tr>
        <tr><td>Best Parents</td><td>${selectedParents.map(p => `Chromosome: ${p.chromosome.join(', ')} | Fitness: ${p.fitness}`).join('<br> ')}</td></tr>
        <tr><td>Parent 1</td><td>${parent1.chromosome.join(', ')} | Fitness: ${parent1.fitness}</td></tr>
        <tr><td>Parent 2</td><td>${parent2.chromosome.join(', ')} | Fitness: ${parent2.fitness}</td></tr>
        <tr><td>Offspring (After Crossover)</td><td>${offspring1.chromosome.join(', ')} | Fitness: ${offspring1.fitness} <br> ${offspring2.chromosome.join(', ')} | Fitness: ${offspring2.fitness}</td></tr>
        <tr><td>Offspring (After Mutation)</td><td>${mutatedOffspring1.chromosome.join(', ')} | Fitness: ${mutatedOffspring1.fitness} <br> ${mutatedOffspring2.chromosome.join(', ')} | Fitness: ${mutatedOffspring2.fitness}</td></tr>
        <tr><td>Best Fitness Value</td><td><strong>${BestFitnes}</strong></td></tr>
        <tr><td>BestFitnesofround</td><td><strong>${BestFitnesofround},</strong></td></tr>
        <tr><td>BestRound</td><td><strong>${Bestround}</strong></td></tr>
    </table>`;
}

function generateofTournament(chromosomesWithFitness, parent1, parent2, offspring1, offspring2, mutatedOffspring1, mutatedOffspring2, BestFitnes,method,Tornament1,Tornament2,BestFitnesofround,Bestround) {
    return `<table class="table table-bordered">
        <tr><td>Chromosomes</td><td>${chromosomesWithFitness.map(ch => `Chromosome: ${ch.chromosome.join(', ')} | Fitness: ${ch.fitness}`).join('<br> ')}</td></tr>
        <tr><td>Tornament1</td><td>${Tornament1.map(p => `Chromosome: ${p.chromosome.join(', ')} | Fitness: ${p.fitness}`).join('<br> ')}</td></tr>
        <tr><td>Tornament2</td><td>${Tornament2.map(p => `Chromosome: ${p.chromosome.join(', ')} | Fitness: ${p.fitness}`).join('<br> ')}</td></tr>
        <tr><td>Parent 1</td><td>${parent1.chromosome.join(', ')} | Fitness: ${parent1.fitness}</td></tr>
        <tr><td>Parent 2</td><td>${parent2.chromosome.join(', ')} | Fitness: ${parent2.fitness}</td></tr>
        <tr><td>Offspring (After Mutation)</td><td>${mutatedOffspring1.chromosome.join(', ')} | Fitness: ${mutatedOffspring1.fitness} <br> ${mutatedOffspring2.chromosome.join(', ')} | Fitness: ${mutatedOffspring2.fitness}</td></tr>
        <tr><td>Best Fitness Value</td><td><strong>${BestFitnes}</strong></td></tr>
        <tr><td>BestFitnesofround</td><td><strong>${BestFitnesofround}</strong></td></tr>
        <tr><td>BestRound</td><td><strong>${Bestround}</strong></td></tr>
    </table>`;
}