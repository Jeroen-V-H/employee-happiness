;(() => {

// ---------------------------------------------------------------------------------
// Definitions data handling
// ---------------------------------------------------------------------------------

	const spreadsheetId = '1K4YbGsCSSIJhB0nYArs0XouoOqT1xGyM2KWOdny-tLs';
	let sheetHelper;

	const teamSelector = document.getElementById('team-selector');
	// const teamAllId = 'all';
	const excludeFromChartId = 'exclude from chart';
	const teams = {
		blacklist: new Team(''),
		Amersforce: new Team('Amersforce')
	};

	const missingFilterToggle = document.getElementById('filter-for-missing');
	const expiredFilterToggle = document.getElementById('filter-for-expired');

	let dividedWeekData = [];
	let cWeekIdx = 0;
	let weekDataToShow;
	let answerTimer;
	let answers = [];
	let currentAnswer;


// ---------------------------------------------------------------------------------
// Definitions graph logic
// ---------------------------------------------------------------------------------

	const graphElm = document.getElementById('graph');
	const graphWidth = graphElm.clientWidth;
	const graphHeight = graphElm.clientHeight;
	let graph = d3.select('#graph')
		.attr('width', graphWidth)
		.attr('height', graphHeight);
	
	const happinessScale = d3.scaleLinear().domain([1, 5]).range([0, graphWidth]);
	const businessScale = d3.scaleLinear().domain([1, 5]).range([graphHeight, 0]);

	let simulationDuration = 2000;
	let employeeNodes;
	let simulation = d3.forceSimulation();
	const nodeBaseRadius = 16;
	const shrinkFactor = 0.7;
	const growFactor = 1.2;
	const forceStrength = 0.15;
	let tracesEnabled = false;


// ---------------------------------------------------------------------------------
// Graph logic
// ---------------------------------------------------------------------------------

	const tickHandler = function(node) {
		node.style('left', d => d.x + 'px')
			.attr('nodeX', d => d.x)
			.style('top', d => d.y + 'px')
			.attr('nodeY', d => d.y);;
	};

	let simulationTimer;
	const simulate = function(employeeData, employeeNodes) {
		tracesEnabled = false;
		simulation.nodes(employeeData)
			.on('tick', () => { tickHandler(employeeNodes) });

		simulation
			.force('forceX', d3.forceX(d => {
				if (missingFilterToggle.checked) {
					if (d.isExpired) { return happinessScale(3); }
					if (d.isMissingEntry) { return happinessScale(3);	}
				}
				return happinessScale(d.happinessScore);
			}).strength(forceStrength))

			.force('forceY', d3.forceY(d => {
				if (missingFilterToggle.checked && (d.isExpired || d.isMissingEntry)) { return businessScale(3); }
				return businessScale(d.businessScore)
			}).strength(forceStrength))

			.force('collide', d3.forceCollide(d => {
				if (d.isMissingEntry && !missingFilterToggle.checked || d.isExpired) {
					return nodeBaseRadius * shrinkFactor + 1;
				}
				if (missingFilterToggle.checked) {
					return nodeBaseRadius * growFactor;
				}
				return nodeBaseRadius;
			}).iterations(5).strength(1.2))

			.alphaTarget(0.4)
			.restart();
		
		clearTimeout(simulationTimer);
		simulationTimer = setTimeout(() => {
			simulation.stop();
			tracesEnabled = true;
		}, simulationDuration);
	}

	const generateStartX = function() {
		return (Math.random() * graphWidth / 3) + graphWidth / 3;
	}

	const generateStartY = function() {
		return (Math.random() * graphHeight / 3) + graphHeight / 3;
	}

	const updateStyleProperties = function (selection) {
		const borderSize = nodeBaseRadius / 8;
		selection
			.style('background', function(d) {
				if (this.classList.contains('not-from-this-week')) {
					return 'white';
				}
				return d.getColor();
			})
			.style('border', function(d) {
				if (this.classList.contains('not-from-this-week')) {
					return `${borderSize}px solid currentColor`;
				}
				return '0px solid currentColor';
			})
			.style('color', function(d) {
				if (this.classList.contains('expired')) { return '#999';	}
				if (this.classList.contains('not-from-this-week') && missingFilterToggle.checked) { return '#c00'; }
				return d.getColor();
			})
			.style('transform', function(d) {
				if (this.classList.contains('not-from-this-week')) {
					const translatePx = nodeBaseRadius + borderSize;
					if (missingFilterToggle.checked && !this.classList.contains('expired')) {
						return `translate(-${translatePx}px, -${translatePx}px) scale(1)`;
					}
					return `translate(-${translatePx}px, -${translatePx}px) scale(${shrinkFactor})`;
				}
				return `translate(-${nodeBaseRadius}px, -${nodeBaseRadius}px) scale(1)`;
			})
	}

	const processEmployeeNodes = function(data) {
		const trDuration = 400;

		return selection = graph.selectAll('.employee-node')
			.data(data, (d) => { return d ? d.email : this.email })
				.join(
					enter => enter.append('div')
						.attr('data-email', d => d.email)
						.attr('class', 'employee-node')
			
						.attr('data-initials', d => d.getInitials())
						.attr('title', d => d.getNeatName())
			
						.classed('not-from-this-week', d => d.isMissingEntry)
						.classed('expired', d => d.isExpired)
			
						.style('width', (nodeBaseRadius * 2) + 'px')
						.style('height', (nodeBaseRadius * 2) + 'px')
			
						.style('left', d => { d.x = generateStartX(); return d.x + 'px' })
						.style('top', d => { d.y = generateStartY(); return d.y + 'px' })

						.call(updateStyleProperties)

						.on('click', function(d) {	console.log(d) })
						.on('mouseenter', function(d) { generateTrace(d) })
						.on('mouseleave', function(d) { removeTraces() }),

					update => update
						.classed('not-from-this-week', d => d.isMissingEntry)
						.classed('expired', d => d.isExpired)

						.attr('nodeX', function(d) {
							const nodeX = this.getAttribute('nodeX');
							d.x = Math.round(parseInt(nodeX, 10));
							return d.x;
						})
						.attr('nodeY', function(d) {
							const nodeY = this.getAttribute('nodeY');
							d.y = Math.round(parseInt(nodeY, 10));
							return d.y;
						})
						.style('left', d => d.x + 'px')
						.style('top', d => d.y + 'px')

						.call(update => update.interrupt())
						.call(update => update.transition()
							.duration(trDuration)
							.call(updateStyleProperties))
						);
	}

	const generateTrace = function(employee) {
		const lastWeekEmployeeData = dividedWeekData[cWeekIdx - 1 >= 0 ? cWeekIdx - 1 : 0].employees;

		const lastWeekEntry = lastWeekEmployeeData.find((lastEntry) => {
			if (lastEntry.email !== 'Average') { return lastEntry.email === employee.email }
		});

		if (lastWeekEntry && !lastWeekEntry.isMissingEntry && !employee.isMissingEntry && tracesEnabled) {
			const lastWeekHappinessDiffers = lastWeekEntry.happinessScore !== employee.happinessScore;
			const lastWeekBusinessDiffers = lastWeekEntry.businessScore !== employee.businessScore;

			if (lastWeekHappinessDiffers || lastWeekBusinessDiffers) {
				createMotionTrace(employee, lastWeekEntry);
			} else {
				createIdleTrace(employee);
			}
		}
	}

	const createMotionTrace = function(employee, lastEntry) {
		const prevLeft = happinessScale(lastEntry.happinessScore);
		const prevTop = businessScale(lastEntry.businessScore);

		const currentNode = graphElm.querySelector(`.employee-node[data-email="${employee.email}"]`);
		const currLeft = parseInt(currentNode.style.left, 10);
		const currTop = parseInt(currentNode.style.top, 10);

		const dx = prevLeft - currLeft;// distance from curr to prev
		const dy = prevTop - currTop;
		const length = Math.sqrt(dx*dx + dy*dy);
		const alphaRadians = Math.atan(dy/dx);

		let alpha = alphaRadians * 180/Math.PI;
		if (dx < 0) {
			alpha += 180;
		}

		const changedStyle = {
			color: currentNode.style.color,
			borderLeft: '0px solid currentColor',
			borderRight: 'none',
			borderLeftWidth: length + 'px',
			borderRadius: '0 50% 50% 0',
			transform: `translate(0, -${nodeBaseRadius}px) rotate(${alpha}deg)`, // use this with height
			transformOrigin: 'center left',
		};

		const traceElm = document.createElement('div');
		traceElm.classList.add('mood-trace');
		Object.assign(traceElm.style, changedStyle);

		currentNode.appendChild(traceElm);
	}

	const createIdleTrace = function(employee) {
		const currentNode = graphElm.querySelector(`.employee-node[data-email="${employee.email}"]`);
		const traceRadius = nodeBaseRadius + 6;

		const changedStyle = {
			color: currentNode.style.color,
			width: '0px',
			height: '0px',
			background: 'solid',
			border: `${traceRadius}px solid`,
			transform: `translate(-${traceRadius}px, -${traceRadius}px)`,
		};

		const traceElm = document.createElement('div');
		traceElm.classList.add('mood-trace');
		Object.assign(traceElm.style, changedStyle);

		currentNode.appendChild(traceElm);
	}

	const removeTraces = function() {
		graphElm.querySelectorAll('.mood-trace').forEach((traceElm) => { 
			traceElm.parentNode.removeChild(traceElm);
		});
	}

	const drawRegularGraph = function() {
		removeTraces();

		let employeesToShow = weekDataToShow.employees;
		if (!expiredFilterToggle.checked) {
			employeesToShow = filterOutExpired(employeesToShow);
		}
		employeeNodes = processEmployeeNodes(employeesToShow);
		
		simulate(employeesToShow, employeeNodes);
	}

	const drawExpiredGraph = function() {
		removeTraces();

		let employeesToShow = filterForMissing(weekDataToShow.employees)
		if (!expiredFilterToggle.checked) {
			employeesToShow = filterOutExpired(employeesToShow);
		}
		employeeNodes = processEmployeeNodes(employeesToShow);

		simulate(employeesToShow, employeeNodes);
	}

	const drawFilteredGraph = function() {
		if (missingFilterToggle.checked) {
			drawExpiredGraph();
		} else {
			drawRegularGraph();
		}
	}


// ---------------------------------------------------------------------------------
// Interface
// ---------------------------------------------------------------------------------	

	/**
	* update current week display
	* @returns {undefined}
	*/
	const updateWeekDisplay = function() {
		const prevElm = document.getElementById('show-prev-period');
		const nextElm = document.getElementById('show-next-period');
		if (cWeekIdx === 0) {
			prevElm.setAttribute('disabled', 'disabled');
		} else {
			prevElm.removeAttribute('disabled');
		}

		if (cWeekIdx === dividedWeekData.length - 1) {
			nextElm.setAttribute('disabled', 'disabled');
		} else {
			nextElm.removeAttribute('disabled');
		}

		const mow = dividedWeekData[cWeekIdx].mondayOfWeek;
		const day = mow.toLocaleString('en-us', { weekday: 'long'});
		const month = mow.toLocaleString('en-us', { month: 'long'});

		document.getElementById('first-day__name').textContent = day;
		document.getElementById('first-day__date').textContent = mow.getDate();
		document.getElementById('first-day__month').textContent = month;
		document.getElementById('week-number__value').textContent = dividedWeekData[cWeekIdx].weekNumber;
	};

	const changeWeek = function(increment) {
		initWeekDataToShow(increment);
		updateWeekDisplay();
		drawFilteredGraph();
	}

	/**
	* 
	* @returns {undefined}
	*/
	const changeTeam = function() {
		document.getElementById('graph').innerHTML = '';
		drawFilteredGraph();
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

		missingFilterToggle.addEventListener('change', drawFilteredGraph);
		expiredFilterToggle.addEventListener('change', drawFilteredGraph);

		// init team selector
		for (const [teamId, team] of Object.entries(teams)) {
			if (team.name) {
				let option = document.createElement('option');
				option.textContent = team.name;
				option.value = teamId;
				teamSelector.appendChild(option);
			}
		};
		teamSelector.addEventListener('change', changeTeam);
	};

	const getCurrentWeekAwnsers = function() {
		answers = [];
		weekDataToShow.employees.forEach((employee) => {
			if (!employee.isMissingEntry && employee.answer) {
				answers.push(employee.answer);
			}
		});
		return answers;
	}

	/**
	* show a new answer to this period's question
	* @returns {undefined}
	*/
	const showNewAnswer = function() {
		clearTimeout(answerTimer);
		if (!currentAnswer || answers.indexOf(currentAnswer) === answers.length - 1) {
			currentAnswer = answers[0];
		} else {
			currentAnswer = answers[answers.indexOf(currentAnswer) + 1];
		}
		document.getElementById('period-answer').textContent = currentAnswer;
		answerTimer = setTimeout(showNewAnswer, 6000);
	};
	
	/**
	* show answers for current period
	* @returns {undefined}
	*/
	const showAnswers = function() {
		const answerBox = document.getElementById('period-remarks-box');
		answers = getCurrentWeekAwnsers();
		const activeClass = 'period-remarks-box--is-visible';

		if (answers.length) {
			answerBox.classList.add(activeClass);
		} else {
			answerBox.classList.remove(activeClass);
		}
			
		// document.getElementById('period-question').textContent = 'Remarks';
		showNewAnswer();
	};


// ---------------------------------------------------------------------------------
// Data processing
// ---------------------------------------------------------------------------------

	/**
	* get the currently selected team
	* @returns {undefined}
	*/
	const getCurrentTeam = function() {
		const teamIdx = teamSelector.value;
		return teams[teamIdx];
	};

	const employeesfilterForCurrentTeam = function(employeesToFilter) {
		if (getCurrentTeam().emails.length === 0) { return employeesToFilter }
		const filteredEmployees = [];
		employeesToFilter.forEach((employee) => {
			const isBlacklisted = teams.blacklist.emails.indexOf(employee.email) !== -1;
			const isInTeam = getCurrentTeam().emails.indexOf(employee.email) !== -1;
			if (!isBlacklisted && isInTeam) {
				filteredEmployees.push(employee);
			}
		})
		return filteredEmployees;
	}

	const filterOutExpired = function(employeesToFilter) {
		const team = employeesfilterForCurrentTeam(employeesToFilter);
		return team.filter((employee) => { return !employee.isExpired });
	}

	const filterForMissing = function(employeesToFilter) {
		const team = employeesfilterForCurrentTeam(employeesToFilter);
		return team.filter((employee) => { return employee.isMissingEntry });
	}

	const initWeekDataToShow = function(increment = 0) {
		const maxIndex = dividedWeekData.length - 1;
		if (increment === 0) {
			cWeekIdx = maxIndex;
		} else if (increment > 0) {
			cWeekIdx++;
			if (cWeekIdx > maxIndex) {
				cWeekIdx = maxIndex;
			}
		} else if (increment < 0) {
			cWeekIdx--;
			if (cWeekIdx < 0) {
				cWeekIdx = 0;
			}
		}
		weekDataToShow = dividedWeekData[cWeekIdx];

		updateWeekDisplay();
		showAnswers();
	}

	const addMissingEmployees = function() {
		for (let i = 0; i < dividedWeekData.length - 1; i++) {
			dividedWeekData[i].employees.forEach((employee) => {
				// if (!employee.expired) {
				const employeeFound = dividedWeekData[i+1].employees.find((knownEmployee) => {
					return knownEmployee.email.toLowerCase() === employee.email.toLowerCase();
				});
				if (employeeFound === undefined) {
					dividedWeekData[i+1].employees.push(employee.copyAsMissing());
				}
				// }
			});
		}
	}

	const addAverageData = function() {
		dividedWeekData.forEach((weekData) => {
			weekData.addAverage();
		});
	}

	/**
	* divide sheet data in array per week
	* @returns {array}
	*/
	const divideWeekData = function(data) {
		const lastWeek = { weekNr: 0,	year: 0	};
		let existingWeekData;
		data.forEach((row) => {
			let { weekNr, year, nextMonday } = getRowWeekDateInfo(row);
			
			if (weekNr !== lastWeek.weekNr) {
				if (year !== lastWeek.year) {
					weekNr += lastWeek.weekNr;
				}
				existingWeekData = dividedWeekData.find((weekData) => {
					return weekData.weekNumber === weekNr;
				});
			}

			if (existingWeekData === undefined) {
				dividedWeekData.push(new WeekData(weekNr, year, nextMonday));
				lastWeek.weekNr = weekNr;
				lastWeek.year = year;
				existingWeekData = dividedWeekData[dividedWeekData.length - 1];
			}
			dividedWeekData[dividedWeekData.indexOf(existingWeekData)].addEmployee(row);
		});
		addAverageData();
		addMissingEmployees();
		return dividedWeekData;
	}

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
			const nextMonday = getMondayOfNextWeek(tm);
			const weekNr = getWeekNumber(nextMonday)[1];

			return {
				weekNr,
				year,
				nextMonday
			};
		};

		const getMondayOfNextWeek = function(date) {
			const newDate = new Date(date.getTime());
			newDate.setDate(newDate.getDate() + (8 - newDate.getDay()) % 7);
			return newDate;
		}

		/**
		* get Monday of week by week number
		* https://stackoverflow.com/questions/16590500/javascript-calculate-date-from-week-number
		* @param {number} weekNr - the week number
		* @param {number} year
		* @returns {Date}
		*/
		const getDateOfISOWeek = function(weekNr, year) {
			var simple = new Date(year, 0, 1 + (weekNr - 1) * 7);
			var dayOfWeek = simple.getDay();
			var ISOweekStart = simple;
			if (dayOfWeek <= 2) {
				ISOweekStart.setDate(simple.getDate() - simple.getDay() + 1);
			} else {
				ISOweekStart.setDate(simple.getDate() + 8 - simple.getDay());
			}
			return ISOweekStart;
		}

	//-- End helper functions

	/**
	* create teams objects
	* @returns {undefined}
	*/
	const initTeams = function(teamsData) {
		teamsData.forEach((teamData) => {
			if (teamData[0] === excludeFromChartId) {
				teamData.forEach((value, i) => {
					if (i > 0) {
						teams.blacklist.addEmail(value)
					}
				});
			} else {
				const team = new Team(teamData[0])
				teamData.forEach((value, i) => {
					if (i > 0) {
						team.addEmail(value);
					}
				});
				teams[team.name] = team;
			}
		});
	};

	/**
	 * process complete dataset and prepare correct weekdataset for graph
	 * @param {array} data
	 * @returns {undefined}
	 */
	const prepareDataToDisplay = function(data) {
		divideWeekData(data);
		initWeekDataToShow();
	}


// ---------------------------------------------------------------------------------
// Script kickoff and initialization
// ---------------------------------------------------------------------------------

	/**
	 * reads teams data from sheet
	 * @returns {promise} promise response's result-property
	 */
	const readTeamsData = function() {
		const sheetTeamTabName = 'Teams in happiness chart';
		const teamsRange = `'${sheetTeamTabName}'!2:10000`;// range in a1 notation 
		return sheetHelper.getData({spreadsheetId, range: teamsRange, majorDimension:'COLUMNS'});
	}

	/**
	 * reads happiness data from sheet
	 * @returns {promise} promise response's result-property
	 */
	const readHappinessData = function() {
		const sheetHappinessTabName = 'Team happiness responses';
		const happinessCellRange = 'A2:Z';// all columns, skip 1st row with titles
		const happinessRange = `'${sheetHappinessTabName}'!${happinessCellRange}`;// range in a1 notation https://developers.google.com/sheets/api/guides/concepts#a1_notation
		return sheetHelper.getData({spreadsheetId, range: happinessRange});
	}

	/**
	 * kicks off data processing and page construction once data promises are resolved
	 * @returns {undefined}
	 */
	const processPage = function() {
		Promise.all([readTeamsData(), readHappinessData()])
			.then((results) => {
				const teams = results[0].values;
				const happinessData = results[1].values;
				initTeams(teams);
				initInterface();
				prepareDataToDisplay(happinessData);
				drawFilteredGraph();
			});
	}

	/**
	* gets data from google sheet
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

	/**
	* initializes all functionality
	* @returns {undefined}
	*/
	const init = function() {
		document.body.addEventListener('googlesheethelperenabled', processPage);
		getSheetHelper();
	};

	// kicks of the script when all dom content has loaded
	document.addEventListener('DOMContentLoaded', init);
})();
