// Check for phones
var mobileCheck
if (/Android|webOS|iPhone|iPod|iPad|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
	mobileCheck = true;
} else {
	mobileCheck = false;
}
