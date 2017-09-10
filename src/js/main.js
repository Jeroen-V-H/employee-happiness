;(() => {
	'use strict';

	// tell jshint about globals (they should remain commented out)
	/* globals zup */ //Tell jshint zup exists as global var


	const graphElm = document.getElementById('graph'),
		width = graphElm.clientWidth,
		height = graphElm.clientHeight,
		forceStrength = 0.1,
		simulationDuration = 2000;

	const firstWeekNumber = 33;// number of the first week in the data
	
	let timestampField,
		emailField,
		nameField,
		happinessField,
		businessField,
		improvementsField;

	let employeeEmails = [],
		employees = [],
		currPeriodIdx = 0,
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
		nodeRadius = 25,// will be calculated by js
		nodeDistance = 3;

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
	* get employee's initials
	* @returns {undefined}
	*/
	const getInitialsFromDataPoint = function(d) {
		const parts = d[emailField].split('@')[0].split('.'),
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
	const calculateHealthScore_bak = function(d) {
		const period = d.periods[currPeriodIdx],
			happinessScore = happinessScores[+period.happiness -1],
			businessScore = businessScores[+period.business -1],
			healthScore = happinessScore + businessScore,
			colorIdx = healthScore + 6;
		d.healthScore = healthScore;

		return healthScore;
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
	const setHealthColors_bak = function() {
		employeeNodes.style('background', function(d) {

			// minHealthScore should have colorIdx 0
			const colorIdx = d.healthScore - minHealthScore;
			return colors[colorIdx];
		});
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
		});
	};




	/**
	* 
	* @returns {undefined}
	*/
	const changePeriod = function(increment = 0) {
			const newPeriodIdx = currPeriodIdx + increment;
			if (newPeriodIdx >= 0 && newPeriodIdx < totalPeriods) {
				currPeriodIdx = newPeriodIdx;
			}
			setHealthColors();

			simulation
				.force('forceX', forceXHappiness)
				.force('forceY', forceYBusiness)
				.alphaTarget(0.5)
				.restart();
			scheduleSimulationStop();
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
	* create variables for the questions in the questionaire
	* @returns {undefined}
	*/
	const setQuestionFields = function(questions) {
		timestampField = questions[0];
		emailField = questions[1];
		nameField = questions[2];
		happinessField = questions[3];
		businessField = questions[4];
		improvementsField = questions[5];
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
	* process the data so we can use it
	* @returns {undefined}
	*/
	const processData_ = function(rawDatasets) {
		// console.log(rawData);
		setQuestionFields(rawDatasets[0].columns);

		// loop through all data
		// determine all employees (unique identifier: email)
		// determine all periods
		// create new array
		// create object for every employee
		// for every period, 

		let data = rawData;
		return data;
	};


	/**
	* process dataset of 1 period
	* @returns {undefined}
	*/
	const processPeriodData = function(dataset, weekNumber) {
		const fields = getPeriodQuestionFields(dataset.columns);

		dataset.forEach((employeeRow) => {
			const email = employeeRow[fields.email]
			let employee;

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
			}

			// now do stuff for both just and previously added employees
			employee = employees[employeeIndex];

			const happiness = +employeeRow[fields.happiness],
				business = +employeeRow[fields.business],
				health = calculateHealthScore(happiness, business),
				mood = {
					happiness,
					business,
					health
				};
			// I'm still assuming that every employee is present in every period.
			employee.periods.push(mood);
			// employees.push(employee);

		});
	};
	
	



	/**
	* process the data so we can use it
	* @returns {undefined}
	*/
	const processData = function(rawDatasets) {
		// console.log(rawData);
		totalPeriods = rawDatasets.length;
		setQuestionFields(rawDatasets[0].columns);

		let weekNumber = 35

		// loop through all data
		rawDatasets.forEach((dataset) => {
			processPeriodData(dataset);
		});

		let data = rawDatasets[0];
		return data;
	};


	/**
	* handle simulation tic
	* @returns {undefined}
	*/
	const tickHandler = function(nodes) {
		nodes.style('left', function(d) {
				return d.x + 'px';
			})
			.style('top', function(d) {
				return d.y + 'px';
			})
	};



	/**
	* schedule the stopping of the animation
	* @returns {undefined}
	*/
	const scheduleSimulationStop = function() {
		clearTimeout(simulationTimer);
		simulationTimer = setTimeout(() => {
			simulation.stop();
		}, simulationDuration);
	};
	
	



	/**
	* draw the actual graph
	* @returns {undefined}
	*/
	const drawGraph_ = function(data) {
		// add shapes
		employeeNodes = graph.selectAll('.employee-node')
			.data(data)
			.enter()
			.append('div')
			.attr('data-initials', getInitialsFromDataPoint)
			.attr('data-happiness', (d) => {
				return d[happinessField];
			})
			.attr('data-business', (d) => {
				return d[businessField];
			})
			.attr('data-health-score', calculateHealthScore)
			.attr('class', 'employee-node')
			.on('mouseover', function(d) {
				// console.log(d.name, d.happiness, d.business);
			})

		// now that we have nodes on screen, we can check their dimensions
		let typicalNode = graph.select('.employee-node:first-child').node();
		nodeRadius = typicalNode.getBoundingClientRect().width/2,
		nodeDistance = nodeRadius * 0.05;

		simulation.nodes(data)
			.on('tick', () => { tickHandler(employeeNodes) });
		scheduleSimulationStop();
	};


	/**
	* draw the actual graph
	* @returns {undefined}
	*/
	const drawGraph = function() {
		let data = employees;
		// add shapes
		console.log(employees);
		employeeNodes = graph.selectAll('.employee-node')
			.data(data)
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
			.attr('data-health-score', calculateHealthScore)
			.attr('class', 'employee-node')
			.on('mouseover', function(d) {
				// console.log(d.name, d.happiness, d.business);
			})

		// now that we have nodes on screen, we can check their dimensions
		let typicalNode = graph.select('.employee-node:first-child').node();
		nodeRadius = typicalNode.getBoundingClientRect().width/2,
		nodeDistance = nodeRadius * 0.05;

		simulation.nodes(data)
			.on('tick', () => { tickHandler(employeeNodes) });
		scheduleSimulationStop();
	};
	
	

	/**
	* handle data being loaded
	* @returns {undefined}
	*/
	const loadHandler = function(error, ...rawDatasets) {
		initInterface();
		let data = processData(rawDatasets);
		drawGraph(data);
	}// loadHandler



	/**
	* load data and kick off rendering
	* @returns {undefined}
	*/
	var loadData = function() {
		d3.queue()
			//https://stackoverflow.com/questions/36090611/how-to-parse-a-csv-file-with-d3-when-parser-is-not-the-comma
			// var ssv = d3.dsv(";", "text/plain");

			// // Load and (later, asynchronously) parse the data
			// ssv(url, function(data) {
			//   console.log(data); // should log an array of parsed values
			// });

			// .defer(d3.csv, 'data/happiness.csv')
			.defer(d3.csv, 'data/happiness-wk33.csv')
			.defer(d3.csv, 'data/happiness-wk34.csv')
			.defer(d3.csv, 'data/happiness-wk35.csv')
			.defer(d3.csv, 'data/happiness-wk36.csv')
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

