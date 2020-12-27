<?php
include_once 'conexion_bd.php';

$dni=$_POST['dni'];

$ordenSQL = "SELECT idUsuario, dni, nombreUsuario, correoUsuario, direccionUsuario, ciudadUsuario, poblacionUsuario, paisUsuario FROM USUARIOS  WHERE dni ='$dni';";
$consulta = $conexion->query($ordenSQL);
$arrayResultado = Array();
if ($consulta) {
    $fila = $consulta->fetch_array();
    while ($fila) {
        $arrayResultado[] = $fila;
        $fila = $consulta->fetch_array();
    }
}
echo json_encode($arrayResultado);
$conexion->close();