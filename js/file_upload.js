(function( $ ) {

    $.fn.trovitUpload = function(options) {
        if(this.length == 0) {
            return;
        }

        var $self = this,
            $placeholder,
            rPath = /.*(\/|\\)/,
            rExt = /.*[.]/,
            uidReplace = /[xy]/g,
            file,
            input = document.createElement( 'input' ),
            XhrOk,
            // Check for Safari - http://stackoverflow.com/a/9851769/1091949
            isSafari = Object.prototype.toString.call( window.HTMLElement ).indexOf( 'Constructor' ) > 0,
            multiple = false,
            upload = 0,
            disable = 0,
            disableDelete = false,
            queue = [],
            defaultImg = false,
            setted = true,
            checkExtension = true,
            $wrapper;

        // XHR uploads supported?
        input.type = 'file';
        XhrOk = (
            'multiple' in input &&
                typeof File !== 'undefined' &&
                typeof ( new XMLHttpRequest() ).upload !== 'undefined' );

        var settings = $.extend({
            debug:          false,
            autoSubmit:     true,
            maxSize:        false,
            maxUploads:     10,
            extensions:     [],
            url:            '',
            uploadUrl:      '',
            loaderSrc:      '',
            loaderWidth:    32,
            loaderHeight:   32,
            imageWidth:     70,
            imageHeight:    52,
            defaultText:    '',
            arrayImages:    [],
            defaultImgPos:  0,
            callBeforeUpload: null
        }, options );

        sendImages();

        /**
         * To avoid browser problems styling the input file
         * an invisible input is placed on the self button
         * self button must be placed in a position: relative container
         * to work properly if the layout changes
         */
        createButton();

        /**
         * This function show images if the user send us an array of images, the function checks if is possible to upload each image and show these images
         */
        function sendImages() {
            if(settings.arrayImages.length > 0) {
                disableSubmit();
                setted = true;
                checkExtension = false;
                queue = settings.arrayImages;
                file = queue[0];
                defaultImg = upload == settings.defaultImgPos ? true : false;
                if(checkImg()) {
                    prepareWrapper();
                    showImg();
                } else {
                    uploadAnother();
                }
            }
        }
        /**
         * This function check if the queue exceeds the limit of uploads, the extensions and the size (if browser can read the size of the file)
         */
        function checkImg() {
            var filename = typeof file == "string" ? file : XhrOk ? file.name.replace(rPath, ''): file.val().replace(rPath, ''),
                numExt = settings.extensions.length,
                extOk = false;

            if(upload >= settings.maxUploads) {
                log("You're trying to upload more than "+settings.maxUploads+" files");
                return false;
            }

            var ext = (-1 !== filename.indexOf('.')) ? filename.replace(rExt, '') : '';

            if (XhrOk) {
                var size = Math.round( file.size / 1024 );
            }

            if (numExt > 0 && checkExtension) {
                ext = ext.toLowerCase();

                while (numExt--) {
                    if ( settings.extensions[numExt].toLowerCase() == ext ) {
                        extOk = true;
                        break;
                    }
                }
                if (!extOk) {
                    log("File: "+filename+" - The extension "+ext+" is not permitted");
                    return false;
                }
            }
            if (size && settings.maxSize !== false && size > settings.maxSize) {
                log("The file "+filename+" is too large, max size: "+settings.maxSize);
                return false;
            }

            return true;
        }
        /**
         * if the upload system returns an image, this function put this on the wrapper created above, with event click to make the image default and the error event to delete this image wrapper
         */
        function showImg(imgFromServer) {
            var image = imgFromServer ? imgFromServer : file;
            var imgSrc = settings.uploadUrl+image+"?"+new Date().getTime();

            upload++;
            log("upload "+image);

            var $this = $('<div>').data('src',image).addClass('realImage').hide().appendTo($wrapper).click(function() {
                makeDefault($(this));
            });

            $('<img />').attr({'src':imgSrc,'width':settings.imageWidth,'height':settings.imageHeight}).load(function() {
                $this.css('background','url('+image+') center center no-repeat').fadeIn(300);
                $this.siblings('.imageLoader').fadeOut(300,function() {
                    $('<span />').addClass('deleteImg').insertBefore($(this)).click(function() {
                        if(!disableDelete) {
                            disableDelete = true;
                            var callback = function() {
                                unqueueImg();
                                enableSubmit();
                                disableDelete = false;
                            };
                            deleteImg($(this).siblings('.realImage'),image,false,callback);
                        }
                    });
                    $(this).remove();
                    if(defaultImg) {
                        makeDefault($this);
                    }
                    uploadAnother();
                });
            }).error(function() {
                var callback = function() {
                    uploadAnother();
                };
                deleteImg($this,image,true,callback);

            });
        }
        /**
         *  Wrapper of the uploaded images
         */
        function prepareWrapper() {

            if(!$placeholder) {
                $placeholder = $('<div />').addClass('wrapper').appendTo($('<div />').addClass('imagePlaceholder').insertAfter($self));
                $('<span />').addClass('imagesSubtitle').text("Images").appendTo($placeholder);
            }

            $wrapper = $('<div />').addClass('imageWrapper').css({'width':settings.imageWidth,'height':settings.imageHeight}).appendTo($placeholder);
            $('<img />').addClass('imageLoader').attr({'src':settings.loaderSrc,'width':settings.loaderWidth,'height':settings.loaderHeight}).appendTo($wrapper);
        }
        /**
         * Delete the image selected
         * @param {jQueryElement} $img - element to delete
         * @param {string} filename - image name
         * @param {boolean} showError - if true, shows an error
         * @param {function} callback
         */
        function deleteImg($img,filename,showError,callback) {
            upload--;
            $img.parent().fadeOut(300,function(){
                $(this).remove();
                if($placeholder.find('.realImage').length == 0) {
                    $placeholder.parent().remove();
                    $placeholder = null;
                }
                if(showError) {
                    log("File: "+filename+" not found");
                }
                if (callback && typeof(callback) === "function") {
                    callback();
                }
            });
        }
        /**
         * This function makes default the image selected
         * @param {jQueryElement} $elem - element to make default
         */
        function makeDefault($elem) {
            $placeholder.find('.imageWrapper').removeClass('default');
            $placeholder.find('.defaultText').remove();
            $elem.parent().addClass('default');
            $('<span />').addClass('defaultText').text(settings.defaultText).insertBefore($elem);
        }
        /**
         * Unqueue the image
         */
        function unqueueImg() {
            queue.splice(0,1);
            enableSubmit();
        }
        /**
         * Enables the button
         */
        function enableSubmit() {
            if(queue.length == 0 && upload < settings.maxUploads) {
                disable = 0;
                $self.removeClass('disabled');
            }
            if(queue.length == 0) {
                if($placeholder) {
                    $placeholder.parent().removeClass('disable');
                }
                disableDelete = false;
            }
        }
        /**
         * Disables the button
         */
        function disableSubmit() {
            disable = 1;
            disableDelete = true;
            if($placeholder) {
                $placeholder.parent().addClass('disable');
            }
            $self.addClass('disabled');
        }
        /**
         * This function tries to upload or show the next image
         */
        function uploadAnother() {
            unqueueImg();
            enableSubmit();
            if(settings.arrayImages.length > 0) {
                sendImages();
            } else {
                setted = false;
                checkExtension = true;
                send();
            }
        }
        /**
         * input file constructor, with events change, click and mousemove
         */
        function createButton() {

            var $div = $('<div />').css({
                'display':      'block',
                'position':     'absolute',
                'overflow':     'hidden',
                'margin':       0,
                'padding':      0,
                'opacity':      0,
                'direction':    'ltr',
                'zIndex':       1
            });

            var $input = $('<input />').css({
                'position':     'absolute',
                'right':        0,
                'margin':       0,
                'padding':      0,
                'fontSize':     '480px',
                'fontFamily':   "'Open Sans', sans-serif",
                'cursor':       'pointer'
            }).attr({'type':'file','name':'file'});

            if (XhrOk && !isSafari) {
                $input.attr({'multiple':'multiple'});
                multiple = true;
            }

            if ($div[0].style.opacity !== '0') {
                $div[0].style.filter = 'alpha( opacity=0 )';
            }

            $input.change(function() {
                var i, total;

                if ($(this).val() === '') {
                    return;
                }

                if (!XhrOk) {
                    queue.push( $input );
                } else {
                    total = $(this).prop('files').length;

                    if (!multiple) {
                        total = 1;
                    }

                    for (i = 0; i < total; i++) {
                        queue.push( $(this).prop('files')[i] );
                    }
                }

                $input.remove().detach();
                $div.remove().detach();

                if(settings.autoSubmit) {
                    send();
                }

                createButton();

            })
            .click(function (){
                if (disable) {
                    return false;
                }

                if (settings.callBeforeUpload && typeof settings.callBeforeUpload === 'function') {
                    if (!settings.callBeforeUpload()) return false;
                }
            })
            .mousemove(function (){
                if(disable) {
                    $(this).css('cursor','default');
                }else {
                    $(this).css('cursor','pointer');
                }
            });

            $input.appendTo($div);
            $div.insertAfter($self);
            
            $div.css({
                'top':      Math.round($self.position().top),
                'left':     Math.round($self.position().left),
                'width':    $self.outerWidth(),
                'height':   $self.outerHeight(true)
            });
        }
        /**
         * This function checks if is possible to upload and use the modern upload system if browser can, otherwise use the old system
         */
        function send() {
            if (setted == false) {
                settings.arrayImages = [];
            }
            if(queue.length == 0) {
                return false;
            }
            disableSubmit();
            file = queue[0];
            if(checkImg()) {
                defaultImg = false;
                prepareWrapper();
                !XhrOk ? oldUpload() : modernUpload();
            } else {
                unqueueImg();
                enableSubmit();
                send();
            }
        }
        /**
         * Old system, this creates a form that upload the unique image via iframe, the response of that submit is the source of the image
         */
        function oldUpload() {
            log("old");
            var uId = getUID();

            var html = '<iframe src="javascript:false;" name="' + uId + '" />';
            var div = document.createElement( 'div' );
            div.innerHTML = html;
            var iframe = div.firstChild;
            div.removeChild( iframe );
            document.body.appendChild( iframe );
            iframe.style.display = 'none';
            iframe.id = uId;


            var $form = $('<form />').attr({
                'method':   'POST',
                'enctype':  'multipart/form-data',
                'encoding': 'multipart/form-data',
                'action':   settings.url,
                'target':   uId
            }).css({'display':'none'});

            $form.append(file);

            $form.appendTo($('body'));

            $form.submit();

            $(iframe).load(function () {
                var image = iframe.contentWindow.document.body.innerHTML;
                if(image == 0) {
                    log('Server Error');
                    removeWrapper();
                } else if(image == 1) {
                    var filename = typeof file == "string" ? file : XhrOk ? file.name.replace(rPath, ''): file.val().replace(rPath, '');
                    log("The file "+filename+" is too large, max size: "+settings.maxSize);
                    removeWrapper();
                } else {
                    showImg(image);
                }
            });
        }
        /**
         * Modern system, via Ajax
         */
        function modernUpload() {
            log("modern");
            var myForm = new FormData();
            myForm.append("file", file);
            $.ajax({
                url:            settings.url,
                type:           'POST',
                data:           myForm,
                cache:          false,
                contentType:    false,
                processData:    false,
                timeout:        10000,
                error: function(){
                    log("Server error");
                    removeWrapper(true);
                },
                success: function(image)
                {
                    if(image == 0) {
                        log("Server error");
                        removeWrapper(true);
                    } else if(image == 1) {
                        var filename = typeof file == "string" ? file : XhrOk ? file.name.replace(rPath, ''): file.val().replace(rPath, '');
                        log("The file "+filename+" is too large, max size: "+settings.maxSize);
                        removeWrapper(true);
                    } else {
                        showImg(image);
                    }
                }
            });
        }
        /**
         * Removes the wrapper if the wrapper is empty
         * @param {boolean} resend - if resend is true, tries to upload the next image in the queue
         */
        function removeWrapper(resend) {
            $wrapper.fadeOut(300,function() {
                if($placeholder.find('.realImage').length == 0) {
                    $placeholder.parent().remove();
                    $placeholder = null;
                }
                $(this).remove();
                unqueueImg();
                if(resend) {
                    send();
                }
            });
        }
        /**
         * Returns an unique Id
         * http://stackoverflow.com/a/2117523/1091949
         */
        function getUID() {
            return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(uidReplace, function(c) {
                var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
                return v.toString(16);
            });
        }
        /**
         * log error and messages when debug is enabled
         */
        function log(message) {
            if ( settings.debug && window.console ) {
                console.log( '[trovitUpload]: ' + message );
            }
        }
        function animateError($element) {
            var actualMarginLeft = parseInt($element.css('margin-left'));
            $element.animate({marginLeft: actualMarginLeft+10}, 100, function() {
                $(this).animate({marginLeft: actualMarginLeft-10}, 100, function () {
                    $(this).animate({marginLeft: actualMarginLeft}, 100);
                }).delay(3000).fadeOut(300,function() {
                    $(this).remove();
                });
            });
        }
    };

}( jQuery ));