// ;(() => {
// 	'use strict';

// 	// tell jshint about globals (they should remain commented out)
// 	/* globals zup */ //Tell jshint zup exists as global var


// 	const graphElm = document.getElementById('aframe-graph'),
// 		// width = graphElm.clientWidth,
// 		// height = graphElm.clientHeight,
// 		width = 6,
// 		height = 6,
// 		forceStrength = 0.1,
// 		simulationDuration = 2000;

// 	const firstWeekNumber = 32;// number of the first week in the data

// 	const dataFolder = 'data/',
// 		dataFileUrlStart = dataFolder + 'Weekly happiness form ',
// 		dataFileUrlEnd = ' (Responses).csv';
	
// 	let employeeEmails = [],
// 		employees = [],
// 		periodQuestions = [],
// 		periodAnswerTimer,
// 		currPeriodIdx = -1,
// 		prevPeriodIdx = 0,
// 		totalPeriods = 0;

// 	// https://gka.github.io/palettes/#colors=#fc0,green|steps=4|bez=1|coL=1
// 	// https://gka.github.io/palettes/#colors=#c00,#fc0|steps=4|bez=1|coL=1
// 	const colors = ['#cc0000','#cc0000','#cc0000','#e06000','#f19800','#ffcc00','#b9b400','#709b00','#008000'],
// 		happinessScores = [-4, -2, 0, 1, 2],
// 		businessScores = [-2, -1, 0, -1, -2],
// 		minHappinessScore = Math.min(...happinessScores),
// 		maxHappinessScore = Math.max(...happinessScores),
// 		minBusinessScore = Math.min(...businessScores),
// 		maxBusinessScore = Math.max(...businessScores),
// 		minHealthScore = minHappinessScore + minBusinessScore,
// 		maxHealthScore = maxHappinessScore + maxBusinessScore,
// 		happinessScale = d3.scaleLinear().domain([1, 5]).range([(-1*width/2), width/2]),
// 		businessScale = d3.scaleLinear().domain([1, 5]).range([-1*height/2, height/2]);

// 	let simulationTimer,
// 		employeeNodes,
// 		prevMoodNodes,
// 		// nodeRadius = width/80,
// 		nodeRadius = width/40,
// 		nodeDistance = 2,
// 		z = 0;

// 	let graph = d3.select('#aframe-graph');

// 	// define force functions
// 	const forceXHappiness = d3.forceX(function(d) {
// 		return happinessScale(d.periods[currPeriodIdx].happiness);
// 	}).strength(forceStrength);

// 	const forceYBusiness = d3.forceY(function(d) {
// 		return businessScale(d.periods[currPeriodIdx].business);
// 	}).strength(forceStrength);

// 	const forceXCombined = d3.forceX(width / 2).strength(forceStrength),
// 		forceYCombined = d3.forceY(height / 2).strength(forceStrength);

// 	const forceCollide = d3.forceCollide(function(d) {
// 			return nodeRadius + nodeDistance;
// 		});

// 	let simulation = d3.forceSimulation()
// 		.force('forceX', forceXCombined)
// 		.force('forceY', forceYCombined)
// 		.force('collide', forceCollide);



// 	/**
// 	* get employee's initials
// 	* @returns {undefined}
// 	*/
// 	const getInitials = function(email) {
// 		const parts = email.split('@')[0].split('.'),
// 			nonCaps = [
// 				'de', 'den', 'der', 'van', 'op', 't', 'vande', 'vanden', 'vander', 'opt'
// 			];
// 		let initials = '';

// 		parts.forEach((part) => {
// 			let char = part.charAt(0).toLowerCase();
// 			if (nonCaps.indexOf(part) === -1) {
// 				char = char.toUpperCase();
// 			}
// 			initials += char;
// 		});

// 		return initials;
// 	};



// 	/**
// 	* get an employee's health score
// 	* @returns {undefined}
// 	*/
// 	const calculateHealthScore = function(happiness, business) {
// 		const happinessScore = happinessScores[happiness -1],
// 			businessScore = businessScores[business -1],
// 			healthScore = happinessScore + businessScore;

