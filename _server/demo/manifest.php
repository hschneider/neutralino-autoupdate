<?php
// update.php 1.0.0
//
// Adds a security layer to the update mechanism:
// This script checks the incoming request for the secret app token
// in the X-Auth-App header.
// Only when this token is valid, the manifest.json will be delivered.
//
// (c)2023 Harald Schneider - marketmix.com
//

// Enter the secret app token here:
//
$appToken = 'hB9rV7cS3tD3bU1wA8vY3pQ5fO4qO6sP';

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, X-Auth-App');
header('Access-Control-Expose-Headers: X-Auth-App');

$h = getallheaders();
if(!isset($h['X-Auth-App'])) {
    die;
}
if($h['X-Auth-App'] === $appToken) {
    $d = file_get_contents('manifest.json');
    echo $d;
}
