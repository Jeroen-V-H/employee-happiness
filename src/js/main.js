;(() => {
	'use strict';

	// tell jshint about globals (they should remain commented out)
	/* globals zup */ //Tell jshint zup exists as global var




	const graphElm = document.getElementById('graph'),
		width = graphElm.clientWidth,
		height = graphElm.clientHeight,
		nodeRadius = 25,
		nodeDistance = 3,
		forceStrength = 0.1,
		simulationDuration = 2000;
	
	const emailField ="Email Address",
		nameField ="What is your name?",
		happinessField ="How happy are you with the work you're doing ",
		businessField ="How busy are you at the moment ";

	// https://gka.github.io/palettes/#colors=#fc0,green|steps=4|bez=1|coL=1
	// https://gka.github.io/palettes/#colors=#c00,#fc0|steps=4|bez=1|coL=1
	const colors = ['#cc0000','#cc0000','#cc0000','#e06000','#f19800','#ffcc00','#b9b400','#709b00','#008000'],
		happinessScores = [-4, -2, 0, 1, 2],
		businessScores = [-2, -1, 0, -1, -2],
		happinessScale = d3.scaleLinear().domain([1, 5]).range([0, width]),
		businessScale = d3.scaleLinear().domain([1, 5]).range([height, 0]);

	let simulationTimer,
		employeeNodes;

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
		// .force('forceX', d3.forceX(width / 2).strength(forceStrength))
		.force('forceX', forceXCombined)
		.force('forceY', d3.forceY(height / 2).strength(forceStrength))
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
			console.log(minHealthScore, maxHealthScore);

			// minHealthScore should have colorIdx 0
			// const correction = 
			const colorIdx = d.healthScore - minHealthScore;
			return colors[colorIdx];
		});
	};
	
	


	function ready(error, datapoints) {

		// initButtons
		d3.select('#show-mood').on('click', function() {
			let sim = simulation
				.force('forceX', forceXHappiness)
				.force('forceY', forceYBusiness)
				.alphaTarget(0.5)
				.restart();

			setHealthColors();

			clearTimeout(simulationTimer);
			simulationTimer = setTimeout(() => {
				sim.stop();
			}, simulationDuration);
		});

		d3.select('#combined').on('click', function() {
			let sim = simulation
				.force('forceX', forceXCombined)
				.force('forceY', forceYCombined)
				.alphaTarget(0.5)
				.restart();

			clearTimeout(simulationTimer);
			simulationTimer = setTimeout(() => {
				sim.stop();
			}, simulationDuration);
		});


		// add shapes
		employeeNodes = graph.selectAll('.employee-node')
			.data(datapoints)
			.enter()
			.append('div')
			.attr('data-initials', getInitials)
			.attr('data-health-score', calculateHealthScore)
			.attr('class', 'employee-node')
			.on('mouseover', function(d) {
				// console.log(d.name, d.happiness, d.business);
			})

		simulation.nodes(datapoints)
			.on('tick', ticked);

		clearTimeout(simulationTimer);
		simulationTimer = setTimeout(() => {
			simulation.stop();
		}, simulationDuration);

		function ticked() {
			employeeNodes
				.style('left', function(d) {
					return d.x + 'px';
				})
				.style('top', function(d) {
					return d.y + 'px';
				})
		}
	}// ready


	/**
	* load data and kick off rendering
	* @returns {undefined}
	*/
	var loadData = function() {
		d3.queue()
			.defer(d3.csv, 'data/happiness.csv')
			.await(ready);
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

