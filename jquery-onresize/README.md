# jQuery UI onresize widget

jQuery UI widget enabling cross browser resize events on regular (non-void) elements, without using iframes or timers.

Tested in Chrome, Firefox, Safari, Opera, and Internet Explorer 9+.

[Try it in jsFiddle](https://jsfiddle.net/spacemanspiffiest/77gjeunv/embedded/result/)

## Download

* [Raw GitHub Source](https://raw.github.com/ChrisAckerman/jquery-onresize/1.0.5/jquery.onresize.min.js)
* [CDN](https://cdn.rawgit.com/ChrisAckerman/jquery-onresize/1.0.5/jquery.onresize.min.js)

## Example

```html
<head>
	<script src="jquery.js"></script>
	<script src="jquery-ui.js"></script>
	<script src="jquery.onresize.js"></script>
	<script>
	$(function() {
		$('#myElement').onresize(function(e) {
			console.log('width: %s, height: %s', $(this).width(), $(this).height());
		});

		// Alternatively...
		$('#myElement').onresize().on('resize', function(e) {
			console.log('width: %s, height: %s', $(this).width(), $(this).height());
		});

		$('#myElement').css({
			height: '20px',
			width: '20px'
		});
	});
	</script>
</head>
<body>
	<div id="myElement"></div>
</body>
```