// 		return healthScore;
// 	};
	


// 	/**
// 	* 
// 	* @returns {undefined}
// 	*/
// 	const setHealthColors = function() {
// 		employeeNodes.attr('color', function(d) {
// 			const periodHealthScore = d.periods[currPeriodIdx].health;

// 			// minHealthScore should have colorIdx 0
// 			const colorIdx = periodHealthScore - minHealthScore;
// 			let color = '#00bdfa';
// 			if (colorIdx === parseInt(colorIdx, 10)) {
// 				color = colors[colorIdx];
// 			}
// 			return color;
// 		});
// 	};



// 	/**
// 	* set how recent an entry is
// 	* @returns {undefined}
// 	*/
// 	const setRecentness = function() {
// 		employeeNodes.classed('not-from-this-week', (d) => {
// 			return (!d.periods[currPeriodIdx].isFromThisWeek);
// 		});
// 		employeeNodes.attr('scale', (d) => {
// 			const scale = (d.periods[currPeriodIdx].isFromThisWeek) ? {x: 1, y: 1, z: 1} : {x: 0.5, y: 0.5, z: 0.5};
// 			return scale;
// 		});
// 		employeeNodes.attr('opacity', (d) => {
// 			const opacity = (d.periods[currPeriodIdx].isFromThisWeek) ? 1 : 0.5;
// 			return opacity;
// 		});
// 	};



// 	/**
// 	* 
// 	* @returns {undefined}
// 	*/
// 	const changePeriod = function(increment = 0) {
// 			const newPeriodIdx = currPeriodIdx + increment;
// 			if (newPeriodIdx >= 0 && newPeriodIdx < totalPeriods) {
// 				prevPeriodIdx = currPeriodIdx;
// 				currPeriodIdx = newPeriodIdx;
// 			}
// 			if (newPeriodIdx < 0) {
// 				// we start at -1 to make first call to show next show the first period
// 				currPeriodIdx = 0;
// 			}
// 			prevPeriodIdx = Math.max(0, prevPeriodIdx);

// 			graphElm.querySelectorAll('.mood-trace').forEach((traceElm) => {
// 				traceElm.classList.remove('mood-trace--is-visible');
// 				traceElm.style.borderLeftWidth = 0;
// 			});

// 			if (currPeriodIdx === 0) {
// 				document.getElementById('show-prev-period').setAttribute('disabled', 'disabled');
// 			} else {
// 				document.getElementById('show-prev-period').removeAttribute('disabled');
// 			}

// 			if (currPeriodIdx === totalPeriods-1) {
// 				document.getElementById('show-next-period').setAttribute('disabled', 'disabled');
// 			} else {
// 				document.getElementById('show-next-period').removeAttribute('disabled');
// 			}

// 			setHealthColors();
// 			setRecentness();
// 			showPeriodAnswers();

// 			simulation
// 				.force('forceX', forceXHappiness)
// 				.force('forceY', forceYBusiness)
// 				.alphaTarget(0.5)
// 				.restart();
// 			scheduleSimulationStop();

// 			document.getElementById('week-number__value').setAttribute('value', firstWeekNumber + currPeriodIdx);
// 	};
	


// 	/**
// 	* create get the exact wording of the questions in this period's questionaire
// 	* wording may change; order of the topics should remain the same
// 	* @returns {object} fields with corresponding question
// 	*/
// 	const getPeriodQuestionFields = function(questions) {
// 		const fields = {
// 			timestamp: questions[0],
// 			email: questions[1],
// 			name: questions[2],
// 			happiness: questions[3],
// 			business: questions[4],
// 			otherQuestion: questions[5]
// 		};

// 		return fields;
// 	};



// 	/**
// 	* get the object for the team avarage; create it if it doesn't exist yet
// 	* @returns {object} object like employee-object
// 	*/
// 	const getAvarageObject = function() {
// 		const avgString = 'team-avarage';
// 		let avgObj,
// 			avgIndex = employeeEmails.indexOf(avgString);

