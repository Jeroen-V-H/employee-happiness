;(() => {
	'use strict';

	// tell jshint about globals (they should remain commented out)
	/* globals zup */ //Tell jshint zup exists as global var


	const graphElm = document.getElementById('graph'),
		width = graphElm.clientWidth,
		height = graphElm.clientHeight,
		forceStrength = 0.1,
		simulationDuration = 2000;
	
	let timestampField,
		emailField,
		nameField,
		happinessField,
		businessField,
		improvementsField;

	let employees = [];

	// https://gka.github.io/palettes/#colors=#fc0,green|steps=4|bez=1|coL=1
	// https://gka.github.io/palettes/#colors=#c00,#fc0|steps=4|bez=1|coL=1
	const colors = ['#cc0000','#cc0000','#cc0000','#e06000','#f19800','#ffcc00','#b9b400','#709b00','#008000'],
		happinessScores = [-4, -2, 0, 1, 2],
		businessScores = [-2, -1, 0, -1, -2],
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
		return happinessScale(d[happinessField]);
	}).strength(forceStrength);

	const forceYBusiness = d3.forceY(function(d) {
		return businessScale(d[businessField]);
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
	const getInitials = function(d) {
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
	const calculateHealthScore = function(d) {
		const happinessScore = happinessScores[d[happinessField] -1],
			businessScore = businessScores[d[businessField] -1],
			healthScore = happinessScore + businessScore,
			colorIdx = healthScore + 6;
		d.healthScore = healthScore;

		return healthScore;
	};
	


	/**
	* 
	* @returns {undefined}
	*/
	const setHealthColors = function() {
		employeeNodes.style('background', function(d) {
			const minHappinessScore = Math.min(...happinessScores),
				maxHappinessScore = Math.max(...happinessScores),
				minBusinessScore = Math.min(...businessScores),
				maxBusinessScore = Math.max(...businessScores),
				minHealthScore = minHappinessScore + minBusinessScore,
				maxHealthScore = maxHappinessScore + maxBusinessScore;

			// minHealthScore should have colorIdx 0
			const colorIdx = d.healthScore - minHealthScore;
			return colors[colorIdx];
		});
	};



	/**
	* initialize interface
	* @returns {undefined}
	*/
	const initInterface = function() {
		// initButtons
		d3.select('#show-mood').on('click', function() {
			setHealthColors();

			simulation
				.force('forceX', forceXHappiness)
				.force('forceY', forceYBusiness)
				.alphaTarget(0.5)
				.restart();
			scheduleSimulationStop();
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
	* process the data so we can use it
	* @returns {undefined}
	*/
	const processData = function(rawData) {
		// console.log(rawData);
		setQuestionFields(rawData.columns);
		let data = rawData;
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
	const drawGraph = function(data) {
		// add shapes
		employeeNodes = graph.selectAll('.employee-node')
			.data(data)
			.enter()
			.append('div')
			.attr('data-initials', getInitials)
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
	* handle data being loaded
	* @returns {undefined}
	*/
	const loadHandler = function(error, rawData) {
		initInterface();
		let data = processData(rawData);
		drawGraph(data);
	}// loadHandler



	/**
	* load data and kick off rendering
	* @returns {undefined}
	*/
	var loadData = function() {
		d3.queue()
			// .defer(d3.csv, 'data/happiness.csv')
			.defer(d3.csv, 'data/happiness-one-period.csv')
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

