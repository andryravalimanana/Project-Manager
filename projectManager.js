// Copyright (C) 2019 Andry RAVALIMANANA
// 
// projectManager is free software: you can redistribute it and/or modify
// it under the terms of the GNU Lesser General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
// 
// projectManager is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU Lesser General Public License for more details.
// 
// You should have received a copy of the GNU Lesser General Public License
// along with projectManager. If not, see <http://www.gnu.org/licenses/>.

const readline = require('readline');
var fs = require('fs');
var { execSync } = require('child_process');
var exec = require('child_process').exec;
var monthArray = ["JANVIER", "FEVRIER", "MARS", "AVRIL", "MAI", "JUIN", "JUILLET", "AOUT", "SEPTEMBRE", "OCTOBRE", "NOVEMBRE", "DECEMBRE"];
var days = ["LUNDI", "MARDI", "MERCREDI", "JEUDI", "VENDREDI", "SAMEDI", "DIMANCHE"];
var dayDate = {};
var tasks = [];
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

/**
 * Just an helper to display avalable commande line
 */
function helpMessage() {
    console.log("-t: Generate todo list\n" +
        "-a: Archive project\n" +
        "-r: Generate routine\n" +
        "-f: Format tasks\n" +
        "-h: Helps\n"
    );
}

//+------------------------------------------------------------+
// FILE NAME CONFIGURATION
//+------------------------------------------------------------+
var fileProject = "/home/andry/Yandex.Disk/Planning/project_2019.md";
var fileTask = "/home/andry/Yandex.Disk/Planning/task_2019.md";
var routineFile = "/home/andry/Yandex.Disk/Planning/Routine.assets/routines.json"

//+------------------------------------------------------------+
// GENERATE TODOLIST
//+------------------------------------------------------------+

/**
 * Main function to generate todoList from json data
 */
function generateToDoList() {
    parseProjectContents();
}

/**
 * Parse raw project contents
 */
