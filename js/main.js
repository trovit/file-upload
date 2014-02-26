$(document).ready(function() {
    var $filesButton = $('.uploadButton');

    $filesButton.trovitUpload({
        debug:              true,
        extensions:         ['jpg', 'jpeg', 'jpe', 'png'],
        url:                '/ajax/upload.php',
        maxSize:            2048,
        loaderSrc:          '/images/round-loader.gif',
        loaderWidth:        32,
        loaderHeight:       32,
        defaultText:        'Default'
    });
});

