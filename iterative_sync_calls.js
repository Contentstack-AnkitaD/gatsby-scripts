const { exec } = require('child_process');
const fs = require('fs');

// Initialize counters
let passCount = 0;
let failCount = 0;
let totalRuns = 0;

// Log file
const logFile = 'pella_script_logs.txt';

// Create or clear the log filecl
fs.writeFileSync(logFile, '', 'utf-8');

// Number of iterations
const iterations = 10;

// Function to remove terminal escape sequences
const cleanOutput = (output) => {
    return output.replace(
        // Match all escape sequences
        /[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nq-uy=><]/g,
        ''
    );
};

const runCommands = async (iteration) => {
    if (iteration > iterations) {
        // Output the results
        const results = `Total runs: ${totalRuns}\nPass count: ${passCount}\nFail count: ${failCount}\n`;
        fs.appendFileSync(logFile, results, 'utf-8');
        console.log(results);
        return;
    }

    const dateTime = new Date().toISOString();
    const iterationInfo = `\n**Run #${iteration} - ${dateTime}**\n`;

    fs.appendFileSync(logFile, iterationInfo, 'utf-8');
    console.log(iterationInfo);

    // Run the command and wait for it to complete
    const output = await new Promise((resolve, reject) => {
        exec('npm run clean && node testsynccalls.js', { maxBuffer: 1024 * 1024 * 10 }, (error, stdout, stderr) => {
            if (error) {
                reject(error);
                return;
            }
            let output = stdout + stderr;
            output = cleanOutput(output);
            resolve(output);
        });
    });

    fs.appendFileSync(logFile, output, 'utf-8');

    if (output.includes('final items.')) {
        passCount++;
        const passMessage = `Run #${iteration} passed.`;
        console.log(passMessage);
        fs.appendFileSync(logFile, passMessage + '\n', 'utf-8');
    } else {
        failCount++;
        const failMessage = `Run #${iteration} failed.`;
        console.log(failMessage);
        fs.appendFileSync(logFile, failMessage + '\n', 'utf-8');
    }

    totalRuns++;
    runCommands(iteration + 1);
};

// Start the process
runCommands(1);