function parseProjectContents() {
    var weekTasks = [];
    fs.readFile(fileProject, 'utf8', function (err, contents) {
        var rawContents = contents.match(/- \[( |x)\] <u>(.*?)<\/u>/g);
        // Change <u> to bold
        // Insert key id
        if (rawContents)
            rawContents.forEach((el) => {
                var rawProjectTitle = contents.match(/#### (.*?)\n[^####]*<\/u>/g);
                var title = getProjectTitle(rawProjectTitle[0]);
                var temp = "";
                temp = el.replace('<u>', '**');
                temp = temp.replace('</u>', '**');
                temp = insertMetadata(temp, title);
                weekTasks.push(temp);
            });
        writeIntoTodoListTask(weekTasks);
        updateTaskStatusInProject(weekTasks, rawContents);
    });
}


/**
 * Get project title from raw data
 * @param  {} rawProject raw project data
 */
function getProjectTitle(rawProject) {
    var t = rawProject.match(/#### (.*?)\n/g)[0];
    t = t.replace("#### ", "");
    t = t.replace("\n", "");
    return t;
}

/**
 * Insert key id to each task
 * @param  {} task task instance
 */
function insertKeyId(task) {
    var keyId = uuidv4();
    task = task.replace('- [ ] ', '- [ ] _[@](' + keyId + ')');
    return task;
}

/**
 * Insert metadata to each task instance
 * @param  {} task task instance
 * @param  {} projectTitle Title of the project
 */
function insertMetadata(task, projectTitle) {
    task = task.replace('- [ ] ', '- [ ] ' + projectTitle + ' | ');
    return task;
}

/**
 * generate uuidv4 unique code
 */
function uuidv4() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

/**
 * Add weekly task in task stack if there is in json file
 * @param  {} weekTasks weekly tasks list
 */
function writeIntoTodoListTask(weekTasks) {
    var taskSrt = "#### TODOLIST\n";
    weekTasks.forEach((el) => {
        taskSrt += el.replace(/\*{2}/g, '');
        taskSrt += "\n";
    });
    fs.readFile(fileTask, 'utf8', function (err, contents) {
        contents = contents.replace(/#### TODOLIST(.*?)\n/g, taskSrt);
        fs.writeFile(fileTask, contents, 'utf8', function (err) {
            if (err) return console.log(err);
        });
    });
}

/**
 * Update task status in project: In progress, done, not started.
 * @param  {} weekTasks weekly tasks list
 * @param  {} rawContents task raw data
 */
function updateTaskStatusInProject(weekTasks, rawContents) {
    fs.readFile(fileProject, 'utf8', function (err, contents) {
        /*
        for (let index = 0; index < weekTasks.length; index++) {
            const element = weekTasks[index];
            const re = new RegExp("\n(.*?)" + rawContents[index].replace(/[\-\[\]{}()*+?.,\\\^$|#\s]/g, "\\$&"));
            contents = contents.replace(re, "");
        }
        */
        contents = contents.replace(/\<u\>/g, '**');
        contents = contents.replace(/\<\/u\>/g, '**');
        fs.writeFile(fileProject, contents, 'utf8', function (err) {
            if (err) return console.log(err);
        });
    });
}

//+------------------------------------------------------------+
// UPDATE TASK STATUS
//+------------------------------------------------------------+

/**
 * Update task status: In progress, done, not started.
 */
function updateTaskStatus() {
    var taskContent = "";
    fs.readFile(fileTask, 'utf8', function (err, contents) {
        taskContent = contents;
    });
    fs.readFile(fileProject, 'utf8', function (err, contents) {
        var rawContents = contents.match(/- \[( |x)\] _\[@\]\((.*?)\n/g);
        rawContents.forEach((el) => {
            var code = getCode(el);
            var re = new RegExp("- \\[( |x)\\] " + code.replace(/[\-\[\]{}()*+?.,\\\^$|#\s]/g, "\\$&") + "(.*?)\\n", "g");
            var taskStatus = taskContent.match(re);
            if (taskStatus) contents = contents.replace(el, taskStatus[0]);
        });
        fs.writeFile(fileProject, contents, 'utf8', function (err) {
            if (err) return console.log(err);
        });
    });
}

/**
 * get element code
 * @param  {} element element code
 */
function getCode(element) {
    return element.match(/_\[@\]\((.*?)\)/g)[0];
}

//+------------------------------------------------------------+
// SORT PROJECT
//+------------------------------------------------------------+

/**
 * Sort list project
 */
function sortProject() {
    let raw = execSync('xclip -out -selection clipboard');
    let contents = raw.toString();
    var rawContents = contents.match(/- \[( |x)\] (.*?)\n/g);
    // Create object for sorting
    // let build const int first
    const NORMAL = 1;
    const SELECTED = 2;
    const DONE = 3;

    console.log(rawContents);
}

//+------------------------------------------------------------+
// ARCHIVE PROJECT
//+------------------------------------------------------------+

/**
 * Achive prject in cloud
 */
function ArchiveProject() {
    let raw = execSync('xclip -out -selection clipboard');
    let contents = raw.toString();
    var rawContents = contents.match(/- \[( |x)\] (.*?)\n/g);
    getallDate(contents);
    formatTaskForArchiving(contents);
    let msg = "=============================================================================================\n";
    msg += "AZA ADINO MIJERY NY PROJET SAO DE MBOLA TSY CREER\n";
    msg += "IN-1 ISAK'HERINANDRO IHANY NO MANAO BACKUP FA LASA MIVERINA IN-2 LE IZY\n";
    msg += "=============================================================================================\n";
    fs.writeFile(".temp", msg + tasks.join("\n"), 'utf-8', function (err) {
        execSync('subl .temp');
        if (err) return console.log(err);
    });
    tasks = [];
}

/**
 * Get all active date
 * @param  {} contents markdown file contents
 */
function getallDate(contents) {
    let day = 0;
    let month = 0;
    let years = 0;
    var rawDate = contents.match(/### \d{1,2} \w+ \d{4}/g);
    rawDate ? rawDate = rawDate[0] : [];
    // Get day
    var re = rawDate.match(/### \d{2}/);
    if (re) day = re.toString().replace("### ", "");
    // Get Month
    re = rawDate.match(/\d{1,2} \w* /)
    if (re) {
        var monthStr = re.toString().replace(/\d{1,2} /, "").replace(" ", "");
        month = monthArray.indexOf(monthStr) + 1;
    }
    // Get years
    years = rawDate.match(/\d{4}/).toString()
    // Get date
    currentDate = [years, month, day];
    days.forEach(d => {
        dayDate[d] = currentDate[0] + '-' + ('0' + currentDate[1]).slice(-2) + '-' + ('0' + currentDate[2]).slice(-2) + ' ' + '18:00:00';
        currentDate = getNextDate(currentDate);
    });
}

/**
 * Get nextdate from current date
 * @param  {} currentDate current date
 */
function getNextDate(currentDate) {
    var currentDateObj = new Date(currentDate.join("-"));
    currentDateObj.setDate(currentDateObj.getDate() + 1);
    currentDate = [currentDateObj.getFullYear(), currentDateObj.getMonth() + 1, currentDateObj.getDate()];
    return currentDate;
}

/**
 * Format task for archiving
 * @param  {} contents task contents
 */
function formatTaskForArchiving(contents) {
    days.forEach(day => {
        var re = new RegExp("#### " + day + "\\n[^####]*#{1,}");
        var rawContent = contents.match(re).toString();
        getTasksFrom(day, rawContent);
    });
}

/**
 * Get all task by day
 * @param  {} day given date
 * @param  {} rawContent raw content task data
 */
function getTasksFrom(day, rawContent) {
    let task = rawContent.match(/- \[x\] (.*?)\n/g);
    if (task) {
        task.forEach((el) => {
            el = el.replace(/- \[x\] /g, 'life -t -a "#');
            el = el.replace(/\n/g, "");
            el = el + " | " + dayDate[day] + '"';
            tasks.push(el);
        });
    }
}

//+------------------------------------------------------------+
// FORMAT TASKS
//+------------------------------------------------------------+

/**
 * Format task
 */
function formatTask() {
    var tasks = "";
    var oldTasks = "- [ ] "; // Add space in beginning
    let raw = execSync('xclip -out -selection primary');
    let contents = raw.toString() + "\n\n";
    var rawContents = contents.match(/(.*?)\n\n/g);
    // Get title
    var rawTitle = rawContents[0];
    if (rawTitle) {
        rawTitle = rawTitle.replace(/\n/g, "");
        rawContents.shift();
        oldTasks += rawTitle + "\n";
    }
    // Get tasks
    rawContents.forEach((el) => {
        // Remove HR
        el = el.replace(/\n/g, "");
        oldTasks += "  - [ ] " + el + "\n";
        // Create - [ ] for new tasks
        tasks += "- [ ] " + rawTitle + " | " + el + "\n";
    });
    // Replace contents
    fs.readFile(fileTask, 'utf8', function (err, contents) {
        contents = contents.replace(oldTasks, tasks);
        fs.writeFile(fileTask, contents, 'utf8', function (err) {
            if (err) return console.log(err);
        });
    });
}

//+------------------------------------------------------------+
// ROUTINE
//+------------------------------------------------------------+

/**
 * Generate weekly routine from routine json file
 */
function generateRoutine() {
    console.log("Generate routine");
    fs.readFile(routineFile, 'utf8', function (err, contents) {
        let routines = JSON.parse(contents);
        parseRoutine(routines);
    });
}
/**
 * Parse raw routine data
 * @param  {} routines routine data
 */
function parseRoutine(routines) {
     let originalRoutineData = JSON.parse(JSON.stringify(routines))
    var today = new Date();
    var tasks = '***\n### ' + today.getDay() + ' ' + monthArray[today.getMonth()] + ' ' + today.getFullYear() + '\n';

    // Add monthly task if today is lastweek of the month
    if (isLastWeek()) {
        for (let day in routines.monthly) {
            routines.weekly[day] = routines.monthly[day].concat(routines.weekly[day]);
        }
    }

    //+--------------------------------------------------------------------------+
    // Yearly routines
    //+--------------------------------------------------------------------------+
    routines.yearly.forEach(routine => {
        let routineDate = new Date(routine.month + "-" + routine.day + "-" + new Date().getFullYear());
        if (isForThisWeek(routineDate)) {
            // Get day
            var dayName = getDayName(routineDate);
            routines.weekly[dayName.toLowerCase()].unshift(routine.description + " **(YEARLY)**");
        }
    });

    //+--------------------------------------------------------------------------+
    // Add events
    //+--------------------------------------------------------------------------+
    routines.events.forEach((event, index) => {
        let eventDate = new Date(event.date);
        if (isForThisWeek(eventDate)) {
            // Get day
            var dayName = getDayName(eventDate);
            routines.weekly[dayName.toLowerCase()].unshift(event.description + " **(EVENT)**");
            originalRoutineData.events.splice(index, 1);
        }
    });

    //+--------------------------------------------------------------------------+
    // Weekly routines
    //+--------------------------------------------------------------------------+
    for (let dayName in routines.weekly) {
        // Add day name
        tasks += "#### " + dayName.toUpperCase() + "\n";
        routines.weekly[dayName].forEach(task => {
            if (task.startsWith('\t')) {
                task = task.replace('\t', '');
                tasks += "  - [ ] " + task + "\n";
            }
            if (task == '---') {
                tasks += "\n---\n";
            }
            else {
                tasks += "- [ ] " + task + "\n";
            }
        });
        tasks += "\n\n"
    }

    // Update routine.json file
    fs.readFile(routineFile, 'utf8', function (err, contents) {
        fs.writeFile(routineFile, JSON.stringify(originalRoutineData), 'utf8', function (err) {
            if (err) return console.log(err);
        });
    });

    // Update task_xxxx.md file
    fs.readFile(fileTask, 'utf8', function (err, contents) {
        contents = contents.replace(/\*\*\*\n/g, tasks);
        fs.writeFile(fileTask, contents, 'utf8', function (err) {
            if (err) return console.log(err);
        });
    });
}

/**
 * Just a helper to check if this week is the last week of the month
 */
function isLastWeek() {
    var today = new Date();
    var currentWeek = today.getMonth() + 1;
    var nextWeek = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 7);
    var nextWeekMonth = nextWeek.getMonth() + 1;
    if (nextWeekMonth == currentWeek) return false;
    else return true;
}

/**
 * Just a helper to check if this week is the last week of the month
 */
function isForThisWeek(dateToCheck) {
    var curr = new Date;
    var firstdayOfTheweek = new Date(curr.setDate(curr.getDate() - curr.getDay() + 1));
    var lastdayOfTheweek = new Date(curr.setDate(curr.getDate() - curr.getDay() + 7));
    firstdayOfTheweek.setHours(0,0,0,0);
    lastdayOfTheweek.setHours(0,0,0,0);
    if ((dateToCheck.getTime() <= lastdayOfTheweek.getTime() && dateToCheck.getTime() >= firstdayOfTheweek.getTime())) return true
    else return false;
}

/**
 * Get Day name of the week from date object
 * @param  {} date date
 */
function getDayName(date) {
    return date.getDay() === 0 ? days[6] : days[date.getDay() - 1];
}

//+--------------------------------------------------------------------------+
// Commande line params
//+--------------------------------------------------------------------------+
params = process.argv[2];

switch (params) {
    case "-h":
        helpMessage();
        process.exit(0);
        break;
    case "-t":
        console.log("====================== Todolist Generated ======================\n\n");
        generateToDoList();
        exitSystem();
        break;
    case "-a":
        console.log("====================== Project Archived ======================\n\n");
        ArchiveProject();
        exitSystem();
        break;
    case "-r":
        console.log("====================== Routine generated ======================\n\n");
        generateRoutine();
        exitSystem();
        break;
    case "-f":
        console.log("====================== Task Formated ======================\n\n");
        formatTask();
        exitSystem();
        break;
    default:
        helpMessage();
        exitSystem();
}

/**
 * Exit system
 */
function exitSystem() {
    setTimeout(() => {
        process.exit(0);
    }, 100);
}