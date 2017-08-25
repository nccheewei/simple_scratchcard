var isMouseDown = false;

var scratchJsFlashArray = [];
function scratchJsFlashCallback(f,p,c) {
	if(typeof c !== 'undefined') {
		var counter = window[f];
		if(typeof counter === 'function') {
			counter(c, scratchJsFlashArray[p]);
		}
	} else {
		var callback = window[f];
		if(typeof callback === 'function') {
			callback(scratchJsFlashArray[p]);
		}	
	}
}

function createScratchCard(init) {
	var settings = {
		topImage: new Image(),
		bottomImage: new Image(),
		coinImage: new Image(),
		thickness: 20,
		endAt: 95,
		defaultCursor: 'pointer',
		counter: false
	};

	
	//-------------------------------------------------------------------------//
	// Setup all required variables                                            //
	//-------------------------------------------------------------------------//
	var covered = 0; // Set the covered area
	var update = 0; // Use to reduce the number of time covered area' size is checked
	var counter; // Will contain the function that will be called each time the card is scratched off
	var container;
	var cWidth;
	var cHeight;
	var transparentAtStart; // proportion of the transparent pixels in theforeground image 

	var originalWidth = 0;
	var originalHeight = 0;
	var ratio = 1; // set up the ratio variable, used to adapt the thickness on resize

	var touch = false;
	var limit = 10; // limit the number of time the percentage is calculated, reduce lag
	var jump = 20; // number of pixel ignored for one pixel analyzed, reduce lag

	if(typeof init.resizeTrigger === 'undefined') {
		init.resizeTrigger;
	}
	if(typeof init.hasEnded === 'undefined') {
		init.hasEnded = false;
	}
	if(typeof init.width !== 'undefined' && typeof init.height !== 'undefined') {
		cWidth = init.width;
		cHeight = init.height;
	}
	//-------------------------------------------------------------------------//

	
	//-------------------------------------------------------------------------//
	//  Setup all the options specified by the user                            //
	//-------------------------------------------------------------------------//
	
	//Check if canvas is supported by the browser, if not fall back to flash
	if(!window.HTMLCanvasElement || init.flash == true) {
		if(typeof init.flashPath !== 'undefined') {
			if(typeof init.background != 'undefined') {
				settings.bottomImage.onload = function() {
					var flashPlayer = document.createElement('object');
						flashPlayer.type = 'application/x-shockwave-flash';
						flashPlayer.data = init.flashPath;
						if(typeof init.container !== 'undefined' && init.container.offsetWidth*init.container.offsetHeight != 0) {
							flashPlayer.width = init.container.offsetWidth;
							flashPlayer.height = init.container.offsetHeight;
						} else {
							flashPlayer.width = settings.bottomImage.width;
							flashPlayer.height = settings.bottomImage.height;	
						}
					var parameters = 'backgroundImage='+init.background+'&foregroundImage='+init.foreground;
					
					var l = scratchJsFlashArray.length;
					scratchJsFlashArray.push(init);
					parameters += '&init='+l;

					if(typeof init.coin !== 'undefined') {
						parameters += '&coin='+init.coin;
					} else {
						parameters += '&cursor='+settings.defaultCursor;
					}
					if(typeof init.thickness !== 'undefined') {
						parameters += '&thickness='+init.thickness;
					} else {
						parameters += '&thickness='+settings.thickness;
					}
					if(typeof init.percent != 'undefined') {
						parameters += '&percent='+init.percent;
					} else {
						parameters += '&percent='+settings.endAt;
					}
					if(typeof init.counter != 'undefined') {
						parameters += '&counter='+init.counter;
					}
					if(typeof init.callback != 'undefined') {
						parameters += '&callback='+init.callback;
					}
					var flashMovie = document.createElement('param');
						flashMovie.name = 'movie';
						flashMovie.value = init.flashPath;
					var flashVars = document.createElement('param');
						flashVars.name = 'FlashVars';
						flashVars.value = parameters;
					var flashContent = document.createElement('param');
						flashContent.name = 'FlashContent';
						flashContent.value = init.flashPath;
					var embed = document.createElement('embed');
						embed.src = init.flashPath;
						embed.width = flashPlayer.width;
						embed.height = flashPlayer.height;
						embed.type = 'application/x-shockwave-flash';

					if(navigator.userAgent.toLowerCase().indexOf('msie') != -1) { // if internet explorer < 11
						init.container.innerHTML = '<object type="application/x-shockwave-flash" data="'+init.flashPath+'" width="'+flashPlayer.width+'" height="'+flashPlayer.height+'" ><param name="movie" value="'+init.flashPath+'" /><param name="FlashVars" value="'+parameters+'" /></object>';
					} else {
						flashPlayer.appendChild(flashMovie);
						flashPlayer.appendChild(flashVars);
						flashPlayer.appendChild(flashContent);
						flashPlayer.appendChild(embed);
						init.container.appendChild(flashPlayer);
					}
					
					// API functions for Flash
					init.locked = true;
					init.container.lock = function lock(l) {
						if(typeof l === 'undefined') {
							l = init.locked;
						}
						init.locked = !init.locked;
						flashPlayer.lock(l);
					}
					init.container.restart = function() {
						flashPlayer.restart();
					}
					init.container.clean = function() {
						flashPlayer.clean();
					}
				}
				settings.bottomImage.src = init.background;
			}
			return false;
		} else {
			container.innerHTML = 'Your browser does not support HTML5 canvas tag.';
		}
	}


	// Setup the container of the scratch card
	if(typeof init.container != 'undefined') {
		container = init.container;

		cWidth = container.offsetWidth;
		cHeight = container.offsetHeight;

		// Set the css position of the container to relative
		container.style.setProperty('position', 'relative', 'important');


		// remove the container padding
		container.style.setProperty('padding', '0', 'important');

		disableSelection(container);
	} else {
		return false;
	}

	
	

	// Set the background image
	if(typeof init.background != 'undefined' && !init.hasEnded) {
		settings.bottomImage.onload = function() {
			// This part make sure that the container has a width and a height defined
			// If not, it will use the size of the bottom image

			if(cWidth != 0 && cHeight == 0) {
				originalHeight = 'auto';
				cHeight = (cWidth / settings.bottomImage.width)*settings.bottomImage.height;
				container.style.height = cHeight+'px';
			} else if(cWidth == 0 && cHeight != 0) {
				originalWidth = 'auto';
				cWidth = (cHeight / settings.bottomImage.height)*settings.bottomImage.width;
				container.style.width = cWidth+'px';

			} if((cWidth*cHeight) == 0) {
				originalWidth = 'auto';
				originalHeight = 'auto';
				cWidth = settings.bottomImage.width;
				cHeight = settings.bottomImage.height;
				container.style.width = cWidth+'px';
				container.style.height = cHeight+'px';
			}
			if(typeof init.responsiveRatio == 'undefined') {
				init.responsiveRatio = cWidth / settings.bottomImage.width; // 1
				ratio = (cWidth / settings.bottomImage.width)/init.responsiveRatio;
			} else {
				ratio = cWidth / settings.bottomImage.width;
				ratio = (cWidth / settings.bottomImage.width)/init.responsiveRatio;
			}

			// here we set the overlay width and height
			overlay.width  = cWidth;
			overlay.height = cHeight;
			disableSelection(overlay);
			setupScratchElements();
		}
		settings.bottomImage.src = init.background;
	} else {
		return false;
	}


	// Setup the canvas and get its context
	var overlay = document.createElement('canvas');
		overlay.className = 'scratchcard-Overlay';
	var overctx = overlay.getContext('2d');
	
	// Reset default canvas position at 0,0
	overctx.translate(0,0);

	// Setup the cursor
	var cursor = document.createElement('div');
		cursor.className = 'scratchcard-Cursor';
	var cursorW = 0;
	var cursorH = 0;
	//

	function triggerResizeFunction() {
		clearTimeout(init.resizeTrigger);
		init.resizeTrigger = setTimeout(documentResize, 100);
	}
	function documentResize() {
		window.removeEventListener('resize', documentResize);
		clear(false);
		createScratchCard(init);
	}

	// this function is called once the background image has been loaded
	function setupScratchElements() {

		// Set the foreground image
		// If an hexadecimal color is specified, fill the foreground with it
		// If nothing is specified, the canvas will be transparent
		if(typeof init.foreground != 'undefined' && !init.hasEnded) {
			if ( init.foreground.charAt(0) === '#' && ((init.foreground.length == 4) || (init.foreground.length == 7)) ) {
				//container.style.backgroundColor = init.foreground;
				overctx.fillStyle = init.foreground;
				overctx.fillRect(0, 0, cWidth, cHeight);
				if(typeof init.scratchedOverlay !== 'undefined') {
					overctx.globalCompositeOperation = 'destination-out';
					overctx.drawImage(init.scratchedOverlay, 0, 0, cWidth, cHeight);
				}
				displayScratchcard();
			} else {
				settings.topImage.crossOrigin = 'anonymous';
				settings.topImage.src = init.foreground;
				settings.topImage.onload = function(){
					if(typeof init.scratchedOverlay !== 'undefined') { // if the overlay has already been drawn
						overctx.drawImage(settings.topImage, 0, 0, cWidth, cHeight);
						overctx.globalCompositeOperation = 'destination-out';
						overctx.drawImage(init.scratchedOverlay, 0, 0, cWidth, cHeight);
					} else { // else draw the top image normally
						overctx.drawImage(settings.topImage, 0, 0, cWidth, cHeight);
					}

					displayScratchcard();
				};
			}
		} else {
			return false;
		}
		
		

		// Set the percentage limit where the script will trigger the end event
		if(typeof init.percent != 'undefined') {
			settings.endAt = init.percent;
		}

		// Setup the coin image as a cursor
		if(typeof init.coin != 'undefined') {
			settings.coinImage.src = init.coin;
			settings.coinImage.onload = function(){
					cursorW = settings.coinImage.width*ratio;
					cursorH = settings.coinImage.height*ratio;
				cursor.style.width = cursorW+'px';
				cursor.style.height = cursorH+'px';
				cursor.style.background = 'url("'+init.coin+'") no-repeat left top';
				cursor.style.backgroundSize = '100%';
				setCursorCssProperties();
			}
		} else {
			// Define the cursor used if no coin image is specified
			overlay.style.cursor = settings.defaultCursor;
		}


		// Set the thickness of the brush in pixel
		if(typeof init.thickness != 'undefined') {
			settings.thickness = init.thickness;
		}

		// Set the function that will be called each time the size of the discovered area change
		if(typeof init.counter != 'undefined') {
			settings.counter = init.counter;
			counter = window[init.counter];
		}
		document.body.addEventListener('touchstart', function() { touch = true; }, false);

		overlay.addEventListener('mousedown', scratchOff); // allow to draw a dot if there is a click but no mouse move
		overlay.addEventListener('mousemove', scratchOff);
		document.addEventListener('mouseup', mouseOff); // stop scratching off even if the mouse is out of the canvas

		// smartphone events
		overlay.addEventListener('touchstart', scratchOff);
		overlay.addEventListener('touchmove', scratchOff);
		document.addEventListener('touchend', mouseOff);


		// Cursor events (move and display/hide the cursor)
		overlay.addEventListener('mouseover', mouseEnter);
		overlay.addEventListener('mouseout', mouseExit);
		overlay.addEventListener('mousemove', mouseMove);

	}
	function getPosition(element) {
		var xPosition = 0;
		var yPosition = 0;

		while(element) {
			xPosition += (element.offsetLeft  + element.clientLeft); //- element.scrollLeft
			yPosition += (element.offsetTop  + element.clientTop);//- element.scrollTop
			element = element.offsetParent;
		}

		return { x: xPosition, y: yPosition };
	}

	function displayScratchcard() {
		// this listener will be triggered when the window is resized
		window.addEventListener('resize', triggerResizeFunction);

		// add the canvas and the cursor to the container
		container.appendChild(overlay);
		container.appendChild(cursor);

		// setting the background image only now avoid revealing it before the foreground image is loaded
		container.style.background = 'url("'+init.background+'") center center no-repeat';
		// we adapt the background image size to the container
		container.style.backgroundSize = '100%';
	}

	// If an image is used as a cursor, set all css properties for that image
	function setCursorCssProperties() {
		container.style.cursor = 'none';
		cursor.style.position = 'absolute';
		cursor.style.display = 'none';
		cursor.style.zIndex = '9000';
		cursor.style.top = 0;
		cursor.style.left = 0;
		cursor.style.pointerEvents = "none";
		disableSelection(cursor);
	}

	// This function paint a transparent color over the foreground image,
	// thus erasing it and showing the background image
	function scratchOff(event) {
		// this variable is used as a parameter for the scratchPercent function
		// it allows to update the discovered percents for each click
		var click = false;

		if(event.type == 'touchmove') {
			event.preventDefault();
			click = false;
		} else if(event.type == 'mousedown' || event.type == 'touchstart') {
			isMouseDown = true;
			click = true;
		}
		scratchPercent(true);

		if (isMouseDown) {
			var x = event.pageX - this.offsetLeft;
			var y = event.pageY - this.offsetTop;

			var p = getPosition(container);
			x = ((event.pageX)  - p.x);
			y = ((event.pageY)  - p.y);

			if(event.type == 'touchmove' || event.type == 'touchstart') {
				limit = 20; // reduce lags
				var touch = event.touches[0]; // Get information from the first touch event (first finger on screen)
				x = touch.pageX  - p.x; // Get X position
				y = touch.pageY  - p.y; // Get Y position
			}
			overctx.save();
			overctx.globalCompositeOperation = 'destination-out';
			overctx.beginPath();
			overctx.arc(x,y,(settings.thickness*ratio),0,2*Math.PI,false);
			overctx.closePath();
			overctx.fillStyle = 'rgba(0, 0, 0, 1)';
			overctx.fill();

			overctx.restore();


			// Fix for a bug on some android phone where globalCompositeOperation prevents canvas to update
			if(event.type == 'touchmove' || event.type == 'touchstart' || event.type == 'touchend') {
				overlay.style.marginRight = '1px';
				overlay.style.marginRight = '0px';
			}

			// If scratch off percents exceed limit, the end event will be triggered
			if(parseInt(scratchPercent(click)) >= settings.endAt) {
				clear(true);
			}
		}
	}

	function clear(ended) {

		// Remove all events listener
		
		overlay.removeEventListener('mousedown', scratchOff);
		overlay.removeEventListener('mousemove', scratchOff);
		document.removeEventListener('mouseup', mouseOff);
		overlay.removeEventListener('mouseover', mouseEnter);
		overlay.removeEventListener('mouseout', mouseExit);
		overlay.removeEventListener('mousemove', mouseMove);

		overlay.removeEventListener('touchstart', scratchOff);
		overlay.removeEventListener('touchmove', scratchOff);
		document.removeEventListener('touchend', mouseOff);
		container.addEventListener('touchmove', function(e) { e.preventDefault(); return false; });

		
		if(ended && !init.hasEnded) {
			init.hasEnded = true;

			// Reset the cursors to default
			container.style.setProperty('cursor', 'default', 'important');
			overlay.style.setProperty('cursor', 'default', 'important');
			cursor.style.display = 'none';

			delete init.scratchedOverlay;
			container.innerHTML = '';


			// Call the percent function if specified
			if(settings.counter != false) {
				if(typeof counter === 'function') {
					counter(covered, init);
				}
			}

			// Trigger the callback function if specified
			var callback = window[init.callback];
			if(typeof callback === 'function') {
				callback(init);
			}

		} else if(!ended && !init.hasEnded) {
			// this part is use for resize event, it keeps the existing overlay
			if(originalWidth != 0) {
				container.style.width = originalWidth;
			}
			if(originalHeight != 0) {
				container.style.height = originalHeight;
			}
			init.scratchedOverlay = generateMask();
			

			// avoid showing the result background on resize
			container.style.backgroundImage = 'none';
			
			// Remove the overlay and the cursor image
			container.innerHTML = '';
		}
	}

	function scratchPercent(click) {
		// divise by 10 the number of time percent are calculated to avoid stressing the cpu on smartphones
		if (update++%limit == 0 || click) {
			var ct = 0;
			var canvasData = overctx.getImageData(0,0, cWidth, cHeight).data;
			for (var i=0, l=(canvasData.length-jump); i<l; i+=(4*jump)) {
				if (canvasData[i] > 0) ct++;
			}
			if(typeof transparentAtStart === 'undefined') {
				transparentAtStart = ((cWidth*cHeight)/jump)-ct;	
			}
			covered = (100-(((ct)/(((cWidth*cHeight)/jump)-transparentAtStart))*(100))).toFixed(2);
		}

		// Call the percent function if specified
		if(settings.counter != false) {
			if(typeof counter === 'function' && covered > 0) {
				counter(covered, init);
			}
		}

		return (covered);
	}

	// this function generate a clipping mask on resize
	function generateMask() {
		var mask = document.createElement('canvas');
			mask.width  = cWidth;
			mask.height = cHeight;
		var maskCtx = mask.getContext('2d');
			maskCtx.translate(0,0);
			maskCtx.fillStyle = 'rgba(10, 11, 12, 200)';
			maskCtx.fillRect(0, 0, cWidth, cHeight);
		
		maskCtx.globalCompositeOperation = 'destination-out';
		maskCtx.drawImage(overlay, 0, 0, cWidth, cHeight);
		
		return mask;
	}

	function mouseOff() {
		isMouseDown = false;
	}


	function mouseEnter(event) {
		if(!touch) {
			cursor.style.display = 'block';
		}
	}

	function mouseExit(event) {
		cursor.style.display = 'none';
	}

	function mouseMove(event) {
		var p = getPosition(container);

		cursor.style.left = ((event.pageX)  - p.x - (cursorW/2))+'px';
		cursor.style.top = ((event.pageY)  - p.y - (cursorH/2))+'px';
	}

	function disableSelection(target) {
		// Make the target not selectable
		target.style.setProperty('-khtml-user-select', 'none', 'important');
		target.style.setProperty('-webkit-user-select', 'none', 'important');
		target.style.setProperty('-moz-user-select', '-moz-none', 'important');
		target.style.setProperty('-ms-user-select', 'none', 'important');
		target.style.setProperty('user-select', 'none', 'important');
		target.style.setProperty('-webkit-touch-callout', 'none', 'important');
		target.style.setProperty('-ms-touch-action', 'none', 'important')
	}
	
	// Those listeners and this function are a fix for android smartphone
	document.addEventListener('touchstart', cursorFix);
	document.addEventListener('touchmove', cursorFix);
	document.addEventListener('touchend', cursorFix);

	function cursorFix() {
		overlay.style.setProperty('cursor', 'default', 'important');
		document.removeEventListener('touchstart', cursorFix);
		document.removeEventListener('touchmove', cursorFix);
		document.removeEventListener('touchend', cursorFix);
	}



	//-------------------------------------------------------------------------//
	//  Setup the external control functions                                   //
	//-------------------------------------------------------------------------//
	init.locked = false;

	init.container.lock = function lock(l) {
		if(typeof l !== 'undefined') {
			init.locked = !l;
		}
		if(init.locked) {
			overlay.addEventListener('mousedown', scratchOff);
			overlay.addEventListener('mousemove', scratchOff);
			document.addEventListener('mouseup', mouseOff);
			overlay.addEventListener('mouseover', mouseEnter);
			overlay.addEventListener('mouseout', mouseExit);
			overlay.addEventListener('mousemove', mouseMove);

			overlay.addEventListener('touchstart', scratchOff);
			overlay.addEventListener('touchmove', scratchOff);
			document.addEventListener('touchend', mouseOff);
			if(typeof init.coin == 'undefined') {
				overlay.style.cursor = settings.defaultCursor;
			}
		} else {
			overlay.removeEventListener('mousedown', scratchOff);
			overlay.removeEventListener('mousemove', scratchOff);
			document.removeEventListener('mouseup', mouseOff);
			overlay.removeEventListener('mouseover', mouseEnter);
			overlay.removeEventListener('mouseout', mouseExit);
			overlay.removeEventListener('mousemove', mouseMove);

			overlay.removeEventListener('touchstart', scratchOff);
			overlay.removeEventListener('touchmove', scratchOff);
			document.removeEventListener('touchend', mouseOff);

			overlay.style.cursor = 'default';
		}
		init.locked = !init.locked;
	}

	init.container.restart = function() {
		init.hasEnded = false;
		clear(false);
		init.scratchedOverlay = undefined;
		window.removeEventListener('resize', documentResize);
		createScratchCard(init);
	}

	init.container.clean = function() {
		init.hasEnded = true;
		init.container.lock(true);

		delete init.scratchedOverlay;
		container.innerHTML = '';
		container.style.setProperty('cursor', 'default');
	}
}