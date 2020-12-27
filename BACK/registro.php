<?php
include_once 'conexion_bd.php';

$nombre=$_POST['nombre'];
$dni = $_POST['dni'];
$email=$_POST['email'];
$contrasena=$_POST['pass'];
$direccion=$_POST['direccion'];
$poblacion=$_POST['poblacion'];
$ciudad=$_POST['ciudad'];
$pais=$_POST['pais'];

$ordenSQL = "INSERT INTO usuarios (idUsuario, dni, nombreUsuario, claveUsuario, correoUsuario, direccionUsuario, poblacionUsuario, ciudadUsuario, paisUsuario) VALUES(null, '$dni', '$nombre',AES_ENCRYPT('$contrasena','AngelDavid'),'$email','$direccion','$poblacion','$ciudad','$pais');";
$consulta = $conexion->query($ordenSQL);
$resultado="";
	if($consulta==null){
           $resultado="mal";
           echo json_encode($resultado);
        }else {
           $resultado="bien";
           echo json_encode($resultado);  
        }

$conexion->close();