// 		if (avgIndex === -1) {
// 			avgObj = {
// 				email: '',
// 				name: 'Team Avarage',
// 				initials: 'AVG',
// 				periods: []
// 			};
// 			employees.push(avgObj);
// 			employeeEmails.push(avgString);
// 			avgIndex = employees.length -1;
// 		}
// 		avgObj = employees[avgIndex];

// 		return avgObj;
// 	};



// 	/**
// 	* for new employees, add dummy moods for the periods where they weren't present yet
// 	* @returns {undefined}
// 	*/
// 	const addNewEmployeeDummyMoods = function(employee, mood, periodIdx) {
// 		const dummyMood = Object.assign({}, mood, { isFromThisWeek: false});
// 		for (let i=0; i<periodIdx; i++) {
// 			employee.periods.push(dummyMood);
// 		}
// 	};



// 	/**
// 	* add moods for employees that already have an entry, but are not in the current period
// 	* @returns {undefined}
// 	*/
// 	const addMissingEmployeeMoods = function(dataset, periodIdx) {
// 		employees.forEach((employee) => {
// 			const periods = employee.periods,
// 				periodCount = periods.length;

// 			if (periodCount <= periodIdx) {
// 				// we're missing periods; take the last known mood as reference
// 				const dummyMood = Object.assign({}, periods[periodCount-1], {isFromThisWeek: false});
// 				for (let i=periodCount; i <= periodIdx; i++) {
// 					periods.push(dummyMood);
// 				}
// 			}
// 		});
// 	};
	

// 	/**
// 	* process dataset of 1 period
// 	* @returns {undefined}
// 	*/
// 	const processPeriodData = function(dataset, periodIdx) {
// 		const fields = getPeriodQuestionFields(dataset.columns);

// 		let teamHappiness = 0,
// 			teamBusiness = 0,
// 			teamHealth = 0,

// 		periodQuestion = {
// 			question: fields.otherQuestion,
// 			answers: []
// 		};

// 		let rowCounter = 0;
// 		dataset.forEach((employeeRow) => {
// 			rowCounter++;
// 			const email = employeeRow[fields.email].toLowerCase();
// 			let employee,
// 				isNewlyAdded = false;

// 			//check if employee is already in employees-array
// 			// d3 works easier with normal arrays than with associative ones, so I can't use email as array-index
// 			let employeeIndex = employeeEmails.indexOf(email);
// 			if (employeeIndex === -1) {
// 				employee = {
// 					email: email,
// 					name: employeeRow[fields.name],
// 					initials: getInitials(email),
// 					periods: []
// 				};
// 				employees.push(employee);
// 				employeeEmails.push(email);// this way, index in emails array corresponds with the one in employees array
// 				employeeIndex = employees.length -1;
// 				isNewlyAdded = true;
// 			}

// 			// now do stuff for both just and previously added employees
// 			employee = employees[employeeIndex];

// 			const happiness = +employeeRow[fields.happiness],
// 				business = +employeeRow[fields.business],
// 				health = calculateHealthScore(happiness, business),
// 				answer = employeeRow[fields.otherQuestion],
// 				mood = {
// 					happiness,
// 					business,
// 					health,
// 					otherQuestion: {
// 						question: fields.otherQuestion,
// 						answer
// 					},
// 					isFromThisWeek: true
// 				};
// 			// I'm still assuming that every employee is present in every period.

// 			if (isNewlyAdded) {
// 				addNewEmployeeDummyMoods(employee, mood, periodIdx);
// 			}
// 			employee.periods.push(mood);

// 			if (answer) {
// 				periodQuestion.answers.push(answer);
// 			}

// 			teamHappiness += happiness;
// 			teamBusiness += business;
// 			teamHealth += health;
// 		});

// 		periodQuestions.push(periodQuestion);

// 		const avgObj = getAvarageObject(),
// 			numEntries = dataset.length;
// 		let mood;

// 		if (numEntries > 0) {
// 			mood = {
// 				happiness: (teamHappiness/numEntries).toFixed(1),
// 				business: (teamBusiness/numEntries).toFixed(1),
// 				health: (teamHealth/numEntries).toFixed(1),
// 				isFromThisWeek: true
// 			};
// 		} else {
// 			mood = {
// 				happiness: 3,
// 				business: 3,
// 				health: 0.1,// fraction makes it fail at detecting color - what we want :)
// 				isFromThisWeek: true
// 			};
// 		}
// 		avgObj.periods.push(mood);

