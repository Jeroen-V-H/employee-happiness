;(() => {
	'use strict';

	// tell jshint about globals (they should remain commented out)
	/* globals zup */ //Tell jshint zup exists as global var


	const graphElm = document.getElementById('graph');
	const width = graphElm.clientWidth;
	const height = graphElm.clientHeight;
	const forceStrength = 0.1;
	const simulationDuration = 2000;

	// const dataFolder = 'data/team-dotnet/',
	const dataFolder = 'data/team-amersforce/';
	const dataFileUrlStart = dataFolder + 'Weekly happiness form ';
	const dataFileUrlEnd = ' (Responses).csv';
	
	let employeeEmails = [];// will contain all employees' email (without tld)
	let employees = [];
	let selectedEmployees = [];
	let weekDatasets = [];
	let periodQuestions = [],
		periodAnswerTimer,
		currWeekNumber;
	let currPeriodIdx = -1;
	let prevPeriodIdx = 0;
	let totalPeriods = 0;

	let sheetHelper;

	// https://gka.github.io/palettes/#colors=#fc0,green|steps=4|bez=1|coL=1
	// https://gka.github.io/palettes/#colors=#c00,#fc0|steps=4|bez=1|coL=1
	const colors = ['#cc0000','#cc0000','#cc0000','#e06000','#f19800','#ffcc00','#b9b400','#709b00','#008000'];
	// add subjective scores for different degrees of hapiness and business
	const happinessScores = [-4, -2, 0, 1, 2];
	const businessScores = [-2, -1, 0, -1, -2];
	const minHappinessScore = Math.min(...happinessScores);
	const maxHappinessScore = Math.max(...happinessScores);
	const minBusinessScore = Math.min(...businessScores);
	const maxBusinessScore = Math.max(...businessScores);
	const minHealthScore = minHappinessScore + minBusinessScore;
	const maxHealthScore = maxHappinessScore + maxBusinessScore;
	const happinessScale = d3.scaleLinear().domain([1, 5]).range([0, width]);
	const businessScale = d3.scaleLinear().domain([1, 5]).range([height, 0]);

	const teamSelector = document.getElementById('team-selector');
	const teamAllId = 'all';
	const teams = {
			etrade: {
				name: 'Heineken eTrade',
				employeeEmails: [
					'andrey.andreychenko@valtech.nl',
					'anton.zelentsov@valtech.nl',
					'barry.van.oven@valtech.nl',
					'diederik.van.egmond@valtech.nl',
					'dimitrios.androutsos@valtech.nl',
					'elise.puijk@valtech.nl',
					'frank.van.lith@valtech.nl',
					'jeroen.van.haperen@valtech.nl',
					'jorian.pieneman@valtech.nl',
					'juancarlos.muro@valtech.nl',
					'lilia.silvestrova@valtech.nl',
					'max.de.rooij@valtech.nl',
					'milou.van.kooij@valtech.nl',
					'reinoud.van.dalen@valtech.nl',
					'ruud.volkers@valtech.nl',
					'stefan.kuiper@valtech.nl'
				]
			},
			all: {
				name: 'Amersforce'
			},
		};
	const formerEmployeeEmails = [
			'hylco.douwes@valtech.nl',
			'john.beitler@valtech.nl'
		];

	let simulationTimer,
		employeeNodes,
		prevMoodNodes;
	let nodeRadius = 25;// will be calculated by js
	let nodeDistance = 3;

	let graph = d3.select('#graph')
			.attr('width', width)
			.attr('height', height);

	// define force functions
	const forceXHappiness = d3.forceX(function(d) {
		return happinessScale(d.periods[currPeriodIdx].happiness);
	}).strength(forceStrength);

	const forceYBusiness = d3.forceY(function(d) {
		return businessScale(d.periods[currPeriodIdx].business);
	}).strength(forceStrength);

	const forceXCombined = d3.forceX(width / 2).strength(forceStrength);
	const forceYCombined = d3.forceY(height / 2).strength(forceStrength);

	const forceCollide = d3.forceCollide(function(d) {
			return nodeRadius + nodeDistance;
		});

	let simulation = d3.forceSimulation()
		.force('forceX', forceXCombined)
		.force('forceY', forceYCombined)
		.force('collide', forceCollide);



	/**
	* strip top level domain of of email (to prevent false duplicates from .com and .nl addresses)
	* @param {string} email
	* @returns {string} the stripped email
	*/
	const getEmailWithoutTld = function(email) {
		const regex = /(.+)@([^\.]+)/;
		const matches = email.match(regex);

		if (matches) {
			email = matches[1] + '@' + matches[2];
		}
		return email;
	};
	

	/**
	* get employee's initials
	* @returns {undefined}
	*/
	const getInitials = function(email) {
		const parts = email.split('@')[0].split('.');
		const nonCaps = [
				'de', 'den', 'der', 'van', 'op', 't', 'vande', 'vanden', 'vander', 'opt'
			];
		let initials = '';

		parts.forEach((part) => {
			let char = part.charAt(0).toLowerCase();
			if (nonCaps.indexOf(part) === -1) {
				char = char.toUpperCase();
			}
			initials += char;
		});

		return initials;
	};



	/**
	* get an employee's health score
	* @returns {undefined}
	*/
	const calculateHealthScore = function(happiness, business) {
		const happinessScore = happinessScores[happiness -1];
		const businessScore = businessScores[business -1];
		const healthScore = happinessScore + businessScore;

		return healthScore;
	};
	


	/**
	* 
	* @returns {undefined}
	*/
	const setHealthColors = function() {
		employeeNodes.style('background', function(d) {
			const periodHealthScore = d.periods[currPeriodIdx].health;

			// minHealthScore should have colorIdx 0
			const colorIdx = periodHealthScore - minHealthScore;
			return colors[colorIdx];
		})
		.style('color', function(d) {
			const periodHealthScore = d.periods[currPeriodIdx].health;

			// minHealthScore should have colorIdx 0
			const colorIdx = periodHealthScore - minHealthScore;
			return colors[colorIdx];
		});
	};



	/**
	* set how recent an entry is
	* @returns {undefined}
	*/
	const setRecentness = function() {
		employeeNodes.classed('not-from-this-week', (d) => {
			return (!d.periods[currPeriodIdx].isFromThisWeek);
		});
	};



	/**
	* 
	* @returns {undefined}
	*/
	const changeWeek = function(increment = 0) {
		const newPeriodIdx = currPeriodIdx + increment;
		if (newPeriodIdx >= 0 && newPeriodIdx < totalPeriods) {
			prevPeriodIdx = currPeriodIdx;
			currPeriodIdx = newPeriodIdx;
		}
		if (newPeriodIdx < 0) {
			// we start at -1 to make first call to show next show the first period
			currPeriodIdx = 0;
		}
		prevPeriodIdx = Math.max(0, prevPeriodIdx);
		currWeekNumber = weekDatasets[currPeriodIdx].weekNr;


		setHealthColors();
		setRecentness();
		showPeriodAnswers();
		updateWeekDisplay();

		// remove mood traces
		graphElm.querySelectorAll('.mood-trace').forEach((traceElm) => {
			graphElm.removeChild(traceElm);
		});

		simulation
			.force('forceX', forceXHappiness)
			.force('forceY', forceYBusiness)
			.alphaTarget(0.5)
			.restart();
		scheduleSimulationStop();
	};

	/**
	* update current week display
	* @returns {undefined}
	*/
	const updateWeekDisplay = function() {
		const prevElm = document.getElementById('show-prev-period');
		const nextElm = document.getElementById('show-next-period');
		if (currPeriodIdx === 0) {
			prevElm.setAttribute('disabled', 'disabled');
		} else {
			prevElm.removeAttribute('disabled');
		}

		if (currPeriodIdx === totalPeriods-1) {
			nextElm.setAttribute('disabled', 'disabled');
		} else {
			nextElm.removeAttribute('disabled');
		}

		const fdow = weekDatasets[currPeriodIdx].firstDayOfWeek;
		const day = fdow.toLocaleString('en-us', { weekday: 'long'});
		const month = fdow.toLocaleString('en-us', { month: 'long'});

		document.getElementById('first-day__name').textContent = day;
		document.getElementById('first-day__date').textContent = fdow.getDate();
		document.getElementById('first-day__month').textContent = month;
		document.getElementById('week-number__value').textContent = currWeekNumber;
	};
	
	


	/**
	* get the object for the team average; create it if it doesn't exist yet
	* @returns {object} object like employee-object
	*/
	const getAverageObject = function() {
		const avgString = 'team-average';
		let avgObj;
		let avgIndex = employeeEmails.indexOf(avgString);

		if (avgIndex === -1) {
			avgObj = {
				email: '',
				name: 'Team Average',
				initials: 'AVG',
				periods: [],
				isAVGObject: true
			};
			employees.push(avgObj);
			employeeEmails.push(avgString);
			avgIndex = employees.length -1;
		}
		avgObj = employees[avgIndex];

		return avgObj;
	};



	/**
	* for new employees, add dummy moods for the periods where they weren't present yet
	* @returns {undefined}
	*/
	const addNewEmployeeDummyMoods = function(employee, mood, weekIdx) {
		const dummyMood = Object.assign({}, mood, { isFromThisWeek: false});
		for (let i=0; i<weekIdx; i++) {
			employee.periods.push(dummyMood);
		}
	};



	/**
	* add moods for employees that already have an entry, but are not in the current period
	* @returns {undefined}
	*/
	const addMissingEmployeeMoods = function(dataset, weekIdx) {
		employees.forEach((employee) => {
			const periods = employee.periods;
			const periodCount = periods.length;

			if (periodCount <= weekIdx) {
				// we're missing periods; take the last known mood as reference
				const dummyMood = Object.assign({}, periods[periodCount-1], {isFromThisWeek: false});
				for (let i=periodCount; i <= weekIdx; i++) {
					periods.push(dummyMood);
				}
			}
		});
	};


	
	/**
	* 
	* @returns {undefined}
	*/
	const calculateWeekAverageMood = function(weekData, teamHappiness, teamBusiness, teamHealth) {
		const avgObj = getAverageObject();
		const numEntries = weekData.data.length;
		let mood;

		if (numEntries > 0) {
			mood = {
				happiness: (teamHappiness/numEntries).toFixed(1),
				business: (teamBusiness/numEntries).toFixed(1),
				health: (teamHealth/numEntries).toFixed(1),
				isFromThisWeek: true
			};
		} else {
			mood = {
				happiness: 3,
				business: 3,
				health: 0,
			};
		}

		// we don't want avarage object to change color
		// health colors are an integer, and that integer is used as index on color array
		// by adding 0.01, avg health will never match an item in the color array
		mood.health += 0.01;
		avgObj.periods.push(mood);
	};
	

	/**
	* get mapping from questions to sheet columns
	* @returns {undefined}
	*/
	const getFieldMapping = function() {
		const fields = {
			timestamp: 0,
			email: 1,
			name: 2,
			happiness: 3,
			business: 4,
			otherQuestion: 5
		};

		return fields;
	};
	
	

	/**
	* process dataset of 1 period
	* @param {object} weekData - Current week's data {weekNr, data}
	* @param {number} weekIdx - Index of this week in weekDatasets (useful for tracking how many weeks have been processed)
	* @returns {undefined}
	*/
	const processWeekData = function(weekData, weekIdx) {
		// map column numbers to vars
		const fields = getFieldMapping();

		let teamHappiness = 0;
		let teamBusiness = 0;
		let teamHealth = 0;

		// USE ONLY REMARK HERE NOW
		const periodQuestion = {
			// question: fields.otherQuestion,
			question: 'this week\'s remarks:',
			answers: []
		};

		let rowCounter = 0;
		weekData.data.forEach((employeeRow) => {
			rowCounter++;
			const email = employeeRow[fields.email].toLowerCase();
			const emailWithoutTld = getEmailWithoutTld(email);
			let employee;
			let isNewlyAdded = false;

			//check if employee is already in employees-array
			// d3 works easier with normal arrays than with associative ones, so I can't use email as array-index
			let employeeIndex = employeeEmails.indexOf(email);
			if (employeeIndex === -1) {
				// add new employee to array
				employee = {
					email: email,
					name: employeeRow[fields.name],
					initials: getInitials(email),
					periods: []
				};
				employees.push(employee);
				employeeEmails.push(email);// this way, index in emails array corresponds with the one in employees array
				employeeIndex = employees.length -1;
				isNewlyAdded = true;
			}

			// now do stuff for both just and previously added employees
			employee = employees[employeeIndex];

			const happiness = +employeeRow[fields.happiness];
			const business = +employeeRow[fields.business];
			const health = calculateHealthScore(happiness, business);
			const answer = employeeRow[fields.otherQuestion];
			const mood = {
					happiness,
					business,
					health,
					otherQuestion: {
						question: fields.otherQuestion,
						answer
					},
					isFromThisWeek: true
				};

			// I'm still assuming that every employee is present in every period.
			// so we need to add a dummy-mood for new employees for all past weeks
			if (isNewlyAdded) {
				addNewEmployeeDummyMoods(employee, mood, weekIdx);
			}
			employee.periods.push(mood);

			if (answer) {
				periodQuestion.answers.push(answer);
			}

			teamHappiness += happiness;
			teamBusiness += business;
			teamHealth += health;
		});

		periodQuestions.push(periodQuestion);

		calculateWeekAverageMood(weekData, teamHappiness, teamBusiness, teamHealth);

		// add moods for employees that were in previous periods, but not in this one
		addMissingEmployeeMoods(weekData, weekIdx);
	};
	


	/**
	* divide sheet data in array per week
	* @returns {array}
	*/
	const divideDataIntoWeeks = function(data) {
		let lastWeekNr;
		let weekData;

		data.forEach((row) => {
			const { weekNr, firstDayOfWeek } = getRowWeekDateInfo(row);

			if (!lastWeekNr || weekNr !== lastWeekNr) {
				// first row for this week
				weekData = {
					weekNr,
					firstDayOfWeek,
					data: []
				};
				weekDatasets.push(weekData);
				lastWeekNr = weekNr;
			}
			weekData.data.push(row);
		});

		return weekDatasets;
	};


	/**
	* populate teams with employees
	* @returns {undefined}
	*/
	const populateTeams = function() {
		for(const [teamId, team] of Object.entries(teams)) {
			if (teamId === teamAllId) {
				team.employees = employees;
			} else {
				team.employees = employees.filter((emp) => team.employeeEmails.includes(emp.email));
			}
		};
	};

	/**
	* get the currently selected team
	* @returns {undefined}
	*/
	const getCurrentTeam = function() {
		const teamIdx = teamSelector.value;
		return teams[teamIdx];
	};
	
	
	

	/**
	* process the data so we can use it
	* @returns {undefined}
	*/
	const processData = function(data) {
		const weekDatasets = divideDataIntoWeeks(data);
		// console.log('weekDatasets:', weekDatasets);
		totalPeriods = weekDatasets.length;
		setWeek();
		
		weekDatasets.forEach((weekData, weekIdx) => {
			processWeekData(weekData, weekIdx);
		});

		populateTeams();
	};



	/**
	* show an employee's detail info
	* @returns {undefined}
	* @param {d3 selection} employee - The employee's object
	*/
	const showEmployeeDetails = function(employee) {
		// const email = d[d.column] employeeIndex = employeeEmails.indexOf(email);
		console.log(employee);
	};
	


	/**
	* handle simulation tic
	* @returns {undefined}
	*/
	const tickHandler = function(node) {
		node.style('left', function(d) {
				return d.x + 'px';
			})
			.style('top', function(d) {
				return d.y + 'px';
			})
	};



	/**
	* show trace indicating previous period's mood
	* @returns {undefined}
	*/
	const showMoodTrace = function() {
		if (currPeriodIdx >= 0 && currPeriodIdx !== prevPeriodIdx) {
			graphElm.querySelectorAll('.employee-node').forEach((elm, i) => {
				const data = elm.__data__;
				const currMood = data.periods[currPeriodIdx];

				if (currMood.isFromThisWeek) {
					const prevMood = data.periods[prevPeriodIdx];

					// if happiness or business has changed, show trace
					if (prevMood.happiness !== currMood.happiness || prevMood.business !== currMood.business) {

						// add moodtrace element
						const traceElm = document.createElement('div');
						traceElm.classList.add('mood-trace');

						//
						const currLeft = parseInt(elm.style.left, 10);
						const currTop = parseInt(elm.style.top, 10);
						const prevLeft = happinessScale(prevMood.happiness);
						const prevTop = businessScale(prevMood.business);
						const dx = prevLeft - currLeft;// distance from curr to prev
						const dy = prevTop - currTop;
						const length = Math.sqrt(dx*dx + dy*dy);
						const alphaRadians = Math.atan(dy/dx);

						let alpha = alphaRadians * 180/Math.PI;
						if (dx < 0) {
							alpha += 180;
						}

						const changedStyle = {
							left: currLeft + 'px',
							top: currTop + 'px',
							color: elm.style.color,
							borderLeftWidth: length + 'px',
							transform: 'translate(0, -50%) rotate('+alpha+'deg)'// use this with height
						};
						Object.assign(traceElm.style, changedStyle);

						graphElm.appendChild(traceElm);
					}
				}
			});
		}
	};



	/**
	* show a new answer to this period's question
	* @returns {undefined}
	*/
	const showNewPeriodAnswer = function() {
		clearTimeout(periodAnswerTimer);
		const answers = periodQuestions[currPeriodIdx].answers;
		const answer = answers[Math.floor(answers.length*Math.random())];

		document.getElementById('period-answer').textContent = answer;
		periodAnswerTimer = setTimeout(showNewPeriodAnswer, 8000);
	};
	

	
	/**
	* show answers for current period
	* @returns {undefined}
	*/
	const showPeriodAnswers = function() {
		const answerBox = document.getElementById('period-remarks-box');
		const questions = periodQuestions[currPeriodIdx];
		const activeClass = 'period-remarks-box--is-visible';

		if (questions.answers.length) {
			answerBox.classList.add(activeClass);
		} else {
			answerBox.classList.remove(activeClass);
		}
			
		document.getElementById('period-question').textContent = questions.question;
		showNewPeriodAnswer();
	};



	/**
	* schedule the stopping of the animation
	* @returns {undefined}
	*/
	const scheduleSimulationStop = function() {
		clearTimeout(simulationTimer);
		simulationTimer = setTimeout(() => {
			simulation.stop();
			showMoodTrace();
		}, simulationDuration);
	};
	
	

	/**
	* draw the actual graph
	* @returns {undefined}
	*/
	const drawGraph = function() {
		// add shapes
		selectedEmployees = getCurrentTeam().employees;
		// selectedEmployees = teams['etrade'].employees;
		employeeNodes = graph.selectAll('.employee-node')
			.data(selectedEmployees)
			.enter()
			.append('div')
			.attr('data-initials', d => d.initials)
			.attr('data-happiness', (d) => {
				const firstPeriod = d.periods[0];
				return firstPeriod.happiness;
			})
			.attr('data-business', (d) => {
				const firstPeriod = d.periods[0];
				return firstPeriod.business;
			})
			.attr('title', d => d.name)
			.attr('class', 'employee-node')
			.on('click', showEmployeeDetails)

		// now that we have nodes on screen, we can check their dimensions
		let typicalNode = graph.select('.employee-node:first-child').node();

		nodeRadius = typicalNode.getBoundingClientRect().width/2;
		nodeDistance = nodeRadius * 0.05;

		simulation.nodes(selectedEmployees)
			.on('tick', () => { tickHandler(employeeNodes) });
		scheduleSimulationStop();
		setTimeout(() => {changeWeek(+1);}, 1000);
	};

	/**
	* 
	* @returns {undefined}
	*/
	const changeTeam = function(elm) {
		// const teamIdx = parseInt(elm.currentTarget.value, 10);
		document.getElementById('graph').innerHTML = '';
		drawGraph();
	};
	
	


	/**
	* initialize interface
	* @returns {undefined}
	*/
	const initInterface = function() {
		// initButtons
		d3.select('#show-next-period').on('click', function() {
			changeWeek(+1);
		});

		d3.select('#show-prev-period').on('click', function() {
			changeWeek(-1);
		});

		// init team selector
		const teamsArr = Object.entries(teams);
		for (const [teamId, team] of Object.entries(teams)) {
			let option = document.createElement('option');
			option.textContent = team.name;
			option.value = teamId;
			teamSelector.appendChild(option);
		};
		teamSelector.addEventListener('change', changeTeam);
	};



	/**
	* set the current week
	* @returns {undefined}
	*/
	const setWeek = function() {
		currPeriodIdx = totalPeriods - 2;// we'll call changeWeek(+1) 1sec in the script
		prevPeriodIdx = Math.max(currPeriodIdx -1, 0);
	};
	
	

	//-- Start helper functions

		/**
		* calculate iso week number
		* found at https://stackoverflow.com/questions/6117814/get-week-of-year-in-javascript-like-in-php
		* @param {Date} d - Date for which to calculate week number
		* @returns {array} array containing year and number
		*/
		const getWeekNumber = function(d) {
			// Copy date so don't modify original
			d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
			// Set to nearest Thursday: current date + 4 - current day number
			// Make Sunday's day number 7
			d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay()||7));
			// Get first day of year
			var yearStart = new Date(Date.UTC(d.getUTCFullYear(),0,1));
			// Calculate full weeks to nearest Thursday
			var weekNo = Math.ceil(( ( (d - yearStart) / 86400000) + 1)/7);
			// Return array of year and week number
			return [d.getUTCFullYear(), weekNo];
		}


		/**
		* get the week number for an entry in the sheet
		* @param {array} row - A row in the sheet
		* @returns {number}
		*/
		const getRowWeekDateInfo = function(row) {
			// date info in sheet has format dd/mm/yyyy hh:mm:ss
			// don't rely on Date to parse that correctly
			const tmStr = row[0];
			const day = parseInt(tmStr.substr(0, 2), 10);
			const month = parseInt(tmStr.substr(3, 2), 10) -1;
			const year = parseInt(tmStr.substr(6, 4), 10);
			const tm = new Date(year, month, day);
			const weekNr = getWeekNumber(tm)[1];
			const firstDayOfWeek = getDateOfISOWeek(weekNr, year);

			return {
				weekNr,
				firstDayOfWeek
			};
		};


		/**
		* get 1st day of week by week number
		* https://stackoverflow.com/questions/16590500/javascript-calculate-date-from-week-number
		* @returns {Date}
		* @param {number} weekNr - the week number
		* @param {number} year
		*/
		function getDateOfISOWeek(weekNr, year) {
			var simple = new Date(year, 0, 1 + (weekNr - 1) * 7);
			var dayOfWeek = simple.getDay();
			var ISOweekStart = simple;
			if (dayOfWeek <= 4) {
				ISOweekStart.setDate(simple.getDate() - simple.getDay() + 1);
			} else {
				ISOweekStart.setDate(simple.getDate() + 8 - simple.getDay());
			}
			return ISOweekStart;
		}
		

	//-- End helper functions


	//-- Start google sheets stuff


		/**
		* read data from the sheet
		* @returns {undefined}
		*/
		const readData = function() {
			const sheetTabName = 'Team happiness responses';
			const cellRange = 'A2:G';// all columns, skip 1st row with titles
			const range = "'" + sheetTabName + "'!" + cellRange;// range in a1 notation https://developers.google.com/sheets/api/guides/concepts#a1_notation

			const options = {
				spreadsheetId: '1K4YbGsCSSIJhB0nYArs0XouoOqT1xGyM2KWOdny-tLs',
				range
			};
		
			// get data in promise
			sheetHelper.getData(options)
			.then((result) => {
				const data = result.values;
				processData(data);
				initInterface();
				drawGraph();
			})
		};
		
		
		/**
		* get data from google sheet
		* @returns {undefined}
		*/
		const getSheetHelper = function() {
			// use api key etc from window.secretStuff (which is not in version control)
			const sheetOptions = {
				CLIENT_ID: window.secretStuff.CLIENT_ID,
				API_KEY: window.secretStuff.API_KEY
			};
		
			sheetHelper = window.createGoogleSheetsHelper(sheetOptions);
		};
		
		
	//-- End google sheets stuff



	/**
	* initialize all functionality
	* @returns {undefined}
	*/
	const init = function() {
		document.body.addEventListener('googlesheethelperenabled', readData);
		getSheetHelper();
	};



	// kick of the script when all dom content has loaded
	document.addEventListener('DOMContentLoaded', init);

})();

