;(() => {
	'use strict';

	// tell jshint about globals (they should remain commented out)
	/* globals zup */ //Tell jshint zup exists as global var


	const graphElm = document.getElementById('graph'),
		prevMoodsElm = document.getElementById('prev-moods'),
		width = graphElm.clientWidth,
		height = graphElm.clientHeight,
		forceStrength = 0.1,
		simulationDuration = 2000;

	const firstWeekNumber = 32;// number of the first week in the data
	
	let employeeEmails = [],
		employees = [],
		currPeriodIdx = -1,
		prevPeriodIdx = 0,
		totalPeriods = 0;

	// https://gka.github.io/palettes/#colors=#fc0,green|steps=4|bez=1|coL=1
	// https://gka.github.io/palettes/#colors=#c00,#fc0|steps=4|bez=1|coL=1
	const colors = ['#cc0000','#cc0000','#cc0000','#e06000','#f19800','#ffcc00','#b9b400','#709b00','#008000'],
		happinessScores = [-4, -2, 0, 1, 2],
		businessScores = [-2, -1, 0, -1, -2],
		minHappinessScore = Math.min(...happinessScores),
		maxHappinessScore = Math.max(...happinessScores),
		minBusinessScore = Math.min(...businessScores),
		maxBusinessScore = Math.max(...businessScores),
		minHealthScore = minHappinessScore + minBusinessScore,
		maxHealthScore = maxHappinessScore + maxBusinessScore,
		happinessScale = d3.scaleLinear().domain([1, 5]).range([0, width]),
		businessScale = d3.scaleLinear().domain([1, 5]).range([height, 0]);

	let simulationTimer,
		employeeNodes,
		prevMoodNodes,
		nodeRadius = 25,// will be calculated by js
		nodeDistance = 3;

	let graph = d3.select('#graph')
			.attr('width', width)
			.attr('height', height),
		prevMoodsArea = d3.select('#prev-moods');

	// define force functions
	const forceXHappiness = d3.forceX(function(d) {
		return happinessScale(d.periods[currPeriodIdx].happiness);
	}).strength(forceStrength);

	const forceYBusiness = d3.forceY(function(d) {
		return businessScale(d.periods[currPeriodIdx].business);
	}).strength(forceStrength);

	const forceXCombined = d3.forceX(width / 2).strength(forceStrength),
		forceYCombined = d3.forceY(height / 2).strength(forceStrength);

	const forceCollide = d3.forceCollide(function(d) {
			return nodeRadius + nodeDistance;
		});

	let simulation = d3.forceSimulation()
		.force('forceX', forceXCombined)
		.force('forceY', forceYCombined)
		.force('collide', forceCollide);



	/**
	* get employee's initials
	* @returns {undefined}
	*/
	const getInitials = function(email) {
		const parts = email.split('@')[0].split('.'),
			nonCaps = [
				'de', 'den', 'der', 'van', 'op', 't'
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
		const happinessScore = happinessScores[happiness -1],
			businessScore = businessScores[business -1],
			healthScore = happinessScore + businessScore;

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
	const changePeriod = function(increment = 0) {
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

			graphElm.querySelectorAll('.mood-trace').forEach(traceElm => traceElm.classList.remove('mood-trace--is-visible'));

			setHealthColors();
			setRecentness();

			simulation
				.force('forceX', forceXHappiness)
				.force('forceY', forceYBusiness)
				.alphaTarget(0.5)
				.restart();
			scheduleSimulationStop();

			document.getElementById('week-number__value').textContent = firstWeekNumber + currPeriodIdx;
	};
	


	/**
	* create get the exact wording of the questions in this period's questionaire
	* wording may change; order of the topics should remain the same
	* @returns {object} fields with corresponding question
	*/
	const getPeriodQuestionFields = function(questions) {
		const fields = {
			timestamp: questions[0],
			email: questions[1],
			name: questions[2],
			happiness: questions[3],
			business: questions[4],
			improvements: questions[5]
		};

		return fields;
	};



	/**
	* get the object for the team avarage; create it if it doesn't exist yet
	* @returns {object} object like employee-object
	*/
	const getAvarageObject = function() {
		const avgString = 'team-avarage';
		let avgObj,
			avgIndex = employeeEmails.indexOf(avgString);

		if (avgIndex === -1) {
			avgObj = {
				email: '',
				name: 'Team Avarage',
				initials: 'AVG',
				periods: []
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
	const addNewEmployeeDummyMoods = function(employee, mood, periodIdx) {
		const dummyMood = Object.assign({}, mood, { isFromThisWeek: false});
		for (let i=0; i<periodIdx; i++) {
			employee.periods.push(dummyMood);
		}
	};


	/**
	* add moods for employees that already have an entry, but are not in the current period
	* @returns {undefined}
	*/
	const addMissingEmployeeMoods = function(dataset, periodIdx) {
		employees.forEach((employee) => {
			const periods = employee.periods,
				periodCount = periods.length;

			if (periodCount <= periodIdx) {
				// we're missing periods; take the last known mood as reference
				const dummyMood = Object.assign({}, periods[periodCount-1], {isFromThisWeek: false});
				for (let i=periodCount; i <= periodIdx; i++) {
					periods.push(dummyMood);
				}
			}
		});
	};
	
	
	
	


	/**
	* process dataset of 1 period
	* @returns {undefined}
	*/
	const processPeriodData = function(dataset, periodIdx) {
		const fields = getPeriodQuestionFields(dataset.columns);
		let teamHappiness = 0,
			teamBusiness = 0,
			teamHealth = 0;

		dataset.forEach((employeeRow) => {
			const email = employeeRow[fields.email]
			let employee,
				isNewlyAdded = false;

			//check if employee is already in employees-array
			// d3 works easier with normal arrays than with associative ones, so I can't use email as array-index
			let employeeIndex = employeeEmails.indexOf(email);
			if (employeeIndex === -1) {
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

			const happiness = +employeeRow[fields.happiness],
				business = +employeeRow[fields.business],
				health = calculateHealthScore(happiness, business),
				mood = {
					happiness,
					business,
					health,
					isFromThisWeek: true
				};
			// I'm still assuming that every employee is present in every period.

			if (isNewlyAdded) {
				addNewEmployeeDummyMoods(employee, mood, periodIdx);
			}
			employee.periods.push(mood);

			teamHappiness += happiness;
			teamBusiness += business;
			teamHealth += health;
		});

		const avgObj = getAvarageObject(),
			numEntries = dataset.length,
			mood = {
				happiness: (teamHappiness/numEntries).toFixed(1),
				business: (teamBusiness/numEntries).toFixed(1),
				health: (teamHealth/numEntries).toFixed(1),
				isFromThisWeek: true
			};
		avgObj.periods.push(mood);

		// add moods for employees that were in previous periods, but not in this one
		addMissingEmployeeMoods(dataset, periodIdx);
	};
	


	/**
	* process the data so we can use it
	* @returns {undefined}
	*/
	const processData = function(rawDatasetStrings) {
		totalPeriods = rawDatasetStrings.length;
		const ssv = d3.dsvFormat(';');// define semicolon separated value parser

		// loop through all data
		rawDatasetStrings.forEach((datasetString, periodIdx) => {
			const dataset = ssv.parse(datasetString);
			processPeriodData(dataset, periodIdx);
		});
	};


	/**
	* show an employee's detail info
	* @returns {undefined}
	* @param {d3 selection} employee - The employee's object
	*/
	const showEmployeeDetails = function(employee) {
		// const email = d[d.column] employeeIndex = employeeEmails.indexOf(email);
		console.log(employee.name, employee.periods[currPeriodIdx]);
		console.log(employee, currPeriodIdx);
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
	* 
	* @returns {undefined}
	*/
	const showMoodTrace = function() {
		if (currPeriodIdx >= 0 && currPeriodIdx !== prevPeriodIdx) {
			graphElm.querySelectorAll('.employee-node').forEach((elm, i) => {
				const data = elm.__data__,
					currMood = data.periods[currPeriodIdx];
				if (currMood.isFromThisWeek) {
					const traceElm = elm.querySelector('.mood-trace'),
						prevMood = data.periods[prevPeriodIdx];

					traceElm.classList.add('mood-trace--is-visible');
					const currLeft = parseInt(elm.style.left, 10),
						currTop = parseInt(elm.style.top, 10),
						prevLeft = happinessScale(prevMood.happiness),
						prevTop = businessScale(prevMood.business),
						dx = prevLeft - currLeft,// distance from curr to prev
						dy = prevTop - currTop;

					const length = Math.sqrt(dx*dx + dy*dy);
					const alphaRadians = Math.atan(dy/dx);
					let alpha = alphaRadians * 180/Math.PI;
					if (dx < 0) {
						alpha += 180;
					}
					traceElm.style.width = length + 'px';
					// traceElm.style.borderLeftWidth = length + 'px';
					traceElm.style.transform = 'translate(0, -50%) rotate('+alpha+'deg)';
				}
			});
		}
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
		employeeNodes = graph.selectAll('.employee-node')
			.data(employees)
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
			.attr('class', 'employee-node')
			.on('click', showEmployeeDetails)

		// now that we have nodes on screen, we can check their dimensions
		let typicalNode = graph.select('.employee-node:first-child').node();
		nodeRadius = typicalNode.getBoundingClientRect().width/2,
		nodeDistance = nodeRadius * 0.05;

		simulation.nodes(employees)
			.on('tick', () => { tickHandler(employeeNodes) });
		scheduleSimulationStop();

		graphElm.querySelectorAll('.employee-node').forEach((elm) => {
			let div = document.createElement('div');
			div.classList.add('mood-trace');
			elm.append(div);
		});

		// addPrevMoods();
	};
	


	/**
	* initialize interface
	* @returns {undefined}
	*/
	const initInterface = function() {
		// initButtons
		d3.select('#show-mood').on('click', function() {
			changePeriod();
		});

		d3.select('#show-next-period').on('click', function() {
			changePeriod(+1);
		});

		d3.select('#show-prev-period').on('click', function() {
			changePeriod(-1);
		});

		d3.select('#combined').on('click', function() {
			simulation
				.force('forceX', forceXCombined)
				.force('forceY', forceYCombined)
				.alphaTarget(0.5)
				.restart();
			scheduleSimulationStop();
		});

	};
	


	/**
	* handle data being loaded
	* @returns {undefined}
	*/
	const loadHandler = function(error, ...rawDatasetStrings) {
		initInterface();
		processData(rawDatasetStrings);
		drawGraph();
	}// loadHandler



	/**
	* load data and kick off rendering
	* @returns {undefined}
	*/
	var loadData = function() {
		d3.queue()
			.defer(d3.text, 'data/Weekly happiness form week 32 (Responses).csv')
			.defer(d3.text, 'data/Weekly happiness form week 33 (Responses).csv')
			.defer(d3.text, 'data/Weekly happiness form week 34 (Responses).csv')
			.defer(d3.text, 'data/Weekly happiness form week 35 (Responses).csv')
			.defer(d3.text, 'data/Weekly happiness form week 36 (Responses).csv')
			.await(loadHandler);
	};



	/**
	* initialize all functionality
	* @param {string} varname - Description
	* @returns {undefined}
	*/
	const init = function() {
		loadData();// load data and kick things off
	};


	// kick of the script when all dom content has loaded
	document.addEventListener('DOMContentLoaded', init);

})();