// 		// add moods for employees that were in previous periods, but not in this one
// 		addMissingEmployeeMoods(dataset, periodIdx);
// 	};
	


// 	/**
// 	* process the data so we can use it
// 	* @returns {undefined}
// 	*/
// 	const processData = function(rawDatasetStrings) {
// 		totalPeriods = rawDatasetStrings.length;
// 		setWeek();

// 		const ssv = d3.dsvFormat(';');// define semicolon separated value parser

// 		// loop through all data
// 		rawDatasetStrings.forEach((datasetString, periodIdx) => {
// 			const dataset = ssv.parse(datasetString);
// 			processPeriodData(dataset, periodIdx);
// 		});
// 	};



// 	/**
// 	* show an employee's detail info
// 	* @returns {undefined}
// 	* @param {d3 selection} employee - The employee's object
// 	*/
// 	const showEmployeeDetails = function(employee) {
// 		// const email = d[d.column] employeeIndex = employeeEmails.indexOf(email);
// 		console.log(employee);
// 	};
	


// 	/**
// 	* handle simulation tic
// 	* @returns {undefined}
// 	*/
// 	const tickHandler = function(node) {
// 		node.attr('position', function(d) {
// 			return { x:d.x, y:d.y, z:z};
// 		});
// 	};



// 	/**
// 	* show trace indicating previous period's mood
// 	* @returns {undefined}
// 	*/
// 	const showMoodTrace = function() {
// 		if (currPeriodIdx >= 0 && currPeriodIdx !== prevPeriodIdx) {
// 			graphElm.querySelectorAll('.employee-node').forEach((elm, i) => {
// 				const data = elm.__data__,
// 					currMood = data.periods[currPeriodIdx];

// 				if (currMood.isFromThisWeek) {
// 					const traceElm = elm.querySelector('.mood-trace'),
// 						prevMood = data.periods[prevPeriodIdx];

// 					// if happiness or business has changed, show trace
// 					if (prevMood.happiness !== currMood.happiness || prevMood.business !== currMood.business) {

// 						traceElm.classList.add('mood-trace--is-visible');
// 						const currLeft = parseInt(elm.style.left, 10),
// 							currTop = parseInt(elm.style.top, 10),
// 							prevLeft = happinessScale(prevMood.happiness),
// 							prevTop = businessScale(prevMood.business),
// 							dx = prevLeft - currLeft,// distance from curr to prev
// 							dy = prevTop - currTop,
// 							length = Math.sqrt(dx*dx + dy*dy),
// 							alphaRadians = Math.atan(dy/dx);

// 						let alpha = alphaRadians * 180/Math.PI;
// 						if (dx < 0) {
// 							alpha += 180;
// 						}

// 						// traceElm.style.width = length + 'px';
// 						traceElm.style.borderLeftWidth = length + 'px';
// 						traceElm.style.transform = 'translate(0, -50%) rotate('+alpha+'deg)';
// 					}
// 				}
// 			});
// 		}
// 	};


// 	/**
// 	* show a new answer to this period's question
// 	* @returns {undefined}
// 	*/
// 	const showNewPeriodAnswer = function() {
// 		clearTimeout(periodAnswerTimer);
// 		const answers = periodQuestions[currPeriodIdx].answers,
// 			answer = answers[Math.floor(answers.length*Math.random())];

// 		document.getElementById('period-answer').textContent = answer;
// 		periodAnswerTimer = setTimeout(showNewPeriodAnswer, 5000);
// 	};
	

	
// 	/**
// 	* show answers for current period
// 	* @returns {undefined}
// 	*/
// 	const showPeriodAnswers = function() {
// 		// const answerBox = document.getElementById('period-answer'),
// 		// 	questions = periodQuestions[currPeriodIdx];
			
// 		// document.getElementById('period-question').textContent = questions.question;
// 		// showNewPeriodAnswer();
// 	};
	

	


