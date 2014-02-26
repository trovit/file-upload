<?php
    
    $uploadUrl = '/var/www/images';

    $new_file_name = strtolower($_FILES['file']['name']);
    $new_images = "thumb_".$_FILES["file"]["name"];

    $image_info = getimagesize($_FILES['file']['tmp_name']);
    $image_type = $image_info[2];
    if( $image_type == IMAGETYPE_JPEG ) {
        $image = imagecreatefromjpeg($_FILES['file']['tmp_name']);
    } elseif( $image_type == IMAGETYPE_PNG ) {
        $image = imagecreatefrompng($_FILES['file']['tmp_name']);
    }


    $new_image = imagecreatetruecolor(70, 52);
    imagecopyresampled($new_image, $image, 0, 0, 0, 0, 70, 52, imagesx($image), imagesy($image));
    $image = $new_image;

    if( $image_type == IMAGETYPE_JPEG ) {
        imagejpeg($image,$uploadUrl.$new_images,75);
    } elseif( $image_type == IMAGETYPE_PNG ) {
        imagepng($image,$uploadUrl.$new_images);
    }

    echo "/images/file_upload_images/".$new_images;