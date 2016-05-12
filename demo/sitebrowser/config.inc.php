<?php

/*
 * sitebrowser dbms configuration
 */
$i = 0;

/*
 * First server
 */
$i++;

/* Authentication type and info */
$db_name     = modeler;
$db_host     = localhost;
$db_user     = modeler;
$db_password = ;

$cfg['Servers'][$i]['auth_type'] = 'config';
$cfg['Servers'][$i]['user'] = 'modeler';
$cfg['Servers'][$i]['password'] = '';
$cfg['Servers'][$i]['extension'] = 'mysqli';
$cfg['Servers'][$i]['AllowNoPassword'] = true;
$cfg['Lang'] = 'en';

/* Bind to the localhost ipv4 address and tcp */
$cfg['Servers'][$i]['host'] = '127.0.0.1';
$cfg['Servers'][$i]['connect_type'] = 'tcp';

/* Advanced objtree features */
$cfg['Servers'][$i]['a'] = 'tbd';
$cfg['Servers'][$i]['b'] = 'tbd';
$cfg['Servers'][$i]['c'] = 'tbd';

/*
 * End of sitebrowser servers configuration
 */

?>