// 	/**
// 	* schedule the stopping of the animation
// 	* @returns {undefined}
// 	*/
// 	const scheduleSimulationStop = function() {
// 		clearTimeout(simulationTimer);
// 		simulationTimer = setTimeout(() => {
// 			simulation.stop();
// 			// showMoodTrace();
// 		}, simulationDuration);
// 	};
	

// 	/**
// 	* draw the actual graph
// 	* @returns {undefined}
// 	*/
// 	const drawVRGraph = function() {
// 		// add shapes
// 		employeeNodes = graph.selectAll('a-sphere')
// 			.data(employees)
// 			.enter()
// 			.append('a-sphere')
// 			.attr('data-initials', d => d.initials)
// 			.attr('data-happiness', (d) => {
// 				const firstPeriod = d.periods[0];
// 				return firstPeriod.happiness;
// 			})
// 			.attr('data-business', (d) => {
// 				const firstPeriod = d.periods[0];
// 				return firstPeriod.business;
// 			})
// 			.attr('radius', nodeRadius)
// 			.attr('position', (d) => {
// 				const firstPeriod = d.periods[0],
// 					x = happinessScale(firstPeriod.happiness),
// 					y = businessScale(firstPeriod.business);

// 				return x+', '+y+', '+z;
// 			})
// 			.attr('color', '#00bdfa')
// 			.attr('title', d => d.name)
// 			.attr('class', 'employee-node')
// 			.on('click', showEmployeeDetails)

// 		const fontSize = 0.5;
// 		employeeNodes.append('a-text')
// 			.attr('value', (d) => {
// 				return d.initials;
// 			})
// 			.attr('position', `0, 0, ${nodeRadius}`)
// 			.attr('scale', `${fontSize}, ${fontSize}, ${fontSize}`)
// 			.attr('color', 'black')
// 			.attr('align', 'center')

// 		// // now that we have nodes on screen, we can check their dimensions
// 		// let typicalNode = graph.select('.employee-node:first-child').node();
// 		// nodeRadius = typicalNode.getBoundingClientRect().width/2,
// 		nodeDistance = nodeRadius * 0.2;

// 		simulation.nodes(employees)
// 			.on('tick', () => { tickHandler(employeeNodes) });
// 		scheduleSimulationStop();
// 		setTimeout(() => {changePeriod(+1);}, 1000);

// 		// graphElm.querySelectorAll('.employee-node').forEach((elm) => {
// 		// 	let div = document.createElement('div');
// 		// 	div.classList.add('mood-trace');
// 		// 	elm.append(div);
// 		// });
// 	};
	
	

// 	/**
// 	* draw the actual graph
// 	* @returns {undefined}
// 	*/
// 	const drawGraph = function() {
// 		// add shapes
// 		employeeNodes = graph.selectAll('.employee-node')
// 			.data(employees)
// 			.enter()
// 			.append('div')
// 			.attr('data-initials', d => d.initials)
// 			.attr('data-happiness', (d) => {
// 				const firstPeriod = d.periods[0];
// 				return firstPeriod.happiness;
// 			})
// 			.attr('data-business', (d) => {
// 				const firstPeriod = d.periods[0];
// 				return firstPeriod.business;
// 			})
// 			.attr('title', d => d.name)
// 			.attr('class', 'employee-node')
// 			.on('click', showEmployeeDetails)

// 		// now that we have nodes on screen, we can check their dimensions
// 		let typicalNode = graph.select('.employee-node:first-child').node();
// 		nodeRadius = typicalNode.getBoundingClientRect().width/2,
// 		nodeDistance = nodeRadius * 0.05;

// 		simulation.nodes(employees)
// 			.on('tick', () => { tickHandler(employeeNodes) });
// 		scheduleSimulationStop();
// 		setTimeout(() => {changePeriod(+1);}, 1000);

// 		graphElm.querySelectorAll('.employee-node').forEach((elm) => {
// 			let div = document.createElement('div');
// 			div.classList.add('mood-trace');
// 			elm.append(div);
// 		});
// 	};
	


// 	/**
// 	* initialize interface
// 	* @returns {undefined}
// 	*/
// 	const initInterface = function() {
// 		// initButtons
// 		// d3.select('#show-mood').on('click', function() {
// 		// 	changePeriod();
// 		// });

// 		// d3.select('#show-next-period').on('click', function() {
// 		// 	changePeriod(+1);
// 		// });

// 		// d3.select('#show-prev-period').on('click', function() {
// 		// 	changePeriod(-1);
// 		// });
// 		// const prevBtn = document.getElementById('show-prev-period');
// 		// prevBtn.addEventListener('mouseEnter', function() {
// 		// 	prevBtn.setAttribute('color', '#00bdfa');
// 		// });
// 		// 	console.log(prevBtn);

// 		// var boxEl = document.querySelector('a-triangle');
// 		const prevBtn = document.getElementById('show-prev-period'),
// 			nextBtn = document.getElementById('show-next-period');
// 		prevBtn.addEventListener('mouseenter', function () {
// 			prevBtn.setAttribute('scale', {x: 0.45, y: 0.3, z: 1});
// 			changePeriod(-1);
// 		});
// 		prevBtn.addEventListener('mouseleave', function () {
// 		  prevBtn.setAttribute('scale', {x: 0.3, y: 0.2, z: 1});
// 		});
// 		nextBtn.addEventListener('mouseenter', function () {
// 			nextBtn.setAttribute('scale', {x: 0.45, y: 0.3, z: 1});
// 			changePeriod(1);
// 		});
// 		nextBtn.addEventListener('mouseleave', function () {
// 		  nextBtn.setAttribute('scale', {x: 0.3, y: 0.2, z: 1});
// 		});

// 	};



// 	/**
// 	* 
// 	* @returns {undefined}
// 	*/
// 	const fileExists = function(url) {
// 	    var http = new XMLHttpRequest();
// 	    http.open('HEAD', url, false);
// 	    // this line will show an error in the console
// 	    // this is not a js-error, so we can't use try catch
// 	    http.send();
// 	    return http.status !== 404;
// 	};



// 	/**
// 	* create a list of files to load
// 	* @returns {undefined}
// 	*/
// 	const createFileList = function() {

// 		let weekNumber = firstWeekNumber,
// 			urlToCheck,
// 			urls = [];

// 		const createUrl = function(weekNumber) {
// 			return dataFileUrlStart + weekNumber + dataFileUrlEnd;
// 		}

// 		urlToCheck = createUrl(weekNumber);

// 		while (fileExists(urlToCheck)) {
// 			urls.push(urlToCheck);
// 			weekNumber ++;
// 			urlToCheck = createUrl(weekNumber);
// 		}
// 		return urls;
// 	};



// 	/**
// 	* set the current week
// 	* @returns {undefined}
// 	*/
// 	const setWeek = function() {
// 		currPeriodIdx = totalPeriods - 2;// we'll call changePeriod(+1) 1sec in the script
// 		prevPeriodIdx = Math.max(currPeriodIdx -1, 0);
// 	};
	
	

// 	/**
// 	* handle data being loaded
// 	* @returns {undefined}
// 	*/
// 	const loadHandler = function(error, ...rawDatasetStrings) {
// 		initInterface();
// 		processData(rawDatasetStrings);
// 		// drawGraph();
// 		drawVRGraph();
// 	}// loadHandler
	


// 	/**
// 	* load data and kick off rendering
// 	* @returns {undefined}
// 	*/
// 	const loadData = function() {
// 		const urlsToLoad = createFileList();

// 		let queue = d3.queue();
// 		urlsToLoad.forEach((url) => {
// 			queue = queue.defer(d3.text, url);
// 		});
// 		queue.await(loadHandler);
// 	};



// 	/**
// 	* initialize all functionality
// 	* @param {string} varname - Description
// 	* @returns {undefined}
// 	*/
// 	const init = function() {
// 		loadData();// load data and kick things off
// 	};



// 	// kick of the script when all dom content has loaded
// 	document.addEventListener('DOMContentLoaded', init);

// })();

